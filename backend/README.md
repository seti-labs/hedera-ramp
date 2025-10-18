# Hedera Ramp Hub - Backend API

A comprehensive Flask-based REST API for the Hedera Ramp Hub application, providing authentication, KYC verification, CRUD operations, and transaction management integrated with Hedera Hashgraph.

## Features

- ✅ **User Authentication**: Sign up, sign in (email/password and wallet-based)
- ✅ **KYC Verification**: Complete KYC workflow with document submission and verification
- ✅ **CRUD Operations**: Generic data storage linked to wallet addresses
- ✅ **Transaction Management**: On-ramp and off-ramp transaction tracking
- ✅ **Hedera Integration**: Ready for Hedera Hashgraph integration (smart contract deployment not included)
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Database Models**: SQLAlchemy models with relationships
- ✅ **Middleware**: Authentication, KYC, and validation middleware

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Virtual environment (recommended)
- PostgreSQL (optional, SQLite used by default)

## Installation

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Create virtual environment

```bash
python -m venv venv
```

### 3. Activate virtual environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Set up environment variables

Copy the environment template and configure:

```bash
cp env.template .env
```

Edit `.env` file with your configuration:

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database
DATABASE_URL=sqlite:///hedera_ramp.db

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key-here

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 6. Initialize database

```bash
python app.py
```

This will create all necessary database tables.

## Running the Application

### Development Mode

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Production Mode

```bash
export FLASK_ENV=production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/signin` | Sign in with email/password | No |
| POST | `/api/auth/signin/wallet` | Sign in with wallet address | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/refresh` | Refresh access token | Yes |
| PUT | `/api/auth/update-profile` | Update user profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### KYC Verification (`/api/kyc`)

| Method | Endpoint | Description | Auth Required | KYC Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/kyc/status` | Get KYC status | Yes | No |
| POST | `/api/kyc/submit` | Submit KYC documents | Yes | No |
| GET | `/api/kyc/documents` | Get user's KYC documents | Yes | No |
| POST | `/api/kyc/resubmit` | Resubmit KYC after rejection | Yes | No |
| GET | `/api/kyc/pending` | Get pending KYC submissions (Admin) | Yes | No |
| POST | `/api/kyc/verify/<user_id>` | Verify user's KYC (Admin) | Yes | No |

### User Data CRUD (`/api/data`)

| Method | Endpoint | Description | Auth Required | KYC Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/data/` | Get all user data | Yes | No |
| GET | `/api/data/<id>` | Get data by ID | Yes | No |
| GET | `/api/data/key/<key>` | Get data by key | Yes | No |
| POST | `/api/data/` | Create new data entry | Yes | No |
| PUT | `/api/data/<id>` | Update data by ID | Yes | No |
| PUT | `/api/data/key/<key>` | Update data by key | Yes | No |
| DELETE | `/api/data/<id>` | Delete data by ID | Yes | No |
| DELETE | `/api/data/key/<key>` | Delete data by key | Yes | No |
| POST | `/api/data/upsert` | Create or update data | Yes | No |
| POST | `/api/data/bulk` | Bulk create data entries | Yes | No |

### Transactions (`/api/transactions`)

| Method | Endpoint | Description | Auth Required | KYC Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/transactions/` | Get all transactions | Yes | No |
| GET | `/api/transactions/<id>` | Get transaction by ID | Yes | No |
| POST | `/api/transactions/create` | Create new transaction | Yes | Yes |
| PUT | `/api/transactions/<id>/status` | Update transaction status | Yes | No |
| GET | `/api/transactions/stats` | Get transaction statistics | Yes | No |
| POST | `/api/transactions/<id>/cancel` | Cancel transaction | Yes | No |

## Authentication Flow

### 1. Sign Up

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "wallet_address": "0.0.12345",
  "wallet_type": "hashpack",
  "first_name": "John",
  "last_name": "Doe",
  "country": "USA"
}
```

Response:
```json
{
  "message": "User created successfully",
  "user": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

### 2. Sign In

```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### 3. Use Access Token

Include the access token in all authenticated requests:

```bash
Authorization: Bearer <access_token>
```

## KYC Verification Flow

### 1. Submit KYC

```bash
POST /api/kyc/submit
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "document_type": "passport",
  "document_number": "AB123456",
  "document_country": "USA"
}
```

### 2. Check Status

```bash
GET /api/kyc/status
Authorization: Bearer <access_token>
```

### 3. Admin Verification

```bash
POST /api/kyc/verify/<user_id>
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "status": "approved"
}
```

## Database Schema

### Users
- Wallet address (unique identifier)
- Email and password
- Profile information
- KYC status
- Account status

### Transactions
- Linked to user
- Transaction type (onramp/offramp)
- Amounts (crypto and fiat)
- Status tracking
- Hedera transaction details

### KYC Documents
- Linked to user
- Document information
- Verification status

### User Data
- Generic key-value storage
- Linked to user/wallet
- Supports multiple data types

## Hedera Integration

The backend is ready for Hedera integration:

1. **HederaService** (`hedera_service.py`): Provides utility functions for:
   - Account balance queries
   - Account information retrieval
   - HBAR transfers
   - Account validation

2. **Configuration**: Set Hedera credentials in `.env`:
   ```env
   HEDERA_NETWORK=testnet
   HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_OPERATOR_KEY=your-private-key-here
   ```

3. **Smart Contract Integration**: Ready for smart contract deployment (implementation not included as requested)

## Development

### Database Migrations

Initialize migrations:
```bash
flask db init
```

Create migration:
```bash
flask db migrate -m "Description"
```

Apply migration:
```bash
flask db upgrade
```

### Testing

Run with test configuration:
```bash
export FLASK_ENV=testing
python app.py
```

## Security Notes

1. **Change Secret Keys**: Update `SECRET_KEY` and `JWT_SECRET_KEY` in production
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Consider implementing rate limiting
4. **Input Validation**: All inputs are validated
5. **Password Hashing**: Passwords are hashed with bcrypt
6. **JWT Tokens**: Secure token-based authentication

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py              # Configuration management
├── models.py              # Database models
├── middleware.py          # Authentication middleware
├── hedera_service.py      # Hedera integration
├── requirements.txt       # Python dependencies
├── env.template          # Environment template
├── routes/
│   ├── auth.py           # Authentication routes
│   ├── kyc.py            # KYC verification routes
│   ├── crud.py           # CRUD operations routes
│   └── transactions.py   # Transaction routes
└── README.md             # This file
```

## Support

For issues or questions, please contact the development team or open an issue in the repository.

## License

This project is part of the Hedera Ramp Hub application.

