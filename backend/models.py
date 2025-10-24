from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt
import json

db = SQLAlchemy()


class User(db.Model):
    """User model linked to Hedera wallet address."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(120), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile Information
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    country = db.Column(db.String(100))
    
    # Wallet Information
    wallet_type = db.Column(db.String(20))  # 'hashpack' or 'blade'
    
    # KYC Status
    kyc_status = db.Column(db.String(20), default='not_started')  # not_started, pending, approved, rejected
    kyc_submitted_at = db.Column(db.DateTime)
    kyc_verified_at = db.Column(db.DateTime)
    kyc_rejection_reason = db.Column(db.Text)
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    is_email_verified = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    transactions = db.relationship('Transaction', back_populates='user', lazy=True, cascade='all, delete-orphan')
    kyc_documents = db.relationship('KYCDocument', back_populates='user', lazy=True, cascade='all, delete-orphan')
    user_data = db.relationship('UserData', back_populates='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set the password."""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self, include_sensitive=False):
        """Convert user object to dictionary."""
        data = {
            'id': self.id,
            'wallet_address': self.wallet_address,
            'email': self.email if include_sensitive else None,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number if include_sensitive else None,
            'country': self.country,
            'wallet_type': self.wallet_type,
            'kyc_status': self.kyc_status,
            'kyc_submitted_at': self.kyc_submitted_at.isoformat() if self.kyc_submitted_at else None,
            'kyc_verified_at': self.kyc_verified_at.isoformat() if self.kyc_verified_at else None,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        return {k: v for k, v in data.items() if v is not None or include_sensitive}


class Student(db.Model):
    """Student model for campus investment platform."""
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Student Information
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    university = db.Column(db.String(200), nullable=False)
    major = db.Column(db.String(100))
    graduation_year = db.Column(db.Integer, nullable=False)
    enrollment_status = db.Column(db.String(20), default='active')  # active, graduated, dropped
    
    # Verification
    is_verified = db.Column(db.Boolean, default=False)
    verification_method = db.Column(db.String(50))  # email, document, manual
    verified_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='student_profile')
    investments = db.relationship('StudentInvestment', back_populates='student', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'student_id': self.student_id,
            'university': self.university,
            'major': self.major,
            'graduation_year': self.graduation_year,
            'enrollment_status': self.enrollment_status,
            'is_verified': self.is_verified,
            'verification_method': self.verification_method,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class StudentInvestment(db.Model):
    """Student investment model for locked investments."""
    __tablename__ = 'student_investments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    
    # Investment Details
    investment_type = db.Column(db.String(50), nullable=False)  # savings, crypto, stocks, bonds
    amount = db.Column(db.Numeric(20, 8), nullable=False)  # Amount invested
    currency = db.Column(db.String(10), default='KES')  # KES, USD, HBAR
    
    # Lock Mechanism
    lock_period_months = db.Column(db.Integer, nullable=False)  # How long money is locked
    lock_start_date = db.Column(db.DateTime, nullable=False)
    lock_end_date = db.Column(db.DateTime, nullable=False)
    is_locked = db.Column(db.Boolean, default=True)
    
    # Returns
    expected_return_rate = db.Column(db.Numeric(5, 4))  # Annual return rate (e.g., 0.05 for 5%)
    actual_return = db.Column(db.Numeric(20, 8), default=0)  # Actual returns earned
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, matured, withdrawn, cancelled
    withdrawal_requested_at = db.Column(db.DateTime)
    withdrawn_at = db.Column(db.DateTime)
    
    # Blockchain Integration
    hedera_transaction_id = db.Column(db.String(100))  # Hedera transaction ID
    smart_contract_address = db.Column(db.String(100))  # Smart contract address if applicable
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', back_populates='investments')
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'investment_type': self.investment_type,
            'amount': float(self.amount) if self.amount else 0,
            'currency': self.currency,
            'lock_period_months': self.lock_period_months,
            'lock_start_date': self.lock_start_date.isoformat() if self.lock_start_date else None,
            'lock_end_date': self.lock_end_date.isoformat() if self.lock_end_date else None,
            'is_locked': self.is_locked,
            'expected_return_rate': float(self.expected_return_rate) if self.expected_return_rate else 0,
            'actual_return': float(self.actual_return) if self.actual_return else 0,
            'status': self.status,
            'withdrawal_requested_at': self.withdrawal_requested_at.isoformat() if self.withdrawal_requested_at else None,
            'withdrawn_at': self.withdrawn_at.isoformat() if self.withdrawn_at else None,
            'hedera_transaction_id': self.hedera_transaction_id,
            'smart_contract_address': self.smart_contract_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def can_withdraw(self):
        """Check if investment can be withdrawn."""
        if not self.is_locked:
            return True
        if self.status != 'active':
            return False
        return datetime.utcnow() >= self.lock_end_date
    
    def get_remaining_lock_time(self):
        """Get remaining lock time in days."""
        if not self.is_locked or self.lock_end_date is None:
            return 0
        remaining = self.lock_end_date - datetime.utcnow()
        return max(0, remaining.days)


class Transaction(db.Model):
    """Transaction model for on-ramp and off-ramp operations."""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Transaction Details
    transaction_type = db.Column(db.String(20), nullable=False)  # 'onramp' or 'offramp'
    amount = db.Column(db.String(50), nullable=False)  # Crypto amount
    fiat_amount = db.Column(db.String(50), nullable=False)  # Fiat amount
    currency = db.Column(db.String(10), default='USD')
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed, cancelled
    
    # Hedera Transaction Details
    hedera_transaction_id = db.Column(db.String(200))
    hedera_transaction_hash = db.Column(db.String(200))
    
    # Additional Information
    payment_method = db.Column(db.String(50))  # bank_transfer, card, etc.
    notes = db.Column(db.Text)
    transaction_metadata = db.Column(db.Text)  # JSON string for additional data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='transactions')
    
    def to_dict(self):
        """Convert transaction object to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'fiat_amount': self.fiat_amount,
            'currency': self.currency,
            'status': self.status,
            'hedera_transaction_id': self.hedera_transaction_id,
            'hedera_transaction_hash': self.hedera_transaction_hash,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'metadata': json.loads(self.transaction_metadata) if self.transaction_metadata else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class KYCDocument(db.Model):
    """KYC Document model for storing user verification documents."""
    __tablename__ = 'kyc_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Document Information
    document_type = db.Column(db.String(50), nullable=False)  # passport, drivers_license, national_id, etc.
    document_number = db.Column(db.String(100))
    document_country = db.Column(db.String(100))
    
    # File Storage (in production, store in cloud storage like S3)
    file_path = db.Column(db.String(500))
    file_url = db.Column(db.String(500))
    
    # Verification Status
    verification_status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    verified_at = db.Column(db.DateTime)
    verified_by = db.Column(db.String(100))
    rejection_reason = db.Column(db.Text)
    
    # Timestamps
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='kyc_documents')
    
    def to_dict(self):
        """Convert KYC document object to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'document_type': self.document_type,
            'document_number': self.document_number,
            'document_country': self.document_country,
            'file_url': self.file_url,
            'verification_status': self.verification_status,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'uploaded_at': self.uploaded_at.isoformat()
        }


