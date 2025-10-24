"""
Hedera smart contract integration routes.
Provides API endpoints for interacting with the HederaRampHub smart contract.
"""

from flask import Blueprint, request, jsonify
from middleware import token_required, get_current_user, kyc_required, active_user_required
from hedera_service import HederaService
import os

hedera_bp = Blueprint('hedera', __name__, url_prefix='/api/hedera')

# Initialize Hedera service
hedera_service = HederaService(
    network=os.getenv('HEDERA_NETWORK', 'testnet'),
    operator_id=os.getenv('HEDERA_OPERATOR_ID'),
    operator_key=os.getenv('HEDERA_OPERATOR_KEY'),
    contract_id=os.getenv('HEDERA_CONTRACT_ID')
)

@hedera_bp.route('/users/register', methods=['POST'])
@token_required
@active_user_required
def register_user_on_contract():
    """Register user on smart contract"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        phone_number = data.get('phone_number')
        country_code = data.get('country_code', 'KE')
        
        if not phone_number:
            return jsonify({'error': 'Phone number required'}), 400
        
        result = hedera_service.register_user_on_contract(
            current_user.wallet_address,
            phone_number,
            country_code
        )
        
        if result['success']:
            return jsonify({
                'message': 'User registered on smart contract',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/users/verify-kyc', methods=['POST'])
@token_required
@active_user_required
def verify_user_kyc_on_contract():
    """Verify user KYC on smart contract"""
    try:
        current_user = get_current_user()
        
        result = hedera_service.verify_user_kyc_on_contract(
            current_user.wallet_address
        )
        
        if result['success']:
            return jsonify({
                'message': 'KYC verified on smart contract',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/users/<user_address>', methods=['GET'])
@token_required
def get_user_info_from_contract(user_address):
    """Get user info from smart contract"""
    try:
        result = hedera_service.get_user_info_from_contract(user_address)
        
        if result['success']:
            return jsonify({
                'user_info': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/transactions/onramp', methods=['POST'])
@token_required
@active_user_required
@kyc_required
def initiate_onramp_transaction():
    """Initiate on-ramp transaction on smart contract"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        fiat_amount = data.get('fiat_amount')
        phone_number = data.get('phone_number')
        
        if not fiat_amount or not phone_number:
            return jsonify({'error': 'Fiat amount and phone number required'}), 400
        
        # Convert KES amount to wei (multiply by 10^18)
        fiat_amount_wei = int(float(fiat_amount) * 10**18)
        
        result = hedera_service.initiate_onramp_transaction(
            current_user.wallet_address,
            fiat_amount_wei,
            phone_number
        )
        
        if result['success']:
            return jsonify({
                'message': 'On-ramp transaction initiated',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/transactions/offramp', methods=['POST'])
@token_required
@active_user_required
@kyc_required
def initiate_offramp_transaction():
    """Initiate off-ramp transaction on smart contract"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        hbar_amount = data.get('hbar_amount')
        phone_number = data.get('phone_number')
        
        if not hbar_amount or not phone_number:
            return jsonify({'error': 'HBAR amount and phone number required'}), 400
        
        # Convert HBAR amount to tinybars (multiply by 10^8)
        hbar_amount_tinybars = int(float(hbar_amount) * 10**8)
        
        result = hedera_service.initiate_offramp_transaction(
            current_user.wallet_address,
            hbar_amount_tinybars,
            phone_number
        )
        
        if result['success']:
            return jsonify({
                'message': 'Off-ramp transaction initiated',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/transactions/<transaction_id>/status', methods=['PUT'])
@token_required
def update_transaction_status(transaction_id):
    """Update transaction status on smart contract"""
    try:
        data = request.get_json()
        
        status = data.get('status')
        intersend_id = data.get('intersend_transaction_id', '')
        notes = data.get('notes', '')
        
        if status is None:
            return jsonify({'error': 'Status required'}), 400
        
        result = hedera_service.update_transaction_status(
            int(transaction_id),
            status,
            intersend_id,
            notes
        )
        
        if result['success']:
            return jsonify({
                'message': 'Transaction status updated',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/transactions/<transaction_id>', methods=['GET'])
@token_required
def get_transaction_info(transaction_id):
    """Get transaction info from smart contract"""
    try:
        result = hedera_service.get_transaction_info_from_contract(int(transaction_id))
        
        if result['success']:
            return jsonify({
                'transaction_info': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/rates/update', methods=['POST'])
@token_required
def update_exchange_rates():
    """Update exchange rates on smart contract"""
    try:
        data = request.get_json()
        
        kes_to_hbar = data.get('kes_to_hbar')
        hbar_to_kes = data.get('hbar_to_kes')
        
        if not kes_to_hbar or not hbar_to_kes:
            return jsonify({'error': 'Both rates required'}), 400
        
        result = hedera_service.update_exchange_rates(int(kes_to_hbar), int(hbar_to_kes))
        
        if result['success']:
            return jsonify({
                'message': 'Exchange rates updated',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/rates/current', methods=['GET'])
def get_current_rates():
    """Get current exchange rates from smart contract"""
    try:
        result = hedera_service.get_exchange_rates_from_contract()
        
        if result['success']:
            return jsonify({
                'exchange_rates': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/rates/calculate-hbar', methods=['GET'])
def calculate_hbar_amount():
    """Calculate HBAR amount for given KES amount"""
    try:
        kes_amount = request.args.get('kes_amount')
        
        if not kes_amount:
            return jsonify({'error': 'KES amount required'}), 400
        
        # Convert to wei
        kes_amount_wei = int(float(kes_amount) * 10**18)
        
        result = hedera_service.calculate_hbar_amount(kes_amount_wei)
        
        if result['success']:
            return jsonify({
                'hbar_amount': result['hbar_amount']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/rates/calculate-kes', methods=['GET'])
def calculate_kes_amount():
    """Calculate KES amount for given HBAR amount"""
    try:
        hbar_amount = request.args.get('hbar_amount')
        
        if not hbar_amount:
            return jsonify({'error': 'HBAR amount required'}), 400
        
        # Convert to tinybars
        hbar_amount_tinybars = int(float(hbar_amount) * 10**8)
        
        result = hedera_service.calculate_kes_amount(hbar_amount_tinybars)
        
        if result['success']:
            return jsonify({
                'kes_amount': result['kes_amount']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/platform/stats', methods=['GET'])
def get_platform_stats():
    """Get platform statistics from smart contract"""
    try:
        result = hedera_service.get_platform_stats_from_contract()
        
        if result['success']:
            return jsonify({
                'platform_stats': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hedera_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for Hedera service"""
    try:
        # Try to get platform stats to verify connection
        result = hedera_service.get_platform_stats_from_contract()
        
        if result['success']:
            return jsonify({
                'status': 'healthy',
                'network': hedera_service.network,
                'contract_id': hedera_service.contract_id
            }), 200
        else:
            return jsonify({
                'status': 'unhealthy',
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
