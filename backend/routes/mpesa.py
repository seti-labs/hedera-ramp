"""
M-Pesa integration routes for on-ramp and off-ramp operations.
Supports STK Push (Lipa na M-Pesa) and payment status queries.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Transaction, User, db
from middleware import token_required, kyc_required, validate_request_data, get_current_user, active_user_required
import requests
import base64
import os
from datetime import datetime

mpesa_bp = Blueprint('mpesa', __name__, url_prefix='/api/mpesa')


def get_mpesa_access_token():
    """
    Get M-Pesa API access token.
    This requires M-Pesa API credentials from Safaricom.
    """
    consumer_key = os.getenv('MPESA_CONSUMER_KEY')
    consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
    api_url = os.getenv('MPESA_API_URL', 'https://sandbox.safaricom.co.ke')
    
    if not consumer_key or not consumer_secret:
        return None
    
    try:
        credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        
        response = requests.get(
            f"{api_url}/oauth/v1/generate?grant_type=client_credentials",
            headers={'Authorization': f'Basic {credentials}'}
        )
        
        if response.status_code == 200:
            return response.json().get('access_token')
        
        return None
    except Exception as e:
        print(f"Error getting M-Pesa token: {e}")
        return None


def generate_mpesa_password(shortcode, passkey, timestamp):
    """Generate M-Pesa API password."""
    data = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(data.encode()).decode()


@mpesa_bp.route('/onramp/initiate', methods=['POST'])
@token_required
@active_user_required
@kyc_required
@validate_request_data(['amount', 'phone_number'])
def initiate_mpesa_onramp():
    """
    Initiate M-Pesa on-ramp (STK Push).
    User pays via M-Pesa to buy crypto.
    
    Required fields:
    - amount: Amount in KES (Kenyan Shillings)
    - phone_number: M-Pesa phone number (format: 254XXXXXXXXX)
    
    Optional fields:
    - crypto_amount: Equivalent crypto amount
    - account_reference: Reference for the transaction
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    amount = float(data['amount'])
    phone_number = data['phone_number']
    
    # Validate phone number format
    if not phone_number.startswith('254') or len(phone_number) != 12:
        return jsonify({'error': 'Invalid phone number format. Use 254XXXXXXXXX'}), 400
    
    # Validate amount (M-Pesa has minimum and maximum limits)
    if amount < 25:
        return jsonify({'error': 'Minimum on-ramp amount is 25 KES'}), 400
    
    if amount > 150000:
        return jsonify({'error': 'Amount cannot exceed 150,000 KES'}), 400
    
    try:
        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            transaction_type='onramp',
            amount=data.get('crypto_amount', '0'),  # Will be calculated based on rate
            fiat_amount=str(amount),
            currency='KES',
            payment_method='mpesa',
            status='pending',
            notes=f"M-Pesa onramp from {phone_number}"
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Get M-Pesa access token
        access_token = get_mpesa_access_token()
        
        if not access_token:
            transaction.status = 'failed'
            transaction.notes = 'Failed to authenticate with M-Pesa API'
            db.session.commit()
            return jsonify({
                'error': 'M-Pesa service temporarily unavailable',
                'transaction_id': transaction.id
            }), 503
        
        # M-Pesa STK Push configuration
        business_shortcode = os.getenv('MPESA_SHORTCODE')
        passkey = os.getenv('MPESA_PASSKEY')
        api_url = os.getenv('MPESA_API_URL', 'https://sandbox.safaricom.co.ke')
        callback_url = os.getenv('MPESA_CALLBACK_URL', 'https://yourdomain.com/api/mpesa/callback')
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = generate_mpesa_password(business_shortcode, passkey, timestamp)
        
        # STK Push request payload
        stk_push_payload = {
            'BusinessShortCode': business_shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': business_shortcode,
            'PhoneNumber': phone_number,
            'CallBackURL': callback_url,
            'AccountReference': data.get('account_reference', f'TXN{transaction.id}'),
            'TransactionDesc': f'Crypto Purchase - Transaction {transaction.id}'
        }
        
        # Send STK Push request
        response = requests.post(
            f"{api_url}/mpesa/stkpush/v1/processrequest",
            json=stk_push_payload,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        mpesa_response = response.json()
        
        if mpesa_response.get('ResponseCode') == '0':
            # STK Push sent successfully
            transaction.status = 'processing'
            transaction.transaction_metadata = str({
                'checkout_request_id': mpesa_response.get('CheckoutRequestID'),
                'merchant_request_id': mpesa_response.get('MerchantRequestID'),
                'phone_number': phone_number
            })
            db.session.commit()
            
            return jsonify({
                'message': 'M-Pesa payment initiated. Check your phone for payment prompt.',
                'transaction_id': transaction.id,
                'checkout_request_id': mpesa_response.get('CheckoutRequestID'),
                'merchant_request_id': mpesa_response.get('MerchantRequestID'),
                'amount': amount,
                'currency': 'KES'
            }), 201
        else:
            # STK Push failed
            transaction.status = 'failed'
            transaction.notes = f"M-Pesa error: {mpesa_response.get('ResponseDescription', 'Unknown error')}"
            db.session.commit()
            
            return jsonify({
                'error': 'Failed to initiate M-Pesa payment',
                'message': mpesa_response.get('ResponseDescription', 'Unknown error'),
                'transaction_id': transaction.id
            }), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to initiate M-Pesa payment', 'message': str(e)}), 500


@mpesa_bp.route('/offramp/initiate', methods=['POST'])
@token_required
@active_user_required
@kyc_required
@validate_request_data(['amount', 'phone_number', 'crypto_amount'])
def initiate_mpesa_offramp():
    """
    Initiate M-Pesa off-ramp (B2C Payment).
    User sells crypto and receives M-Pesa payment.
    
    Required fields:
    - amount: Amount in KES to receive
    - phone_number: M-Pesa phone number (format: 254XXXXXXXXX)
    - crypto_amount: Amount of crypto to sell
    
    Optional fields:
    - notes: Additional notes
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    amount = float(data['amount'])
    phone_number = data['phone_number']
    crypto_amount = data['crypto_amount']
    
    # Validate phone number format
    if not phone_number.startswith('254') or len(phone_number) != 12:
        return jsonify({'error': 'Invalid phone number format. Use 254XXXXXXXXX'}), 400
    
    # Validate amount
    if amount < 25:
        return jsonify({'error': 'Minimum off-ramp amount is 25 KES'}), 400
    
    if amount > 150000:
        return jsonify({'error': 'Amount cannot exceed 150,000 KES'}), 400
    
    try:
        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            transaction_type='offramp',
            amount=str(crypto_amount),
            fiat_amount=str(amount),
            currency='KES',
            payment_method='mpesa',
            status='pending',
            notes=data.get('notes', f"M-Pesa offramp to {phone_number}")
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # In production, you would:
        # 1. Lock/burn the user's crypto
        # 2. Verify sufficient balance
        # 3. Process the M-Pesa B2C payment
        # 4. Update transaction status based on M-Pesa response
        
        # Get M-Pesa access token
        access_token = get_mpesa_access_token()
        
        if not access_token:
            transaction.status = 'failed'
            transaction.notes = 'Failed to authenticate with M-Pesa API'
            db.session.commit()
            return jsonify({
                'error': 'M-Pesa service temporarily unavailable',
                'transaction_id': transaction.id
            }), 503
        
        # M-Pesa B2C configuration
        initiator_name = os.getenv('MPESA_INITIATOR_NAME')
        security_credential = os.getenv('MPESA_SECURITY_CREDENTIAL')
        business_shortcode = os.getenv('MPESA_SHORTCODE')
        api_url = os.getenv('MPESA_API_URL', 'https://sandbox.safaricom.co.ke')
        queue_timeout_url = os.getenv('MPESA_QUEUE_TIMEOUT_URL', 'https://yourdomain.com/api/mpesa/timeout')
        result_url = os.getenv('MPESA_RESULT_URL', 'https://yourdomain.com/api/mpesa/result')
        
        # B2C Payment request payload
        b2c_payload = {
            'InitiatorName': initiator_name,
            'SecurityCredential': security_credential,
            'CommandID': 'BusinessPayment',
            'Amount': int(amount),
            'PartyA': business_shortcode,
            'PartyB': phone_number,
            'Remarks': f'Crypto Sale Payment - Transaction {transaction.id}',
            'QueueTimeOutURL': queue_timeout_url,
            'ResultURL': result_url,
            'Occasion': f'TXN{transaction.id}'
        }
        
        # Send B2C request
        response = requests.post(
            f"{api_url}/mpesa/b2c/v1/paymentrequest",
            json=b2c_payload,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        mpesa_response = response.json()
        
        if mpesa_response.get('ResponseCode') == '0':
            # B2C payment initiated
            transaction.status = 'processing'
            transaction.transaction_metadata = str({
                'conversation_id': mpesa_response.get('ConversationID'),
                'originator_conversation_id': mpesa_response.get('OriginatorConversationID'),
                'phone_number': phone_number
            })
            db.session.commit()
            
            return jsonify({
                'message': 'M-Pesa payment initiated. You will receive money shortly.',
                'transaction_id': transaction.id,
                'conversation_id': mpesa_response.get('ConversationID'),
                'amount': amount,
                'currency': 'KES',
                'phone_number': phone_number
            }), 201
        else:
            transaction.status = 'failed'
            transaction.notes = f"M-Pesa error: {mpesa_response.get('ResponseDescription', 'Unknown error')}"
            db.session.commit()
            
            return jsonify({
                'error': 'Failed to initiate M-Pesa payment',
                'message': mpesa_response.get('ResponseDescription', 'Unknown error'),
                'transaction_id': transaction.id
            }), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to initiate M-Pesa offramp', 'message': str(e)}), 500


@mpesa_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    """
    M-Pesa callback endpoint for STK Push results.
    This is called by Safaricom after payment completion.
    """
    try:
        data = request.get_json()
        
        # Extract callback data
        callback_body = data.get('Body', {}).get('stkCallback', {})
        result_code = callback_body.get('ResultCode')
        result_desc = callback_body.get('ResultDesc')
        checkout_request_id = callback_body.get('CheckoutRequestID')
        
        # Find transaction by checkout_request_id
        transaction = Transaction.query.filter(
            Transaction.transaction_metadata.contains(checkout_request_id)
        ).first()
        
        if not transaction:
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Transaction not found'}), 404
        
        if result_code == 0:
            # Payment successful
            callback_metadata = callback_body.get('CallbackMetadata', {}).get('Item', [])
            
            # Extract payment details
            mpesa_receipt = None
            amount = None
            phone_number = None
            
            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt = item.get('Value')
                elif item.get('Name') == 'Amount':
                    amount = item.get('Value')
                elif item.get('Name') == 'PhoneNumber':
                    phone_number = item.get('Value')
            
            # Update transaction
            transaction.status = 'completed'
            transaction.completed_at = datetime.utcnow()
            transaction.hedera_transaction_id = mpesa_receipt
            transaction.notes = f"M-Pesa payment successful. Receipt: {mpesa_receipt}"
            
            # TODO: Trigger crypto transfer to user's wallet via Hedera
            
            db.session.commit()
            
            return jsonify({
                'ResultCode': 0,
                'ResultDesc': 'Payment processed successfully'
            }), 200
        else:
            # Payment failed or cancelled
            transaction.status = 'failed'
            transaction.notes = f"M-Pesa payment failed: {result_desc}"
            db.session.commit()
            
            return jsonify({
                'ResultCode': 1,
                'ResultDesc': result_desc
            }), 200
            
    except Exception as e:
        print(f"M-Pesa callback error: {e}")
        return jsonify({
            'ResultCode': 1,
            'ResultDesc': 'Internal error processing callback'
        }), 500


@mpesa_bp.route('/result', methods=['POST'])
def mpesa_result():
    """
    M-Pesa result endpoint for B2C payments.
    This is called by Safaricom after B2C payment completion.
    """
    try:
        data = request.get_json()
        
        result = data.get('Result', {})
        result_code = result.get('ResultCode')
        result_desc = result.get('ResultDesc')
        conversation_id = result.get('ConversationID')
        
        # Find transaction by conversation_id
        transaction = Transaction.query.filter(
            Transaction.transaction_metadata.contains(conversation_id)
        ).first()
        
        if not transaction:
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Transaction not found'}), 404
        
        if result_code == 0:
            # Payment successful
            result_parameters = result.get('ResultParameters', {}).get('ResultParameter', [])
            
            # Extract payment details
            transaction_id = None
            amount = None
            
            for param in result_parameters:
                if param.get('Key') == 'TransactionID':
                    transaction_id = param.get('Value')
                elif param.get('Key') == 'TransactionAmount':
                    amount = param.get('Value')
            
            # Update transaction
            transaction.status = 'completed'
            transaction.completed_at = datetime.utcnow()
            transaction.hedera_transaction_id = transaction_id
            transaction.notes = f"M-Pesa payment successful. Transaction ID: {transaction_id}"
            
            db.session.commit()
            
            return jsonify({
                'ResultCode': 0,
                'ResultDesc': 'Payment processed successfully'
            }), 200
        else:
            # Payment failed
            transaction.status = 'failed'
            transaction.notes = f"M-Pesa payment failed: {result_desc}"
            db.session.commit()
            
            return jsonify({
                'ResultCode': 1,
                'ResultDesc': result_desc
            }), 200
            
    except Exception as e:
        print(f"M-Pesa result error: {e}")
        return jsonify({
            'ResultCode': 1,
            'ResultDesc': 'Internal error processing result'
        }), 500


@mpesa_bp.route('/status/<int:transaction_id>', methods=['GET'])
@token_required
@active_user_required
def get_mpesa_transaction_status(transaction_id):
    """
    Get the status of an M-Pesa transaction.
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    if transaction.payment_method != 'mpesa':
        return jsonify({'error': 'Transaction is not an M-Pesa transaction'}), 400
    
    return jsonify({
        'transaction_id': transaction.id,
        'status': transaction.status,
        'transaction_type': transaction.transaction_type,
        'amount': transaction.fiat_amount,
        'currency': transaction.currency,
        'created_at': transaction.created_at.isoformat(),
        'completed_at': transaction.completed_at.isoformat() if transaction.completed_at else None,
        'notes': transaction.notes
    }), 200


@mpesa_bp.route('/rates', methods=['GET'])
def get_mpesa_rates():
    """
    Get current exchange rates for KES to crypto.
    This should be connected to a real exchange rate API.
    """
    # TODO: Connect to real exchange rate API
    # For now, return mock rates
    
    rates = {
        'KES_TO_HBAR': 0.0234,  # Example: 1 KES = 0.0234 HBAR
        'HBAR_TO_KES': 42.74,    # Example: 1 HBAR = 42.74 KES
        'last_updated': datetime.utcnow().isoformat(),
        'currency': 'KES'
    }
    
    return jsonify(rates), 200


@mpesa_bp.route('/config', methods=['GET'])
def get_mpesa_config():
    """
    Get M-Pesa configuration details (public information only).
    """
    return jsonify({
        'enabled': bool(os.getenv('MPESA_CONSUMER_KEY')),
        'currency': 'KES',
        'min_onramp_amount': 25,
        'max_onramp_amount': 150000,
        'min_offramp_amount': 25,
        'min_offramp_hbar': 2,
        'max_offramp_amount': 150000,
        'phone_number_format': '254XXXXXXXXX',
        'supported_countries': ['KE']  # Kenya
    }), 200

