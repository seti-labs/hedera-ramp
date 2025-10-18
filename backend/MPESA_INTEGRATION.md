# M-Pesa Integration Guide

Complete guide for integrating M-Pesa mobile money payments for on-ramp and off-ramp operations.

## Overview

M-Pesa is a mobile money service that allows users in Kenya (and other African countries) to:
- **On-Ramp**: Pay with M-Pesa to buy cryptocurrency
- **Off-Ramp**: Sell cryptocurrency and receive M-Pesa payment

## Features

✅ **STK Push (Lipa na M-Pesa)** - For on-ramp transactions  
✅ **B2C Payments** - For off-ramp transactions  
✅ **Real-time callbacks** - Transaction status updates  
✅ **Exchange rate API** - KES to crypto conversion  
✅ **KYC requirement** - Secure transactions  

## Prerequisites

### 1. Safaricom M-Pesa API Credentials

You need to register for M-Pesa API access:

1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an account
3. Create an app to get:
   - Consumer Key
   - Consumer Secret
   - Business Shortcode
   - Passkey

### 2. Environment Configuration

Add these to your `.env` file:

```env
# M-Pesa Sandbox (for testing)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your-encrypted-password
MPESA_API_URL=https://sandbox.safaricom.co.ke

# M-Pesa Production (when ready)
# MPESA_API_URL=https://api.safaricom.co.ke

# Callback URLs (must be publicly accessible)
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
MPESA_QUEUE_TIMEOUT_URL=https://yourdomain.com/api/mpesa/timeout
MPESA_RESULT_URL=https://yourdomain.com/api/mpesa/result
```

## API Endpoints

### 1. M-Pesa On-Ramp (Buy Crypto with M-Pesa)

**Endpoint:** `POST /api/mpesa/onramp/initiate`

**Description:** User pays via M-Pesa to buy cryptocurrency.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000,
  "phone_number": "254712345678",
  "crypto_amount": "23.4",
  "account_reference": "CRYPTO_BUY"
}
```

**Required Fields:**
- `amount`: Amount in KES (Kenyan Shillings), min: 1, max: 150,000
- `phone_number`: M-Pesa phone number in format 254XXXXXXXXX

**Optional Fields:**
- `crypto_amount`: Equivalent crypto amount
- `account_reference`: Transaction reference

**Response (201):**
```json
{
  "message": "M-Pesa payment initiated. Check your phone for payment prompt.",
  "transaction_id": 123,
  "checkout_request_id": "ws_CO_12345",
  "merchant_request_id": "29115-34620561-1",
  "amount": 1000,
  "currency": "KES"
}
```

**Flow:**
1. User initiates on-ramp with amount
2. STK Push sent to user's phone
3. User enters M-Pesa PIN on phone
4. Payment confirmed via callback
5. Crypto transferred to user's wallet

---

### 2. M-Pesa Off-Ramp (Sell Crypto for M-Pesa)

**Endpoint:** `POST /api/mpesa/offramp/initiate`

**Description:** User sells cryptocurrency and receives M-Pesa payment.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 5000,
  "phone_number": "254712345678",
  "crypto_amount": "117.0",
  "notes": "Selling HBAR"
}
```

**Required Fields:**
- `amount`: Amount in KES to receive, min: 10, max: 150,000
- `phone_number`: M-Pesa phone number in format 254XXXXXXXXX
- `crypto_amount`: Amount of crypto to sell

**Response (201):**
```json
{
  "message": "M-Pesa payment initiated. You will receive money shortly.",
  "transaction_id": 124,
  "conversation_id": "AG_20231018_12345",
  "amount": 5000,
  "currency": "KES",
  "phone_number": "254712345678"
}
```

**Flow:**
1. User initiates off-ramp with crypto amount
2. System locks/burns user's crypto
3. B2C payment sent to user's M-Pesa
4. Payment confirmed via result callback
5. Transaction completed

---

### 3. Get Transaction Status

