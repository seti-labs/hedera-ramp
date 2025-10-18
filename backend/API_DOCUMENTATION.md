# Hedera Ramp Hub API Documentation

Complete API documentation for the Hedera Ramp Hub backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Authentication Endpoints

### 1. Sign Up

Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "wallet_address": "0.0.12345",
  "wallet_type": "hashpack",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "country": "USA"
}
```

**Required Fields:**
- `email`: Valid email address
- `password`: Minimum 8 characters
- `wallet_address`: Hedera account ID (format: 0.0.xxxxx)
- `wallet_type`: Either "hashpack" or "blade"

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "wallet_address": "0.0.12345",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "wallet_type": "hashpack",
    "kyc_status": "not_started",
    "is_active": true,
    "created_at": "2025-10-18T12:00:00"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Error Codes:**
- `400`: Invalid data format
- `409`: Email or wallet address already registered

---

### 2. Sign In (Email/Password)

Authenticate with email and password.

**Endpoint:** `POST /api/auth/signin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Error Codes:**
- `401`: Invalid credentials
- `403`: Account deactivated

---

### 3. Sign In (Wallet)

Authenticate using wallet address.

**Endpoint:** `POST /api/auth/signin/wallet`

**Request Body:**
```json
{
  "wallet_address": "0.0.12345"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Error Codes:**
- `404`: Wallet not registered
- `403`: Account deactivated

---

### 4. Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "wallet_address": "0.0.12345",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "kyc_status": "approved",
    "is_active": true,
    "created_at": "2025-10-18T12:00:00"
  }
}
```

---

### 5. Update Profile

Update user profile information.

**Endpoint:** `PUT /api/auth/update-profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+1234567890",
  "country": "Canada"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### 6. Change Password

Change user password.

**Endpoint:** `POST /api/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "old_password": "currentpassword",
  "new_password": "newsecurepassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Codes:**
- `401`: Incorrect current password
- `400`: New password doesn't meet requirements

---

## KYC Endpoints

### 1. Get KYC Status

Get current user's KYC verification status.

**Endpoint:** `GET /api/kyc/status`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "kyc_status": "approved",
  "kyc_submitted_at": "2025-10-18T12:00:00",
  "kyc_verified_at": "2025-10-18T14:00:00",
  "kyc_rejection_reason": null,
  "is_verified": true
}
```

**KYC Status Values:**
- `not_started`: User hasn't submitted KYC
- `pending`: KYC submitted, awaiting review
- `approved`: KYC approved
- `rejected`: KYC rejected

---

### 2. Submit KYC

Submit KYC documents for verification.

**Endpoint:** `POST /api/kyc/submit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "document_type": "passport",
  "document_number": "AB123456",
  "document_country": "USA",
  "file_path": "/uploads/kyc/document.pdf",
  "file_url": "https://storage.example.com/documents/abc123.pdf"
}
```

**Required Fields:**
- `document_type`: passport, drivers_license, national_id, etc.
- `document_number`: Document identification number
- `document_country`: Country of issuance

**Response (201):**
```json
{
  "message": "KYC submitted successfully",
  "kyc_status": "pending",
  "document": {
    "id": 1,
    "document_type": "passport",
    "verification_status": "pending",
    "uploaded_at": "2025-10-18T12:00:00"
  }
}
```

**Error Codes:**
- `400`: KYC already approved or pending

---

### 3. Resubmit KYC

Resubmit KYC after rejection.

**Endpoint:** `POST /api/kyc/resubmit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as Submit KYC

**Response (201):**
```json
{
  "message": "KYC resubmitted successfully",
  "kyc_status": "pending",
  "document": { ... }
}
```

---

### 4. Get KYC Documents

Get all KYC documents for current user.

**Endpoint:** `GET /api/kyc/documents`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "documents": [
    {
      "id": 1,
      "document_type": "passport",
      "document_number": "AB123456",
      "verification_status": "approved",
      "uploaded_at": "2025-10-18T12:00:00",
      "verified_at": "2025-10-18T14:00:00"
    }
  ]
}
```

---

## Transaction Endpoints

### 1. Get All Transactions

Get all transactions for the current user.

**Endpoint:** `GET /api/transactions/`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `transaction_type`: Filter by "onramp" or "offramp"
- `status`: Filter by status
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Example:** `GET /api/transactions/?transaction_type=onramp&limit=10`

**Response (200):**
```json
{
  "total": 25,
  "count": 10,
  "limit": 10,
  "offset": 0,
  "transactions": [
    {
      "id": 1,
      "transaction_type": "onramp",
      "amount": "100.00",
      "fiat_amount": "100.00",
      "currency": "USD",
      "status": "completed",
      "hedera_transaction_id": "0.0.12345@1234567890.123456789",
      "created_at": "2025-10-18T12:00:00",
      "completed_at": "2025-10-18T12:05:00"
    }
  ]
}
```

---

### 2. Create Transaction

Create a new transaction (requires KYC approval).

**Endpoint:** `POST /api/transactions/create`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transaction_type": "onramp",
  "amount": "100.00",
  "fiat_amount": "100.00",
  "currency": "USD",
  "payment_method": "bank_transfer",
  "notes": "First transaction",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Required Fields:**
- `transaction_type`: "onramp" or "offramp"
- `amount`: Crypto amount
- `fiat_amount`: Fiat amount

**Response (201):**
```json
{
  "message": "Transaction created successfully",
  "transaction": { ... }
}
```

**Error Codes:**
- `403`: KYC verification required

---

### 3. Update Transaction Status

Update the status of a transaction.

**Endpoint:** `PUT /api/transactions/<id>/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "hedera_transaction_id": "0.0.12345@1234567890.123456789",
  "hedera_transaction_hash": "0x..."
}
```

**Valid Status Values:**
- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`

