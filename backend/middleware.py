"""
Middleware for authentication and authorization checks.
"""

from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User, db


def token_required(fn):
    """Decorator to require a valid JWT token."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid or missing token', 'message': str(e)}), 401
    return wrapper


def get_current_user():
    """Get the current authenticated user from JWT token."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return user
    except Exception:
        return None


def kyc_required(fn):
    """Decorator to require KYC verification."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user = get_current_user()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.kyc_status != 'approved':
                return jsonify({
                    'error': 'KYC verification required',
                    'message': 'Please complete KYC verification to access this feature',
                    'kyc_status': user.kyc_status
                }), 403
            
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authorization failed', 'message': str(e)}), 401
    return wrapper


def active_user_required(fn):
    """Decorator to require an active user account."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user = get_current_user()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.is_active:
                return jsonify({
                    'error': 'Account inactive',
                    'message': 'Your account has been deactivated. Please contact support.'
                }), 403
            
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authorization failed', 'message': str(e)}), 401
    return wrapper


def email_verified_required(fn):
    """Decorator to require email verification."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user = get_current_user()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.is_email_verified:
                return jsonify({
                    'error': 'Email verification required',
                    'message': 'Please verify your email address to access this feature'
                }), 403
            
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authorization failed', 'message': str(e)}), 401
    return wrapper


def validate_request_data(required_fields):
    """
    Decorator to validate required fields in request data.
    
    Args:
        required_fields: List of required field names
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def cors_headers(fn):
    """Add CORS headers to response."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        response = fn(*args, **kwargs)
        if isinstance(response, tuple):
            response_obj, status_code = response[0], response[1] if len(response) > 1 else 200
        else:
            response_obj, status_code = response, 200
        
        # CORS is handled by Flask-CORS, but this can be used for custom headers
        return response_obj, status_code
    return wrapper

