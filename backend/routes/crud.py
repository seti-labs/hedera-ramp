"""
CRUD routes for user data management.
"""

from flask import Blueprint, request, jsonify
from models import UserData, db
from middleware import token_required, validate_request_data, get_current_user, active_user_required

crud_bp = Blueprint('crud', __name__, url_prefix='/api/data')


@crud_bp.route('/', methods=['GET'])
@token_required
@active_user_required
def get_all_user_data():
    """
    Get all data entries for the current user.
    
    Query parameters:
    - category: Filter by category (optional)
    - is_public: Filter by public/private (optional, boolean)
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Build query
    query = UserData.query.filter_by(user_id=user.id)
    
    # Apply filters
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    is_public = request.args.get('is_public')
    if is_public is not None:
        is_public_bool = is_public.lower() == 'true'
        query = query.filter_by(is_public=is_public_bool)
    
    # Execute query
    data_entries = query.all()
    
    return jsonify({
        'count': len(data_entries),
        'data': [entry.to_dict() for entry in data_entries]
    }), 200


@crud_bp.route('/<int:data_id>', methods=['GET'])
@token_required
@active_user_required
def get_user_data(data_id):
    """Get a specific data entry by ID."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(id=data_id, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    return jsonify({
        'data': data_entry.to_dict()
    }), 200


@crud_bp.route('/key/<string:key>', methods=['GET'])
@token_required
@active_user_required
def get_user_data_by_key(key):
    """Get a data entry by key."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(key=key, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    return jsonify({
        'data': data_entry.to_dict()
    }), 200


@crud_bp.route('/', methods=['POST'])
@token_required
@active_user_required
@validate_request_data(['key', 'value'])
def create_user_data():
    """
    Create a new data entry.
    
    Required fields:
    - key: Unique key for the data entry
    - value: Value to store (can be string, number, boolean, or JSON object)
    
    Optional fields:
    - category: Category for organizing data
    - is_public: Whether the data is public (default: false)
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Check if key already exists for this user
    existing_entry = UserData.query.filter_by(user_id=user.id, key=data['key']).first()
    
    if existing_entry:
        return jsonify({'error': 'Data entry with this key already exists'}), 409
    
    try:
        # Create new data entry
        data_entry = UserData(
            user_id=user.id,
            key=data['key'],
            category=data.get('category'),
            is_public=data.get('is_public', False)
        )
        data_entry.set_value(data['value'])
        
        db.session.add(data_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Data entry created successfully',
            'data': data_entry.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create data entry', 'message': str(e)}), 500


@crud_bp.route('/<int:data_id>', methods=['PUT'])
@token_required
@active_user_required
def update_user_data(data_id):
    """
    Update an existing data entry.
    
    Optional fields:
    - value: New value
    - category: New category
    - is_public: New public/private status
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(id=data_id, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update fields if provided
        if 'value' in data:
            data_entry.set_value(data['value'])
        
        if 'category' in data:
            data_entry.category = data['category']
        
        if 'is_public' in data:
            data_entry.is_public = data['is_public']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Data entry updated successfully',
            'data': data_entry.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update data entry', 'message': str(e)}), 500


@crud_bp.route('/key/<string:key>', methods=['PUT'])
@token_required
@active_user_required
def update_user_data_by_key(key):
    """
    Update a data entry by key.
    
    Optional fields:
    - value: New value
    - category: New category
    - is_public: New public/private status
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(key=key, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update fields if provided
        if 'value' in data:
            data_entry.set_value(data['value'])
        
        if 'category' in data:
            data_entry.category = data['category']
        
        if 'is_public' in data:
            data_entry.is_public = data['is_public']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Data entry updated successfully',
            'data': data_entry.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update data entry', 'message': str(e)}), 500


@crud_bp.route('/<int:data_id>', methods=['DELETE'])
@token_required
@active_user_required
def delete_user_data(data_id):
    """Delete a data entry by ID."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(id=data_id, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    try:
        db.session.delete(data_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Data entry deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete data entry', 'message': str(e)}), 500


@crud_bp.route('/key/<string:key>', methods=['DELETE'])
@token_required
@active_user_required
def delete_user_data_by_key(key):
    """Delete a data entry by key."""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data_entry = UserData.query.filter_by(key=key, user_id=user.id).first()
    
    if not data_entry:
        return jsonify({'error': 'Data entry not found'}), 404
    
    try:
        db.session.delete(data_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Data entry deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete data entry', 'message': str(e)}), 500


@crud_bp.route('/upsert', methods=['POST'])
@token_required
@active_user_required
@validate_request_data(['key', 'value'])
def upsert_user_data():
    """
    Create or update a data entry (upsert operation).
    
    Required fields:
    - key: Key for the data entry
    - value: Value to store
    
    Optional fields:
    - category: Category for organizing data
    - is_public: Whether the data is public
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    try:
        # Check if entry exists
        data_entry = UserData.query.filter_by(user_id=user.id, key=data['key']).first()
        
        if data_entry:
            # Update existing entry
            data_entry.set_value(data['value'])
            
            if 'category' in data:
                data_entry.category = data['category']
            
            if 'is_public' in data:
                data_entry.is_public = data['is_public']
            
            message = 'Data entry updated successfully'
            status_code = 200
        else:
            # Create new entry
            data_entry = UserData(
                user_id=user.id,
                key=data['key'],
                category=data.get('category'),
                is_public=data.get('is_public', False)
            )
            data_entry.set_value(data['value'])
            
            db.session.add(data_entry)
            message = 'Data entry created successfully'
            status_code = 201
        
        db.session.commit()
        
        return jsonify({
            'message': message,
            'data': data_entry.to_dict()
        }), status_code
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upsert data entry', 'message': str(e)}), 500


@crud_bp.route('/bulk', methods=['POST'])
@token_required
@active_user_required
@validate_request_data(['entries'])
def bulk_create_user_data():
    """
    Create multiple data entries at once.
    
    Required fields:
    - entries: Array of objects with 'key' and 'value' fields
    
    Each entry can have:
    - key: Unique key for the data entry
    - value: Value to store
    - category: Category (optional)
    - is_public: Public status (optional)
    """
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    entries = data['entries']
    
    if not isinstance(entries, list):
        return jsonify({'error': 'Entries must be an array'}), 400
    
    created_entries = []
    errors = []
    
    for entry in entries:
        if 'key' not in entry or 'value' not in entry:
            errors.append({'entry': entry, 'error': 'Missing key or value'})
            continue
        
        # Check if key already exists
        existing = UserData.query.filter_by(user_id=user.id, key=entry['key']).first()
        
        if existing:
            errors.append({'key': entry['key'], 'error': 'Key already exists'})
            continue
        
        try:
            data_entry = UserData(
                user_id=user.id,
                key=entry['key'],
                category=entry.get('category'),
                is_public=entry.get('is_public', False)
            )
            data_entry.set_value(entry['value'])
            
            db.session.add(data_entry)
            created_entries.append(entry['key'])
        except Exception as e:
            errors.append({'key': entry['key'], 'error': str(e)})
    
    try:
        db.session.commit()
        
        return jsonify({
            'message': f'Created {len(created_entries)} entries',
            'created': created_entries,
            'errors': errors
        }), 201 if created_entries else 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create entries', 'message': str(e)}), 500

