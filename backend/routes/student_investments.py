"""
Student investment routes for campus investment platform.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import Student, StudentInvestment, User, db
from middleware import token_required, get_current_user, validate_request_data
import json

student_investments_bp = Blueprint('student_investments', __name__, url_prefix='/api/student-investments')


@student_investments_bp.route('/register', methods=['POST'])
@token_required
@validate_request_data(['student_id', 'university', 'graduation_year'])
def register_student():
    """Register a student for the investment platform."""
    current_user = get_current_user()
    data = request.get_json()
    
    student_id = data.get('student_id')
    university = data.get('university')
    major = data.get('major', '')
    graduation_year = data.get('graduation_year')
    
    # Check if student already exists
    existing_student = Student.query.filter_by(student_id=student_id).first()
    if existing_student:
        return jsonify({'error': 'Student ID already registered'}), 400
    
    # Check if user already has a student profile
    existing_profile = Student.query.filter_by(user_id=current_user.id).first()
    if existing_profile:
        return jsonify({'error': 'User already has a student profile'}), 400
    
    try:
        # Create student profile
        student = Student(
            user_id=current_user.id,
            student_id=student_id,
            university=university,
            major=major,
            graduation_year=graduation_year,
            enrollment_status='active',
            is_verified=False  # Requires manual verification
        )
        
        db.session.add(student)
        db.session.commit()
        
        return jsonify({
            'message': 'Student profile created successfully',
            'student': student.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating student profile: {e}")
        return jsonify({'error': 'Failed to create student profile', 'message': str(e)}), 500


@student_investments_bp.route('/profile', methods=['GET'])
@token_required
def get_student_profile():
    """Get current user's student profile."""
    current_user = get_current_user()
    
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    return jsonify({
        'student': student.to_dict(),
        'investments': [inv.to_dict() for inv in student.investments]
    }), 200


@student_investments_bp.route('/invest', methods=['POST'])
@token_required
@validate_request_data(['amount', 'investment_type', 'lock_period_months'])
def create_investment():
    """Create a new student investment."""
    current_user = get_current_user()
    data = request.get_json()
    
    # Get student profile
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found. Please register first.'}), 404
    
    if not student.is_verified:
        return jsonify({'error': 'Student profile not verified. Please contact support.'}), 400
    
    amount = float(data.get('amount'))
    investment_type = data.get('investment_type')
    lock_period_months = int(data.get('lock_period_months'))
    currency = data.get('currency', 'KES')
    
    # Validate investment parameters
    if amount <= 0:
        return jsonify({'error': 'Investment amount must be positive'}), 400
    
    if lock_period_months < 1:
        return jsonify({'error': 'Lock period must be at least 1 month'}), 400
    
    # Calculate lock dates
    lock_start_date = datetime.utcnow()
    lock_end_date = lock_start_date + timedelta(days=lock_period_months * 30)
    
    # Calculate expected return (example: 5% annual return)
    expected_return_rate = 0.05  # 5% annual return
    
    try:
        # Create investment
        investment = StudentInvestment(
            student_id=student.id,
            investment_type=investment_type,
            amount=amount,
            currency=currency,
            lock_period_months=lock_period_months,
            lock_start_date=lock_start_date,
            lock_end_date=lock_end_date,
            is_locked=True,
            expected_return_rate=expected_return_rate,
            status='active'
        )
        
        db.session.add(investment)
        db.session.commit()
        
        return jsonify({
            'message': 'Investment created successfully',
            'investment': investment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating investment: {e}")
        return jsonify({'error': 'Failed to create investment', 'message': str(e)}), 500


@student_investments_bp.route('/investments', methods=['GET'])
@token_required
def get_investments():
    """Get all investments for current student."""
    current_user = get_current_user()
    
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    investments = StudentInvestment.query.filter_by(student_id=student.id).all()
    
    return jsonify({
        'investments': [inv.to_dict() for inv in investments],
        'total_invested': sum(float(inv.amount) for inv in investments if inv.status == 'active'),
        'total_returns': sum(float(inv.actual_return) for inv in investments)
    }), 200


@student_investments_bp.route('/withdraw/<int:investment_id>', methods=['POST'])
@token_required
def request_withdrawal(investment_id):
    """Request withdrawal of a matured investment."""
    current_user = get_current_user()
    
    # Get student profile
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    # Get investment
    investment = StudentInvestment.query.filter_by(
        id=investment_id, 
        student_id=student.id
    ).first()
    
    if not investment:
        return jsonify({'error': 'Investment not found'}), 404
    
    # Check if investment can be withdrawn
    if not investment.can_withdraw():
        remaining_days = investment.get_remaining_lock_time()
        return jsonify({
            'error': f'Investment is still locked. {remaining_days} days remaining.',
            'remaining_days': remaining_days
        }), 400
    
    if investment.status != 'active':
        return jsonify({'error': 'Investment is not active'}), 400
    
    try:
        # Update investment status
        investment.status = 'matured'
        investment.withdrawal_requested_at = datetime.utcnow()
        investment.is_locked = False
        
        db.session.commit()
        
        return jsonify({
            'message': 'Withdrawal request submitted successfully',
            'investment': investment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error processing withdrawal: {e}")
        return jsonify({'error': 'Failed to process withdrawal', 'message': str(e)}), 500


@student_investments_bp.route('/complete-withdrawal/<int:investment_id>', methods=['POST'])
@token_required
def complete_withdrawal(investment_id):
    """Complete the withdrawal process."""
    current_user = get_current_user()
    
    # Get student profile
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    # Get investment
    investment = StudentInvestment.query.filter_by(
        id=investment_id, 
        student_id=student.id
    ).first()
    
    if not investment:
        return jsonify({'error': 'Investment not found'}), 404
    
    if investment.status != 'matured':
        return jsonify({'error': 'Investment is not ready for withdrawal'}), 400
    
    try:
        # Complete withdrawal
        investment.status = 'withdrawn'
        investment.withdrawn_at = datetime.utcnow()
        
        # Calculate total amount to withdraw (principal + returns)
        total_amount = float(investment.amount) + float(investment.actual_return)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Withdrawal completed successfully',
            'total_amount': total_amount,
            'investment': investment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error completing withdrawal: {e}")
        return jsonify({'error': 'Failed to complete withdrawal', 'message': str(e)}), 500


@student_investments_bp.route('/stats', methods=['GET'])
@token_required
def get_investment_stats():
    """Get investment statistics for current student."""
    current_user = get_current_user()
    
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    investments = StudentInvestment.query.filter_by(student_id=student.id).all()
    
    # Calculate statistics
    total_invested = sum(float(inv.amount) for inv in investments)
    total_returns = sum(float(inv.actual_return) for inv in investments)
    active_investments = [inv for inv in investments if inv.status == 'active']
    locked_amount = sum(float(inv.amount) for inv in active_investments if inv.is_locked)
    
    return jsonify({
        'total_invested': total_invested,
        'total_returns': total_returns,
        'active_investments': len(active_investments),
        'locked_amount': locked_amount,
        'available_for_withdrawal': sum(
            float(inv.amount) + float(inv.actual_return) 
            for inv in investments 
            if inv.status == 'matured'
        )
    }), 200
