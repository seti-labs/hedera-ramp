"""
Main Flask application for Hedera Ramp Hub backend.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from config import config
from models import db

# Hedera service is optional for basic functionality
HEDERA_AVAILABLE = False
init_hedera_service = None

# Import blueprints
from routes.auth import auth_bp
from routes.kyc import kyc_bp
from routes.crud import crud_bp
from routes.transactions import transactions_bp
from routes.intersend import intersend_bp
from routes.hedera import hedera_bp
from routes.student_investments import student_investments_bp
from routes.public import public_bp


def create_app(config_name=None):
    """
    Application factory for creating Flask app instances.
    
    Args:
        config_name: Configuration name ('development', 'production', 'testing')
    
    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    JWTManager(app)
    migrate = Migrate(app, db)
    
    # Initialize Hedera service (optional)
    if HEDERA_AVAILABLE and init_hedera_service:
        with app.app_context():
            try:
                init_hedera_service(
                    network=app.config['HEDERA_NETWORK'],
                    operator_id=app.config.get('HEDERA_OPERATOR_ID'),
                    operator_key=app.config.get('HEDERA_OPERATOR_KEY')
                )
                print("✅ Hedera service initialized")
            except Exception as e:
                print(f"⚠️  Failed to initialize Hedera service: {e}")
    else:
        print("ℹ️  Running without Hedera integration (Java not installed)")
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(kyc_bp)
    app.register_blueprint(crud_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(intersend_bp)
    app.register_blueprint(hedera_bp)
    app.register_blueprint(student_investments_bp)
    app.register_blueprint(public_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({
            'status': 'healthy',
            'service': 'Hedera Ramp Hub API',
            'version': '1.0.0'
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint with API information."""
        return jsonify({
            'service': 'Hedera Ramp Hub API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': {
                    'signup': '/api/auth/signup',
                    'signin': '/api/auth/signin',
                    'signin_wallet': '/api/auth/signin/wallet',
                    'me': '/api/auth/me',
                    'refresh': '/api/auth/refresh',
                    'update_profile': '/api/auth/update-profile',
                    'change_password': '/api/auth/change-password'
                },
                'kyc': {
                    'status': '/api/kyc/status',
                    'submit': '/api/kyc/submit',
                    'documents': '/api/kyc/documents',
                    'resubmit': '/api/kyc/resubmit',
                    'pending': '/api/kyc/pending',
                    'verify': '/api/kyc/verify/<user_id>'
                },
                'data': {
                    'get_all': '/api/data/',
                    'get_by_id': '/api/data/<id>',
                    'get_by_key': '/api/data/key/<key>',
                    'create': '/api/data/',
                    'update': '/api/data/<id>',
                    'update_by_key': '/api/data/key/<key>',
                    'delete': '/api/data/<id>',
                    'delete_by_key': '/api/data/key/<key>',
                    'upsert': '/api/data/upsert',
                    'bulk_create': '/api/data/bulk'
                },
                'transactions': {
                    'get_all': '/api/transactions/',
                    'get_by_id': '/api/transactions/<id>',
                    'create': '/api/transactions/create',
                    'update_status': '/api/transactions/<id>/status',
                    'stats': '/api/transactions/stats',
                    'cancel': '/api/transactions/<id>/cancel'
                },
                'mpesa': {
                    'onramp_initiate': '/api/mpesa/onramp/initiate',
                    'offramp_initiate': '/api/mpesa/offramp/initiate',
                    'status': '/api/mpesa/status/<transaction_id>',
                    'rates': '/api/mpesa/rates',
                    'config': '/api/mpesa/config',
                    'callback': '/api/mpesa/callback',
                    'result': '/api/mpesa/result'
                }
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 errors."""
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 errors."""
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 errors."""
        return jsonify({'error': 'Forbidden'}), 403
    
    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
    
    # Run the application
    debug = app.config.get('DEBUG', False)
    port = int(os.getenv('PORT', 5000))
    
    print(f"\n{'='*60}")
    print(f"Hedera Ramp Hub API Server")
    print(f"{'='*60}")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Debug mode: {debug}")
    print(f"Server running on: http://localhost:{port}")
    print(f"API documentation: http://localhost:{port}/")
    print(f"Health check: http://localhost:{port}/api/health")
    print(f"{'='*60}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