**Endpoint:** `GET /api/mpesa/status/<transaction_id>`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "transaction_id": 123,
  "status": "completed",
  "transaction_type": "onramp",
  "amount": "1000",
  "currency": "KES",
  "created_at": "2025-10-18T12:00:00",
  "completed_at": "2025-10-18T12:02:00",
  "notes": "M-Pesa payment successful. Receipt: PQR7890"
}
```

---

### 4. Get Exchange Rates

**Endpoint:** `GET /api/mpesa/rates`

**Response (200):**
```json
{
  "KES_TO_HBAR": 0.0234,
  "HBAR_TO_KES": 42.74,
  "last_updated": "2025-10-18T12:00:00",
  "currency": "KES"
}
```

---

### 5. Get M-Pesa Configuration

**Endpoint:** `GET /api/mpesa/config`

**Response (200):**
```json
{
  "enabled": true,
  "currency": "KES",
  "min_onramp_amount": 1,
  "max_onramp_amount": 150000,
  "min_offramp_amount": 10,
  "max_offramp_amount": 150000,
  "phone_number_format": "254XXXXXXXXX",
  "supported_countries": ["KE"]
}
```

---

## Callback Endpoints

### STK Push Callback

**Endpoint:** `POST /api/mpesa/callback`

**Description:** Safaricom calls this endpoint with payment results.

**Payload Example:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_12345",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1000
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "PQR7890XYZ"
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

**Result Codes:**
- `0`: Success
- `1032`: Request cancelled by user
- `1037`: Timeout (user didn't enter PIN)
- `2001`: Invalid initiator

---

### B2C Result Callback

**Endpoint:** `POST /api/mpesa/result`

**Description:** Safaricom calls this endpoint with B2C payment results.

**Payload Example:**
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20231018_12345",
    "TransactionID": "PQR7890XYZ",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "TransactionAmount",
          "Value": 5000
        },
        {
          "Key": "TransactionReceipt",
          "Value": "PQR7890XYZ"
        }
      ]
    }
  }
}
```

---

## Testing

### 1. Test Phone Numbers (Sandbox)

Safaricom provides test phone numbers for sandbox:
- `254708374149` - Always succeeds
- `254711222333` - Always fails

### 2. Test with cURL

**Initiate On-Ramp:**
```bash
curl -X POST http://localhost:5000/api/mpesa/onramp/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "phone_number": "254708374149"
  }'
```

**Check Status:**
```bash
curl http://localhost:5000/api/mpesa/status/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Rates:**
```bash
curl http://localhost:5000/api/mpesa/rates
```

---

## Frontend Integration

### Example React Component

```typescript
import { useState } from 'react';
import { mpesaAPI } from '@/services/api';

export function MPesaOnRamp() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('254');
  
  const handleOnRamp = async () => {
    try {
      const response = await mpesaAPI.initiateOnRamp({
        amount: parseFloat(amount),
        phone_number: phone
      });
      
      alert('Check your phone for M-Pesa payment prompt!');
    } catch (error) {
      console.error('M-Pesa error:', error);
    }
  };
  
  return (
    <div>
      <h2>Buy Crypto with M-Pesa</h2>
      <input
        type="number"
        placeholder="Amount in KES"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="tel"
        placeholder="254712345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={handleOnRamp}>Pay with M-Pesa</button>
    </div>
  );
}
```

---

## Production Checklist

Before going live:

- [ ] Get production M-Pesa credentials
- [ ] Update `MPESA_API_URL` to production URL
- [ ] Set up SSL/HTTPS for callbacks
- [ ] Register public callback URLs with Safaricom
- [ ] Test with real phone numbers
- [ ] Implement proper exchange rate API
- [ ] Set up monitoring for failed transactions
- [ ] Implement retry logic for failed callbacks
- [ ] Add transaction reconciliation
- [ ] Set up customer support for M-Pesa issues
- [ ] Comply with Kenyan financial regulations
- [ ] Implement fraud detection

---

## Troubleshooting

### Issue: "Invalid Access Token"
**Solution:** Check your consumer key and secret are correct.

### Issue: "Request cancelled by user"
**Solution:** User cancelled the payment prompt. This is normal user behavior.

### Issue: "Callback not received"
**Solution:** 
- Ensure callback URL is publicly accessible
- Check firewall settings
- Verify URL is registered with Safaricom

### Issue: "Amount validation failed"
**Solution:** Check amount is within limits (1-150,000 KES).

---

## Security Considerations

1. **Callback Validation**: Verify callbacks are from Safaricom's IPs
2. **Amount Limits**: Enforce min/max transaction limits
3. **Rate Limiting**: Prevent abuse of API endpoints
4. **KYC Required**: Only allow verified users to transact
5. **Audit Trail**: Log all M-Pesa transactions
6. **Encryption**: Use HTTPS for all communications
7. **PCI Compliance**: Follow payment security standards

---

## Support

- **Safaricom Support**: https://developer.safaricom.co.ke/support
- **M-Pesa Rates**: Contact Safaricom for current rates and fees
- **Integration Issues**: Check Safaricom developer forums

---

## Additional Resources

- [Safaricom Developer Portal](https://developer.safaricom.co.ke)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/APIs)
- [M-Pesa Business](https://www.safaricom.co.ke/personal/m-pesa)

