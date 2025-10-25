"""
Wallet operations route for Hedera Ramp Hub API.
Handles wallet data from frontend without requiring Hedera SDK on backend.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Transaction
from datetime import datetime
import json

wallet_bp = Blueprint('wallet', __name__, url_prefix='/api/wallet')

@wallet_bp.route('/balance', methods=['POST'])
@jwt_required()
def update_balance():
    """Update user's wallet balance from frontend."""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not data or 'balance' not in data:
            return jsonify({'error': 'Balance data required'}), 400
        
        # Update user's wallet balance
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.wallet_balance = data['balance']
        db.session.commit()
        
        return jsonify({
            'message': 'Balance updated successfully',
            'balance': data['balance']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/transaction', methods=['POST'])
@jwt_required()
def record_transaction():
    """Record a transaction from frontend wallet operation."""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        required_fields = ['transaction_id', 'amount', 'type', 'status']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            transaction_id=data['transaction_id'],
            amount=data['amount'],
            transaction_type=data['type'],
            status=data['status'],
            hedera_account_id=data.get('hedera_account_id'),
            metadata=json.dumps(data.get('metadata', {}))
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction recorded successfully',
            'transaction_id': transaction.transaction_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/account', methods=['POST'])
@jwt_required()
def update_account():
    """Update user's Hedera account information."""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not data or 'hedera_account_id' not in data:
            return jsonify({'error': 'Hedera account ID required'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user's Hedera account info
        user.hedera_account_id = data['hedera_account_id']
        user.wallet_type = data.get('wallet_type', 'hashpack')
        user.last_wallet_sync = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Account updated successfully',
            'hedera_account_id': user.hedera_account_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get user's transaction history."""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        transactions = Transaction.query.filter_by(user_id=user_id)\
            .order_by(Transaction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [{
                'id': t.id,
                'transaction_id': t.transaction_id,
                'amount': t.amount,
                'type': t.transaction_type,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
                'metadata': json.loads(t.metadata) if t.metadata else {}
            } for t in transactions.items],
            'pagination': {
                'page': transactions.page,
                'pages': transactions.pages,
                'per_page': transactions.per_page,
                'total': transactions.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/info', methods=['GET'])
@jwt_required()
def get_wallet_info():
    """Get user's wallet information."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'hedera_account_id': user.hedera_account_id,
            'wallet_type': user.wallet_type,
            'balance': user.wallet_balance,
            'last_sync': user.last_wallet_sync.isoformat() if user.last_wallet_sync else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
