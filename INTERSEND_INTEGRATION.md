# Intersend Integration Guide

Complete guide for integrating Intersend mobile money payments for on-ramp and off-ramp operations.

## Overview

Intersend is a mobile money service that allows users to:
- **On-Ramp**: Pay with mobile money to buy cryptocurrency
- **Off-Ramp**: Sell cryptocurrency and receive mobile money payment

## Features

✅ **Mobile Money Payments** - For on-ramp transactions  
✅ **Mobile Money Transfers** - For off-ramp transactions  
✅ **Real-time callbacks** - Transaction status updates  
✅ **Exchange rate API** - KES to crypto conversion  
✅ **KYC requirement** - Secure transactions  

## Prerequisites

### 1. Intersend API Credentials

You need to register for Intersend API access:

1. Visit [Intersend Developer Portal](https://developer.intersend.com)
2. Create an account
3. Create an app to get:
   - API Key
   - API URL
   - Callback URLs

### 2. Environment Configuration

Add these to your `.env` file:

```env
# Intersend API Configuration
INTERSEND_API_KEY=your-api-key
INTERSEND_API_URL=https://api.intersend.com

# Callback URLs (must be publicly accessible)
INTERSEND_CALLBACK_URL=https://yourdomain.com/api/intersend/callback
```

## API Endpoints

### 1. Intersend On-Ramp (Buy Crypto with Mobile Money)

**Endpoint:** `POST /api/intersend/onramp/initiate`

**Description:** User pays via mobile money to buy cryptocurrency.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000,
  "phone_number": "254708374149",
  "crypto_amount": "23.5"
}
```

**Response:**
```json
{
  "message": "Payment initiated successfully",
  "transaction_id": 123,
  "intersend_transaction_id": "IS_123456789",
  "status": "pending",
  "amount": 1000,
  "crypto_amount": "23.5",
  "phone_number": "254708374149"
}
```

### 2. Intersend Off-Ramp (Sell Crypto for Mobile Money)

**Endpoint:** `POST /api/intersend/offramp/initiate`

**Description:** User sells cryptocurrency to receive mobile money.

**Request Body:**
```json
{
  "amount": 1000,
  "phone_number": "254708374149",
  "crypto_amount": "23.5"
}
```

**Response:**
```json
{
  "message": "Transfer initiated successfully",
  "transaction_id": 124,
  "intersend_transaction_id": "IS_987654321",
  "status": "pending",
  "amount": 1000,
  "crypto_amount": "23.5",
  "phone_number": "254708374149"
}
```

### 3. Get Exchange Rates

**Endpoint:** `GET /api/intersend/rates`

**Response:**
```json
{
  "KES_TO_HBAR": 0.0235,
  "HBAR_TO_KES": 42.55,
  "last_updated": "2025-01-18T12:00:00Z",
  "currency": "KES",
  "provider": "intersend"
}
```

### 4. Transaction Status

**Endpoint:** `GET /api/intersend/status/{transaction_id}`

**Response:**
```json
{
  "transaction_id": 123,
  "status": "completed",
  "amount": 1000,
  "crypto_amount": "23.5",
  "phone_number": "254708374149",
  "created_at": "2025-01-18T12:00:00Z",
  "completed_at": "2025-01-18T12:05:00Z"
}
```

### 5. Configuration

**Endpoint:** `GET /api/intersend/config`

**Response:**
```json
{
  "provider": "intersend",
  "supported_currencies": ["KES"],
  "min_amount": 25,
  "max_amount": 150000,
  "phone_number_format": "254XXXXXXXXX",
  "supported_countries": ["KE"],
  "features": {
    "onramp": true,
    "offramp": true,
    "real_time_rates": true,
    "instant_transfers": true
  }
}
```

## Callback Handling

### Intersend Callback Endpoint

**Endpoint:** `POST /api/intersend/callback`

**Description:** Intersend calls this endpoint with transaction results.

**Request Body:**
```json
{
  "transaction_id": "IS_123456789",
  "reference": "ONRAMP_123",
  "status": "completed",
  "amount": 1000,
  "phone_number": "254708374149"
}
```

**Response:**
```json
{
  "message": "Callback processed successfully",
  "transaction_id": 123,
  "status": "completed"
}
```

## Transaction Flow

### On-Ramp Flow

```
1. User enters amount (25-150,000 KES)
   ↓
2. POST /api/intersend/onramp/initiate
   ↓
3. Backend calls Intersend API
   ↓
4. User receives mobile money prompt
   ↓
5. User enters PIN
   ↓
6. Intersend calls /api/intersend/callback
   ↓
7. Backend transfers HBAR to user
   ↓
8. Transaction complete
```

### Off-Ramp Flow

```
1. User enters HBAR amount (min 2 HBAR)
   ↓
2. POST /api/intersend/offramp/initiate
   ↓
3. Backend calls Intersend API
   ↓
4. Backend transfers HBAR from user
   ↓
5. Intersend sends mobile money
   ↓
6. Intersend calls /api/intersend/callback
   ↓
7. Transaction complete
```

## Error Handling

### Common Error Responses

**Invalid Amount:**
```json
{
  "error": "Invalid amount",
  "message": "Amount must be between 25 and 150,000 KES"
}
```

**Invalid Phone Number:**
```json
{
  "error": "Invalid phone number",
  "message": "Phone number must be in format 254XXXXXXXXX"
}
```

**Payment Failed:**
```json
{
  "error": "Payment initiation failed",
  "message": "Unable to initiate payment with Intersend"
}
```

## Testing

### Test On-Ramp
```bash
curl -X POST http://localhost:5000/api/intersend/onramp/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "phone_number": "254708374149", "crypto_amount": "2.35"}'
```

### Test Off-Ramp
```bash
curl -X POST http://localhost:5000/api/intersend/offramp/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "phone_number": "254708374149", "crypto_amount": "2.35"}'
```

### Check Rates
```bash
curl http://localhost:5000/api/intersend/rates
```

## Production Deployment

1. Register callback URLs with Intersend
2. Update .env with production credentials
3. Use HTTPS for callbacks
4. Test thoroughly before launch

## Security Considerations

- **API Key Security**: Store API keys securely
- **Callback Validation**: Validate callback signatures
- **Rate Limiting**: Implement rate limiting
- **HTTPS Only**: Use HTTPS for all communications
- **Input Validation**: Validate all inputs

## Support

For questions or support, contact Intersend support or refer to their documentation.
