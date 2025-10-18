"""
Authentication routes - Sign up, Sign in, and related endpoints.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from datetime import datetime
from models import User, db
from middleware import token_required, validate_request_data, get_current_user
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_wallet_address(wallet_address):
    """Validate Hedera wallet address format (0.0.xxxxx)."""
    pattern = r'^0\.0\.\d+$'
    return re.match(pattern, wallet_address) is not None


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Sign up a new user - WALLET REQUIRED.
    
    Two signup methods:
    
    Method 1 - Wallet Only (Recommended):
    Required fields:
    - wallet_address: Hedera wallet address (0.0.xxxxx)
    - wallet_type: 'hashpack' or 'blade'
    
    Method 2 - Email + Wallet (Traditional):
    Required fields:
    - email: User's email address
    - password: User's password
    - wallet_address: Hedera wallet address (0.0.xxxxx)
    - wallet_type: 'hashpack' or 'blade'
    
    Optional fields:
    - first_name, last_name, phone_number, country
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Wallet address is ALWAYS required
    if 'wallet_address' not in data or 'wallet_type' not in data:
        return jsonify({
            'error': 'Wallet connection required',
            'message': 'Please connect your Hedera wallet (HashPack or Blade) to continue'
        }), 400
    
    # Validate wallet address
    if not validate_wallet_address(data['wallet_address']):
        return jsonify({'error': 'Invalid Hedera wallet address format. Expected format: 0.0.xxxxx'}), 400
    
    # Validate wallet type
    if data['wallet_type'] not in ['hashpack', 'blade']:
        return jsonify({'error': 'Invalid wallet type. Must be "hashpack" or "blade"'}), 400
    
    # Check if wallet already exists
    existing_wallet = User.query.filter_by(wallet_address=data['wallet_address']).first()
    if existing_wallet:
        return jsonify({'error': 'Wallet address already registered'}), 409
    
    # If email provided, validate it
    email = data.get('email')
    password = data.get('password')
    
    if email:
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        if not password:
            return jsonify({'error': 'Password required when using email'}), 400
    else:
        # Wallet-only signup: generate email from wallet address
        email = f"{data['wallet_address'].replace('.', '_')}@hedera.local"
        password = data['wallet_address']  # Use wallet address as password
    
    # Create new user
    try:
        user = User(
            email=email,
            wallet_address=data['wallet_address'],
            wallet_type=data['wallet_type'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone_number=data.get('phone_number'),
            country=data.get('country', 'KE'),  # Default to Kenya
            is_email_verified=True if not data.get('email') else False,  # Auto-verify wallet-only signups
            kyc_status='approved'  # Auto-approve for wallet-based signups
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Account created successfully. Your Hedera wallet is your identity.',
            'user': user.to_dict(include_sensitive=True),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'wallet_verified': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user', 'message': str(e)}), 500


@auth_bp.route('/signin', methods=['POST'])
@validate_request_data(['email', 'password'])
def signin():
    """
    Sign in an existing user.
    
    Required fields:
    - email: User's email address
    - password: User's password
    """
    data = request.get_json()
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check if account is active
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated. Please contact support.'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_sensitive=True),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/signin/wallet', methods=['POST'])
@validate_request_data(['wallet_address'])
def signin_wallet():
    """
    Sign in using wallet address (for wallet-based authentication).
    
    Required fields:
    - wallet_address: Hedera wallet address
    """
    data = request.get_json()
    
    # Validate wallet address
    if not validate_wallet_address(data['wallet_address']):
        return jsonify({'error': 'Invalid wallet address format'}), 400
    
    # Find user by wallet address
    user = User.query.filter_by(wallet_address=data['wallet_address']).first()
    
    if not user:
        return jsonify({'error': 'Wallet address not registered'}), 404
    
    # Check if account is active
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated. Please contact support.'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_sensitive=True),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_info():
    """Get current authenticated user information."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict(include_sensitive=True)
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@token_required
def refresh():
    """Refresh access token."""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to refresh token', 'message': str(e)}), 500


@auth_bp.route('/update-profile', methods=['PUT'])
@token_required
def update_profile():
    """
    Update user profile information.
    
    Optional fields:
    - first_name
    - last_name
    - phone_number
    - country
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['first_name', 'last_name', 'phone_number', 'country']
    
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(include_sensitive=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'message': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@token_required
@validate_request_data(['old_password', 'new_password'])
def change_password():
    """
    Change user password.
    
    Required fields:
    - old_password: Current password
    - new_password: New password
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Verify old password
    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Incorrect current password'}), 401
    
    # Validate new password
    if len(data['new_password']) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400
    
    # Update password
    try:
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'message': str(e)}), 500