**Response (200):**
```json
{
  "message": "Transaction status updated successfully",
  "transaction": { ... }
}
```

---

### 4. Get Transaction Statistics

Get transaction statistics for current user.

**Endpoint:** `GET /api/transactions/stats`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total_transactions": 25,
  "by_type": {
    "onramp": 15,
    "offramp": 10
  },
  "by_status": {
    "pending": 2,
    "processing": 1,
    "completed": 20,
    "failed": 1,
    "cancelled": 1
  },
  "recent_transactions": [ ... ]
}
```

---

### 5. Cancel Transaction

Cancel a pending or processing transaction.

**Endpoint:** `POST /api/transactions/<id>/cancel`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Transaction cancelled successfully",
  "transaction": { ... }
}
```

**Error Codes:**
- `400`: Can only cancel pending/processing transactions

---

## User Data CRUD Endpoints

### 1. Get All User Data

Get all data entries for current user.

**Endpoint:** `GET /api/data/`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `category`: Filter by category
- `is_public`: Filter by public/private (true/false)

**Response (200):**
```json
{
  "count": 5,
  "data": [
    {
      "id": 1,
      "key": "preferences",
      "value": { "theme": "dark", "language": "en" },
      "data_type": "json",
      "category": "settings",
      "is_public": false,
      "created_at": "2025-10-18T12:00:00",
      "updated_at": "2025-10-18T12:00:00"
    }
  ]
}
```

---

### 2. Get Data by Key

Get a specific data entry by key.

**Endpoint:** `GET /api/data/key/<key>`

**Headers:** `Authorization: Bearer <token>`

**Example:** `GET /api/data/key/preferences`

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "key": "preferences",
    "value": { "theme": "dark" },
    "data_type": "json"
  }
}
```

---

### 3. Create Data Entry

Create a new data entry.

**Endpoint:** `POST /api/data/`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "key": "preferences",
  "value": { "theme": "dark", "language": "en" },
  "category": "settings",
  "is_public": false
}
```

**Required Fields:**
- `key`: Unique key for the entry
- `value`: Can be string, number, boolean, or JSON object

**Response (201):**
```json
{
  "message": "Data entry created successfully",
  "data": { ... }
}
```

**Error Codes:**
- `409`: Key already exists

---

### 4. Update Data Entry

Update an existing data entry.

**Endpoint:** `PUT /api/data/key/<key>`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "value": { "theme": "light", "language": "es" },
  "category": "settings"
}
```

**Response (200):**
```json
{
  "message": "Data entry updated successfully",
  "data": { ... }
}
```

---

### 5. Upsert Data Entry

Create or update a data entry.

**Endpoint:** `POST /api/data/upsert`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "key": "preferences",
  "value": { "theme": "dark" },
  "category": "settings"
}
```

**Response (200/201):**
```json
{
  "message": "Data entry created/updated successfully",
  "data": { ... }
}
```

---

### 6. Delete Data Entry

Delete a data entry.

**Endpoint:** `DELETE /api/data/key/<key>`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Data entry deleted successfully"
}
```

---

### 7. Bulk Create

Create multiple data entries at once.

**Endpoint:** `POST /api/data/bulk`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "entries": [
    { "key": "setting1", "value": "value1" },
    { "key": "setting2", "value": "value2" },
    { "key": "setting3", "value": { "nested": "object" } }
  ]
}
```

**Response (201):**
```json
{
  "message": "Created 3 entries",
  "created": ["setting1", "setting2", "setting3"],
  "errors": []
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## Rate Limiting

- Default: 60 requests per minute per IP
- Configurable in environment variables

---

## Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "wallet_address": "0.0.12345",
    "wallet_type": "hashpack"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Postman Collection

A Postman collection is available for testing all endpoints. Import the collection from `postman_collection.json`.

