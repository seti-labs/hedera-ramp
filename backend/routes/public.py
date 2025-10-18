"""
Public routes for landing page stats and information.
These endpoints do not require authentication.
"""

from flask import Blueprint, jsonify
from models import User, Transaction, db
from sqlalchemy import func

public_bp = Blueprint('public', __name__, url_prefix='/api/public')


@public_bp.route('/stats', methods=['GET'])
def get_public_stats():
    """
    Get public statistics for the landing page.
    Returns live counts from the database.
    """
    try:
        # Total users count
        total_users = User.query.filter_by(is_active=True).count()
        
        # Total transactions count
        total_transactions = Transaction.query.count()
        
        # Completed transactions
        completed_transactions = Transaction.query.filter_by(status='completed').count()
        
        # Total volume (sum of completed transactions)
        volume_query = db.session.query(
            func.sum(Transaction.fiat_amount).label('total_volume')
        ).filter(
            Transaction.status == 'completed',
            Transaction.currency == 'KES'
        ).first()
        
        total_volume_kes = float(volume_query.total_volume or 0) if volume_query.total_volume else 0
        
        # Unique wallet addresses
        unique_wallets = User.query.with_entities(User.wallet_address).distinct().count()
        
        # On-ramp vs Off-ramp breakdown
        onramp_count = Transaction.query.filter_by(transaction_type='onramp').count()
        offramp_count = Transaction.query.filter_by(transaction_type='offramp').count()
        
        # Recent transactions (last 10, basic info only)
        recent_txs = Transaction.query.filter_by(status='completed').order_by(
            Transaction.completed_at.desc()
        ).limit(10).all()
        
        recent_transactions = []
        for tx in recent_txs:
            # Get user wallet (first 8 and last 4 chars for privacy)
            user = User.query.get(tx.user_id)
            wallet_preview = f"{user.wallet_address[:8]}...{user.wallet_address[-4:]}" if user else "Unknown"
            
            recent_transactions.append({
                'id': tx.id,
                'type': tx.transaction_type,
                'amount': tx.amount,
                'fiat_amount': tx.fiat_amount,
                'currency': tx.currency,
                'wallet': wallet_preview,
                'completed_at': tx.completed_at.isoformat() if tx.completed_at else None
            })
        
        # Transaction activity by day (last 7 days)
        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        daily_activity = db.session.query(
            func.date(Transaction.created_at).label('date'),
            func.count(Transaction.id).label('count')
        ).filter(
            Transaction.created_at >= seven_days_ago
        ).group_by(
            func.date(Transaction.created_at)
        ).all()
        
        activity_chart = [
            {
                'date': str(item.date),
                'count': item.count
            }
            for item in daily_activity
        ]
        
        return jsonify({
            'total_users': total_users,
            'total_transactions': total_transactions,
            'completed_transactions': completed_transactions,
            'total_volume_kes': round(total_volume_kes, 2),
            'unique_wallets': unique_wallets,
            'onramp_count': onramp_count,
            'offramp_count': offramp_count,
            'recent_transactions': recent_transactions,
            'daily_activity': activity_chart,
            'last_updated': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error getting public stats: {e}")
        return jsonify({
            'error': 'Failed to fetch statistics',
            'message': str(e)
        }), 500


@public_bp.route('/info', methods=['GET'])
def get_platform_info():
    """Get general platform information."""
    return jsonify({
        'platform_name': 'Hedera Ramp Hub',
        'description': 'M-Pesa to HBAR on/off-ramp solution',
        'supported_currencies': ['KES'],
        'supported_wallets': ['HashPack', 'Blade'],
        'features': [
            'M-Pesa On-Ramp',
            'M-Pesa Off-Ramp',
            'Real-time Exchange Rates',
            'Transaction Receipts',
            'Wallet Verification'
        ],
        'limits': {
            'min_onramp_kes': 1,
            'max_onramp_kes': 150000,
            'min_offramp_kes': 10,
            'max_offramp_kes': 150000
        }
    }), 200

