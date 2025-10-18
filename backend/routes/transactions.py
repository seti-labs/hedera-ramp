"""
Transaction routes for on-ramp and off-ramp operations.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Transaction, db
from middleware import token_required, validate_request_data, get_current_user, kyc_required, active_user_required

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')


@transactions_bp.route('/', methods=['GET'])
@token_required
@active_user_required
def get_transactions():
    """
    Get all transactions for the current user.
    
    Query parameters:
    - transaction_type: Filter by type ('onramp' or 'offramp')
    - status: Filter by status
    - limit: Number of transactions to return (default: 50)
    - offset: Pagination offset (default: 0)
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Build query
    query = Transaction.query.filter_by(user_id=user.id)
    
    # Apply filters
    transaction_type = request.args.get('transaction_type')
    if transaction_type:
        query = query.filter_by(transaction_type=transaction_type)
    
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Pagination
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    # Order by created_at descending (newest first)
    query = query.order_by(Transaction.created_at.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    transactions = query.limit(limit).offset(offset).all()
    
    return jsonify({
        'total': total,
        'count': len(transactions),
        'limit': limit,
        'offset': offset,
        'transactions': [tx.to_dict() for tx in transactions]
    }), 200


@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@token_required
@active_user_required
def get_transaction(transaction_id):
    """Get a specific transaction by ID."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    return jsonify({
        'transaction': transaction.to_dict()
    }), 200


@transactions_bp.route('/create', methods=['POST'])
@token_required
@active_user_required
@kyc_required
@validate_request_data(['transaction_type', 'amount', 'fiat_amount'])
def create_transaction():
    """
    Create a new transaction.
    
    Required fields:
    - transaction_type: 'onramp' or 'offramp'
    - amount: Crypto amount
    - fiat_amount: Fiat amount
    
    Optional fields:
    - currency: Fiat currency (default: 'USD')
    - payment_method: Payment method used
    - notes: Additional notes
    - metadata: JSON metadata
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate transaction type
    if data['transaction_type'] not in ['onramp', 'offramp']:
        return jsonify({'error': 'Invalid transaction type. Must be "onramp" or "offramp"'}), 400
    
    try:
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            transaction_type=data['transaction_type'],
            amount=data['amount'],
            fiat_amount=data['fiat_amount'],
            currency=data.get('currency', 'USD'),
            payment_method=data.get('payment_method'),
            notes=data.get('notes'),
            transaction_metadata=str(data.get('metadata')) if data.get('metadata') else None
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create transaction', 'message': str(e)}), 500


@transactions_bp.route('/<int:transaction_id>/status', methods=['PUT'])
@token_required
@active_user_required
@validate_request_data(['status'])
def update_transaction_status(transaction_id):
    """
    Update transaction status.
    
    Required fields:
    - status: New status ('pending', 'processing', 'completed', 'failed', 'cancelled')
    
    Optional fields:
    - hedera_transaction_id: Hedera transaction ID
    - hedera_transaction_hash: Hedera transaction hash
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    data = request.get_json()
    status = data['status']
    
    # Validate status
    valid_statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        # Update status
        transaction.status = status
        
        # If completed, set completed_at timestamp
        if status == 'completed':
            transaction.completed_at = datetime.utcnow()
        
        # Update Hedera transaction details if provided
        if 'hedera_transaction_id' in data:
            transaction.hedera_transaction_id = data['hedera_transaction_id']
        
        if 'hedera_transaction_hash' in data:
            transaction.hedera_transaction_hash = data['hedera_transaction_hash']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction status updated successfully',
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update transaction status', 'message': str(e)}), 500


@transactions_bp.route('/stats', methods=['GET'])
@token_required
@active_user_required
def get_transaction_stats():
    """Get transaction statistics for the current user."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Total transactions
        total_transactions = Transaction.query.filter_by(user_id=user.id).count()
        
        # Transactions by type
        onramp_count = Transaction.query.filter_by(user_id=user.id, transaction_type='onramp').count()
        offramp_count = Transaction.query.filter_by(user_id=user.id, transaction_type='offramp').count()
        
        # Transactions by status
        pending_count = Transaction.query.filter_by(user_id=user.id, status='pending').count()
        processing_count = Transaction.query.filter_by(user_id=user.id, status='processing').count()
        completed_count = Transaction.query.filter_by(user_id=user.id, status='completed').count()
        failed_count = Transaction.query.filter_by(user_id=user.id, status='failed').count()
        cancelled_count = Transaction.query.filter_by(user_id=user.id, status='cancelled').count()
        
        # Recent transactions (last 5)
        recent_transactions = Transaction.query.filter_by(user_id=user.id).order_by(
            Transaction.created_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_transactions': total_transactions,
            'by_type': {
                'onramp': onramp_count,
                'offramp': offramp_count
            },
            'by_status': {
                'pending': pending_count,
                'processing': processing_count,
                'completed': completed_count,
                'failed': failed_count,
                'cancelled': cancelled_count
            },
            'recent_transactions': [tx.to_dict() for tx in recent_transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get transaction stats', 'message': str(e)}), 500


@transactions_bp.route('/<int:transaction_id>/cancel', methods=['POST'])
@token_required
@active_user_required
def cancel_transaction(transaction_id):
    """Cancel a pending transaction."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # Can only cancel pending transactions
    if transaction.status not in ['pending', 'processing']:
        return jsonify({'error': 'Can only cancel pending or processing transactions'}), 400
    
    try:
        transaction.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction cancelled successfully',
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel transaction', 'message': str(e)}), 500

