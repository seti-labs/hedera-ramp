"""
Intersend integration routes for on-ramp and off-ramp operations.
Supports mobile money payments and transfers via Intersend API.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Transaction, User, db
from middleware import token_required, kyc_required, validate_request_data, get_current_user, active_user_required
from hedera_service import HederaService
import requests
import os
import json

# Initialize Hedera service for smart contract integration
hedera_service = HederaService(
    network=os.getenv('HEDERA_NETWORK', 'testnet'),
    operator_id=os.getenv('HEDERA_OPERATOR_ID'),
    operator_key=os.getenv('HEDERA_OPERATOR_KEY'),
    contract_id=os.getenv('HEDERA_CONTRACT_ID')
)

intersend_bp = Blueprint('intersend', __name__, url_prefix='/api/intersend')


def get_intersend_access_token():
    """
    Get Intersend API access token.
    This requires Intersend API credentials.
    """
    api_key = os.getenv('INTERSEND_API_KEY')
    api_url = os.getenv('INTERSEND_API_URL', 'https://api.intersend.com')
    
    if not api_key:
        return None
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Intersend typically uses API key authentication
        # You might need to implement token refresh if required
        return api_key
        
    except Exception as e:
        print(f"Error getting Intersend token: {e}")
        return None


def make_intersend_request(endpoint, method='GET', data=None):
    """
    Make a request to Intersend API.
    """
    api_url = os.getenv('INTERSEND_API_URL', 'https://api.intersend.com')
    api_key = os.getenv('INTERSEND_API_KEY')
    
    if not api_key:
        return None
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    try:
        url = f"{api_url}{endpoint}"
        
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        else:
            return None
            
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Intersend API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error making Intersend request: {e}")
        return None


@intersend_bp.route('/onramp/initiate', methods=['POST'])
@token_required
@active_user_required
@kyc_required
@validate_request_data(['amount', 'phone_number', 'crypto_amount'])
def initiate_intersend_onramp():
    """
    Initiate Intersend on-ramp transaction.
    User pays via mobile money to buy cryptocurrency.
    """
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        amount = float(data['amount'])
        phone_number = data['phone_number']
        crypto_amount = data.get('crypto_amount', '0')
        
        # Validate amount limits
        if amount < 25 or amount > 150000:
            return jsonify({
                'error': 'Invalid amount',
                'message': 'Amount must be between 25 and 150,000 KES'
            }), 400
        
        # Create transaction record
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='onramp',
            amount=crypto_amount,
            fiat_amount=amount,
            currency='KES',
            status='pending',
            payment_method='intersend',
            notes=f'Intersend on-ramp: {amount} KES for {crypto_amount} HBAR',
            transaction_metadata=json.dumps({
                'phone_number': phone_number,
                'amount_kes': amount,
                'crypto_amount': crypto_amount,
                'payment_provider': 'intersend'
            })
        )
        
        db.session.add(transaction)
        db.session.flush()  # Get transaction ID
        
        # NEW: Call smart contract to initiate on-ramp transaction
        fiat_amount_wei = int(amount * 10**18)  # Convert KES to wei
        contract_result = hedera_service.initiate_onramp_transaction(
            current_user.wallet_address,
            fiat_amount_wei,
            phone_number
        )
        
        if not contract_result['success']:
            transaction.status = 'failed'
            transaction.notes = f"Smart contract error: {contract_result['error']}"
            db.session.commit()
            
            return jsonify({
                'error': 'Smart contract error',
                'message': contract_result['error']
            }), 500
        
        # Update transaction with contract info
        transaction.transaction_metadata = json.dumps({
            **json.loads(transaction.transaction_metadata),
            'contract_transaction_id': contract_result['transaction_id'],
            'contract_status': 'initiated'
        })
        
        # Call Intersend API to initiate payment
        intersend_data = {
            'amount': amount,
            'currency': 'KES',
            'phone_number': phone_number,
            'reference': f'ONRAMP_{transaction.id}',
            'callback_url': os.getenv('INTERSEND_CALLBACK_URL', 'https://yourdomain.com/api/intersend/callback'),
            'description': f'Buy {crypto_amount} HBAR with {amount} KES'
        }
        
        intersend_response = make_intersend_request('/payments/initiate', 'POST', intersend_data)
        
        if not intersend_response:
            transaction.status = 'failed'
            transaction.notes = 'Failed to initiate Intersend payment'
            db.session.commit()
            
            return jsonify({
                'error': 'Payment initiation failed',
                'message': 'Unable to initiate payment with Intersend'
            }), 500
        
        # Update transaction with Intersend response
        transaction.transaction_metadata = json.dumps({
            **json.loads(transaction.transaction_metadata),
            'intersend_transaction_id': intersend_response.get('transaction_id'),
            'intersend_reference': intersend_response.get('reference'),
            'status': intersend_response.get('status', 'pending')
        })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment initiated successfully',
            'transaction_id': transaction.id,
            'intersend_transaction_id': intersend_response.get('transaction_id'),
            'status': 'pending',
            'amount': amount,
            'crypto_amount': crypto_amount,
            'phone_number': phone_number
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to initiate Intersend onramp', 'message': str(e)}), 500


@intersend_bp.route('/offramp/initiate', methods=['POST'])
@token_required
@active_user_required
@kyc_required
@validate_request_data(['amount', 'phone_number', 'crypto_amount'])
def initiate_intersend_offramp():
    """
    Initiate Intersend off-ramp transaction.
    User sells cryptocurrency to receive mobile money.
    """
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        amount = float(data['amount'])
        phone_number = data['phone_number']
        crypto_amount = data.get('crypto_amount', '0')
        
        # Validate amount limits
        if amount < 25 or amount > 150000:
            return jsonify({
                'error': 'Invalid amount',
                'message': 'Amount must be between 25 and 150,000 KES'
            }), 400
        
        # Create transaction record
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='offramp',
            amount=crypto_amount,
            fiat_amount=amount,
            currency='KES',
            status='pending',
            payment_method='intersend',
            notes=f'Intersend off-ramp: {crypto_amount} HBAR for {amount} KES',
            transaction_metadata=json.dumps({
                'phone_number': phone_number,
                'amount_kes': amount,
                'crypto_amount': crypto_amount,
                'payment_provider': 'intersend'
            })
        )
        
        db.session.add(transaction)
        db.session.flush()  # Get transaction ID
        
        # NEW: Call smart contract to initiate off-ramp transaction
        hbar_amount_tinybars = int(float(crypto_amount) * 10**8)  # Convert HBAR to tinybars
        contract_result = hedera_service.initiate_offramp_transaction(
            current_user.wallet_address,
            hbar_amount_tinybars,
            phone_number
        )
        
        if not contract_result['success']:
            transaction.status = 'failed'
            transaction.notes = f"Smart contract error: {contract_result['error']}"
            db.session.commit()
            
            return jsonify({
                'error': 'Smart contract error',
                'message': contract_result['error']
            }), 500
        
        # Update transaction with contract info
        transaction.transaction_metadata = json.dumps({
            **json.loads(transaction.transaction_metadata),
            'contract_transaction_id': contract_result['transaction_id'],
            'contract_status': 'initiated'
        })
        
        # Call Intersend API to initiate transfer
        intersend_data = {
            'amount': amount,
            'currency': 'KES',
            'phone_number': phone_number,
            'reference': f'OFFRAMP_{transaction.id}',
            'callback_url': os.getenv('INTERSEND_CALLBACK_URL', 'https://yourdomain.com/api/intersend/callback'),
            'description': f'Sell {crypto_amount} HBAR for {amount} KES'
        }
        
        intersend_response = make_intersend_request('/transfers/initiate', 'POST', intersend_data)
        
        if not intersend_response:
            transaction.status = 'failed'
            transaction.notes = 'Failed to initiate Intersend transfer'
            db.session.commit()
            
            return jsonify({
                'error': 'Transfer initiation failed',
                'message': 'Unable to initiate transfer with Intersend'
            }), 500
        
        # Update transaction with Intersend response
        transaction.transaction_metadata = json.dumps({
            **json.loads(transaction.transaction_metadata),
            'intersend_transaction_id': intersend_response.get('transaction_id'),
            'intersend_reference': intersend_response.get('reference'),
            'status': intersend_response.get('status', 'pending')
        })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transfer initiated successfully',
            'transaction_id': transaction.id,
            'intersend_transaction_id': intersend_response.get('transaction_id'),
            'status': 'pending',
            'amount': amount,
            'crypto_amount': crypto_amount,
            'phone_number': phone_number
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to initiate Intersend offramp', 'message': str(e)}), 500


@intersend_bp.route('/callback', methods=['POST'])
def intersend_callback():
    """
    Intersend callback endpoint for payment/transfer results.
    This is called by Intersend after transaction completion.
    """
    try:
        data = request.get_json()
        
        # Extract callback data
        transaction_id = data.get('transaction_id')
        reference = data.get('reference')
        status = data.get('status')
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        
        # Find transaction by reference or transaction_id
        transaction = None
        if reference:
            # Extract our transaction ID from reference (e.g., "ONRAMP_123")
            if reference.startswith('ONRAMP_') or reference.startswith('OFFRAMP_'):
                our_transaction_id = reference.split('_')[1]
                transaction = Transaction.query.get(our_transaction_id)
        
        if not transaction and transaction_id:
            # Try to find by Intersend transaction ID in metadata
            transactions = Transaction.query.all()
            for t in transactions:
                metadata = json.loads(t.transaction_metadata or '{}')
                if metadata.get('intersend_transaction_id') == transaction_id:
                    transaction = t
                    break
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Update transaction based on status
        if status == 'completed':
            transaction.status = 'completed'
            transaction.completed_at = datetime.utcnow()
            transaction.hedera_transaction_id = transaction_id
            transaction.notes = f"Intersend payment successful. Transaction ID: {transaction_id}"
            
            # NEW: Update smart contract transaction status
            contract_status = 2  # COMPLETED
            contract_result = hedera_service.update_transaction_status(
                transaction.id,
                contract_status,
                transaction_id,
                f"Intersend payment completed. Transaction ID: {transaction_id}"
            )
            
            if contract_result['success']:
                # Update transaction metadata with contract update
                metadata = json.loads(transaction.transaction_metadata or '{}')
                metadata.update({
                    'contract_status_updated': True,
                    'contract_update_transaction_id': contract_result['transaction_id']
                })
                transaction.transaction_metadata = json.dumps(metadata)
            
        elif status == 'failed':
            transaction.status = 'failed'
            transaction.notes = f"Intersend payment failed. Transaction ID: {transaction_id}"
            
            # NEW: Update smart contract transaction status
            contract_status = 3  # FAILED
            contract_result = hedera_service.update_transaction_status(
                transaction.id,
                contract_status,
                transaction_id,
                f"Intersend payment failed. Transaction ID: {transaction_id}"
            )
            
        elif status == 'cancelled':
            transaction.status = 'cancelled'
            transaction.notes = f"Intersend payment cancelled. Transaction ID: {transaction_id}"
            
            # NEW: Update smart contract transaction status
            contract_status = 4  # CANCELLED
            contract_result = hedera_service.update_transaction_status(
                transaction.id,
                contract_status,
                transaction_id,
                f"Intersend payment cancelled. Transaction ID: {transaction_id}"
            )
        
        # Update metadata
        metadata = json.loads(transaction.transaction_metadata or '{}')
        metadata.update({
            'intersend_status': status,
            'intersend_amount': amount,
            'intersend_phone': phone_number,
            'callback_received_at': datetime.utcnow().isoformat()
        })
        transaction.transaction_metadata = json.dumps(metadata)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Callback processed successfully',
            'transaction_id': transaction.id,
            'status': status
        }), 200
        
    except Exception as e:
        print(f"Intersend callback error: {e}")
        return jsonify({
            'error': 'Internal error processing callback',
            'message': str(e)
        }), 500


@intersend_bp.route('/rates', methods=['GET'])
def get_intersend_rates():
    """
    Get current exchange rates from Intersend.
    """
    try:
        # Call Intersend API to get rates
        rates_response = make_intersend_request('/rates')
        
        if not rates_response:
            # Fallback rates if API fails
            return jsonify({
                'KES_TO_HBAR': 0.0235,  # Example rate
                'HBAR_TO_KES': 42.55,   # Example rate
                'last_updated': datetime.utcnow().isoformat(),
                'currency': 'KES',
                'provider': 'intersend_fallback'
            }), 200
        
        # Process Intersend rates response
        rates = {
            'KES_TO_HBAR': rates_response.get('kes_to_hbar', 0.0235),
            'HBAR_TO_KES': rates_response.get('hbar_to_kes', 42.55),
            'last_updated': rates_response.get('last_updated', datetime.utcnow().isoformat()),
            'currency': 'KES',
            'provider': 'intersend'
        }
        
        return jsonify(rates), 200
        
    except Exception as e:
        print(f"Error getting Intersend rates: {e}")
        # Return fallback rates
        return jsonify({
            'KES_TO_HBAR': 0.0235,
            'HBAR_TO_KES': 42.55,
            'last_updated': datetime.utcnow().isoformat(),
            'currency': 'KES',
            'provider': 'intersend_fallback'
        }), 200


@intersend_bp.route('/status/<transaction_id>', methods=['GET'])
@token_required
def get_intersend_transaction_status(transaction_id):
    """
    Get status of a specific Intersend transaction.
    """
    try:
        current_user = get_current_user()
        
        # Find transaction
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            user_id=current_user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Get metadata
        metadata = json.loads(transaction.transaction_metadata or '{}')
        intersend_transaction_id = metadata.get('intersend_transaction_id')
        
        if not intersend_transaction_id:
            return jsonify({
                'transaction_id': transaction.id,
                'status': transaction.status,
                'message': 'No Intersend transaction ID found'
            }), 200
        
        # Query Intersend API for current status
        status_response = make_intersend_request(f'/transactions/{intersend_transaction_id}')
        
        if status_response:
            # Update local transaction if status changed
            intersend_status = status_response.get('status')
            if intersend_status and intersend_status != transaction.status:
                if intersend_status == 'completed':
                    transaction.status = 'completed'
                    transaction.completed_at = datetime.utcnow()
                elif intersend_status == 'failed':
                    transaction.status = 'failed'
                
                db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'status': transaction.status,
            'amount': transaction.fiat_amount,
            'crypto_amount': transaction.amount,
            'currency': transaction.currency,
            'created_at': transaction.created_at.isoformat(),
            'completed_at': transaction.completed_at.isoformat() if transaction.completed_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get transaction status', 'message': str(e)}), 500


@intersend_bp.route('/config', methods=['GET'])
def get_intersend_config():
    """
    Get Intersend configuration and supported features.
    """
    try:
        config = {
            'provider': 'intersend',
            'supported_currencies': ['KES'],
            'supported_countries': ['KE'],
            'min_amount': 25,
            'max_amount': 150000,
            'phone_number_format': '254XXXXXXXXX',
            'supported_countries': ['KE'],
            'features': {
                'onramp': True,
                'offramp': True,
                'real_time_rates': True,
                'instant_transfers': True
            }
        }
        
        return jsonify(config), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get config', 'message': str(e)}), 500