class UserData(db.Model):
    """Generic user data model for CRUD operations."""
    __tablename__ = 'user_data'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Data Fields
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Text)
    data_type = db.Column(db.String(20), default='string')  # string, json, number, boolean
    
    # Metadata
    is_public = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50))  # For organizing data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='user_data')
    
    # Unique constraint on user_id and key combination
    __table_args__ = (
        db.UniqueConstraint('user_id', 'key', name='unique_user_key'),
    )
    
    def get_value(self):
        """Get the parsed value based on data type."""
        if self.data_type == 'json':
            return json.loads(self.value)
        elif self.data_type == 'number':
            return float(self.value)
        elif self.data_type == 'boolean':
            return self.value.lower() == 'true'
        return self.value
    
    def set_value(self, value):
        """Set the value with appropriate serialization."""
        if isinstance(value, (dict, list)):
            self.data_type = 'json'
            self.value = json.dumps(value)
        elif isinstance(value, bool):
            self.data_type = 'boolean'
            self.value = str(value)
        elif isinstance(value, (int, float)):
            self.data_type = 'number'
            self.value = str(value)
        else:
            self.data_type = 'string'
            self.value = str(value)
    
    def to_dict(self):
        """Convert user data object to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'key': self.key,
            'value': self.get_value(),
            'data_type': self.data_type,
            'category': self.category,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

