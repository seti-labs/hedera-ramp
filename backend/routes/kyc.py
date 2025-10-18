"""
KYC (Know Your Customer) verification routes.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import User, KYCDocument, db
from middleware import token_required, validate_request_data, get_current_user, active_user_required

kyc_bp = Blueprint('kyc', __name__, url_prefix='/api/kyc')


@kyc_bp.route('/status', methods=['GET'])
@token_required
def get_kyc_status():
    """Get current user's KYC status."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'kyc_status': user.kyc_status,
        'kyc_submitted_at': user.kyc_submitted_at.isoformat() if user.kyc_submitted_at else None,
        'kyc_verified_at': user.kyc_verified_at.isoformat() if user.kyc_verified_at else None,
        'kyc_rejection_reason': user.kyc_rejection_reason,
        'is_verified': user.kyc_status == 'approved'
    }), 200


@kyc_bp.route('/submit', methods=['POST'])
@token_required
@active_user_required
@validate_request_data(['document_type', 'document_number', 'document_country'])
def submit_kyc():
    """
    Submit KYC information for verification.
    
    Required fields:
    - document_type: Type of document (passport, drivers_license, national_id, etc.)
    - document_number: Document number
    - document_country: Country of document issuance
    
    Optional fields:
    - file_path: Path to uploaded document (in production, handle file upload)
    - additional_info: Any additional information
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if KYC is already approved
    if user.kyc_status == 'approved':
        return jsonify({'error': 'KYC already approved'}), 400
    
    # Check if KYC is pending
    if user.kyc_status == 'pending':
        return jsonify({'error': 'KYC submission already pending review'}), 400
    
    data = request.get_json()
    
    try:
        # Create KYC document record
        kyc_document = KYCDocument(
            user_id=user.id,
            document_type=data['document_type'],
            document_number=data['document_number'],
            document_country=data['document_country'],
            file_path=data.get('file_path'),
            file_url=data.get('file_url')
        )
        
        # Update user KYC status
        user.kyc_status = 'pending'
        user.kyc_submitted_at = datetime.utcnow()
        user.kyc_rejection_reason = None  # Clear any previous rejection reason
        
        db.session.add(kyc_document)
        db.session.commit()
        
        return jsonify({
            'message': 'KYC submitted successfully',
            'kyc_status': user.kyc_status,
            'document': kyc_document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit KYC', 'message': str(e)}), 500


@kyc_bp.route('/documents', methods=['GET'])
@token_required
def get_kyc_documents():
    """Get all KYC documents for the current user."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    documents = KYCDocument.query.filter_by(user_id=user.id).all()
    
    return jsonify({
        'documents': [doc.to_dict() for doc in documents]
    }), 200


@kyc_bp.route('/verify/<int:user_id>', methods=['POST'])
@token_required
@validate_request_data(['status'])
def verify_kyc(user_id):
    """
    Verify or reject a user's KYC submission (Admin endpoint).
    
    Required fields:
    - status: 'approved' or 'rejected'
    
    Optional fields:
    - rejection_reason: Reason for rejection (required if status is 'rejected')
    
    Note: In production, this endpoint should have admin-only access control.
    """
    # TODO: Add admin role check here
    current_user = get_current_user()
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    status = data['status']
    
    # Validate status
    if status not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid status. Must be "approved" or "rejected"'}), 400
    
    # Find user to verify
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.kyc_status != 'pending':
        return jsonify({'error': 'No pending KYC submission for this user'}), 400
    
    try:
        # Update user KYC status
        user.kyc_status = status
        
        if status == 'approved':
            user.kyc_verified_at = datetime.utcnow()
            user.kyc_rejection_reason = None
            
            # Update all user's KYC documents
            documents = KYCDocument.query.filter_by(user_id=user_id).all()
            for doc in documents:
                doc.verification_status = 'approved'
                doc.verified_at = datetime.utcnow()
                doc.verified_by = current_user.email
        else:
            # Rejected
            if 'rejection_reason' not in data:
                return jsonify({'error': 'Rejection reason is required'}), 400
            
            user.kyc_rejection_reason = data['rejection_reason']
            user.kyc_verified_at = None
            
            # Update all user's KYC documents
            documents = KYCDocument.query.filter_by(user_id=user_id).all()
            for doc in documents:
                doc.verification_status = 'rejected'
                doc.rejection_reason = data['rejection_reason']
        
        db.session.commit()
        
        return jsonify({
            'message': f'KYC {status} successfully',
            'user_id': user_id,
            'kyc_status': user.kyc_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to verify KYC', 'message': str(e)}), 500


@kyc_bp.route('/resubmit', methods=['POST'])
@token_required
@active_user_required
@validate_request_data(['document_type', 'document_number', 'document_country'])
def resubmit_kyc():
    """
    Resubmit KYC after rejection.
    
    Required fields:
    - document_type: Type of document
    - document_number: Document number
    - document_country: Country of document issuance
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if KYC was rejected
    if user.kyc_status != 'rejected':
        if user.kyc_status == 'approved':
            return jsonify({'error': 'KYC already approved'}), 400
        elif user.kyc_status == 'pending':
            return jsonify({'error': 'KYC already pending review'}), 400
        else:
            return jsonify({'error': 'Please submit KYC first'}), 400
    
    data = request.get_json()
    
    try:
        # Create new KYC document record
        kyc_document = KYCDocument(
            user_id=user.id,
            document_type=data['document_type'],
            document_number=data['document_number'],
            document_country=data['document_country'],
            file_path=data.get('file_path'),
            file_url=data.get('file_url')
        )
        
        # Update user KYC status
        user.kyc_status = 'pending'
        user.kyc_submitted_at = datetime.utcnow()
        user.kyc_rejection_reason = None
        
        db.session.add(kyc_document)
        db.session.commit()
        
        return jsonify({
            'message': 'KYC resubmitted successfully',
            'kyc_status': user.kyc_status,
            'document': kyc_document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to resubmit KYC', 'message': str(e)}), 500


@kyc_bp.route('/pending', methods=['GET'])
@token_required
def get_pending_kyc():
    """
    Get all pending KYC submissions (Admin endpoint).
    
    Note: In production, this endpoint should have admin-only access control.
    """
    # TODO: Add admin role check here
    
    try:
        pending_users = User.query.filter_by(kyc_status='pending').all()
        
        result = []
        for user in pending_users:
            documents = KYCDocument.query.filter_by(user_id=user.id).all()
            result.append({
                'user': user.to_dict(include_sensitive=True),
                'documents': [doc.to_dict() for doc in documents]
            })
        
        return jsonify({
            'pending_kyc_count': len(result),
            'submissions': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch pending KYC', 'message': str(e)}), 500

