"""
Simple RampHub smart contract integration routes.
"""

from flask import Blueprint, request, jsonify
from middleware import token_required, get_current_user, kyc_required, active_user_required
from hedera_service import HederaService
import os

ramp_bp = Blueprint('ramp', __name__, url_prefix='/api/ramp')

# Initialize Hedera service
hedera_service = HederaService(
    network=os.getenv('HEDERA_NETWORK', 'testnet'),
    operator_id=os.getenv('HEDERA_OPERATOR_ID'),
    operator_key=os.getenv('HEDERA_OPERATOR_KEY'),
    contract_id=os.getenv('HEDERA_CONTRACT_ID')
)

@ramp_bp.route('/users/register', methods=['POST'])
@token_required
@active_user_required
def register_user():
    """Register user on RampHub contract"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        phone_number = data.get('phone_number')
        if not phone_number:
            return jsonify({'error': 'Phone number required'}), 400
        
        result = hedera_service.register_user_simple(
            current_user.wallet_address,
            phone_number
        )
        
        if result['success']:
            return jsonify({
                'message': 'User registered successfully',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/users/verify-kyc', methods=['POST'])
@token_required
@active_user_required
def verify_kyc():
    """Verify user KYC on RampHub contract"""
    try:
        current_user = get_current_user()
        
        result = hedera_service.verify_kyc_simple(
            current_user.wallet_address
        )
        
        if result['success']:
            return jsonify({
                'message': 'KYC verified successfully',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/transactions/create', methods=['POST'])
@token_required
@active_user_required
@kyc_required
def create_transaction():
    """Create transaction on RampHub contract"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        is_on_ramp = data.get('is_on_ramp', True)
        amount = data.get('amount')
        currency = data.get('currency', 'KES')
        
        if not amount:
            return jsonify({'error': 'Amount required'}), 400
        
        result = hedera_service.create_transaction_simple(
            current_user.wallet_address,
            is_on_ramp,
            int(amount),
            currency
        )
        
        if result['success']:
            return jsonify({
                'message': 'Transaction created successfully',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/transactions/<transaction_id>/complete', methods=['POST'])
@token_required
def complete_transaction(transaction_id):
    """Complete transaction on RampHub contract"""
    try:
        result = hedera_service.complete_transaction_simple(int(transaction_id))
        
        if result['success']:
            return jsonify({
                'message': 'Transaction completed successfully',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/rates/update', methods=['POST'])
@token_required
def update_rates():
    """Update exchange rates on RampHub contract"""
    try:
        data = request.get_json()
        
        kes_to_hbar = data.get('kes_to_hbar')
        hbar_to_kes = data.get('hbar_to_kes')
        
        if not kes_to_hbar or not hbar_to_kes:
            return jsonify({'error': 'Both rates required'}), 400
        
        result = hedera_service.update_rates_simple(int(kes_to_hbar), int(hbar_to_kes))
        
        if result['success']:
            return jsonify({
                'message': 'Exchange rates updated successfully',
                'transaction_id': result['transaction_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/rates/current', methods=['GET'])
def get_rates():
    """Get current exchange rates from RampHub contract"""
    try:
        result = hedera_service.get_rates_simple()
        
        if result['success']:
            return jsonify({
                'exchange_rates': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/calculate-hbar', methods=['GET'])
def calculate_hbar():
    """Calculate HBAR amount for KES"""
    try:
        kes_amount = request.args.get('kes_amount')
        if not kes_amount:
            return jsonify({'error': 'KES amount required'}), 400
        
        result = hedera_service.calculate_hbar_simple(int(kes_amount))
        
        if result['success']:
            return jsonify({
                'hbar_amount': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/calculate-kes', methods=['GET'])
def calculate_kes():
    """Calculate KES amount for HBAR"""
    try:
        hbar_amount = request.args.get('hbar_amount')
        if not hbar_amount:
            return jsonify({'error': 'HBAR amount required'}), 400
        
        result = hedera_service.calculate_kes_simple(int(hbar_amount))
        
        if result['success']:
            return jsonify({
                'kes_amount': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get platform statistics from RampHub contract"""
    try:
        result = hedera_service.get_stats_simple()
        
        if result['success']:
            return jsonify({
                'platform_stats': result['data']
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ramp_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for RampHub service"""
    try:
        result = hedera_service.get_stats_simple()
        
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
