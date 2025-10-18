# Integration Guide - Hedera Ramp Hub

**Complete integration guide for M-Pesa, Hedera, and Smart Contracts**

Built by SetLabs • Powered by Hedera Hashgraph

---

## Table of Contents

1. [M-Pesa Integration](#m-pesa-integration)
2. [Hedera Integration](#hedera-integration)
3. [Smart Contract Integration](#smart-contract-integration-optional)

---

# M-Pesa Integration

## 📋 Overview

Enable users to buy and sell HBAR using M-Pesa mobile money.

- **On-Ramp:** KES → HBAR (STK Push)
- **Off-Ramp:** HBAR → KES (B2C Payment)

## 🔑 Prerequisites

### 1. Get Safaricom API Credentials

Visit: https://developer.safaricom.co.ke

1. Create account
2. Create an app
3. Get credentials:
   - Consumer Key
   - Consumer Secret
   - Business Shortcode
   - Passkey
   - Initiator Name
   - Security Credential

### 2. Sandbox Test Credentials

- **Shortcode:** 174379
- **Test Phone (Success):** 254708374149
- **Test Phone (Fail):** 254711222333

## 📁 Files Used

### Backend
```
backend/routes/mpesa.py          Main M-Pesa logic
backend/models.py                Transaction database model
backend/.env                     API credentials
```

### Frontend
```
src/pages/MPesa.tsx              M-Pesa UI
src/services/mpesa.ts            API client
```

## ⚙️ Configuration

### Step 1: Update Backend .env

```env
# M-Pesa Sandbox
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your-credential
MPESA_API_URL=https://sandbox.safaricom.co.ke

# Callback URLs (must be public)
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
MPESA_RESULT_URL=https://yourdomain.com/api/mpesa/result
```

### Step 2: Production Setup

```env
MPESA_API_URL=https://api.safaricom.co.ke
# Use production credentials
```

## 🔄 How It Works

### On-Ramp (Buy HBAR)

```
1. User enters KES amount (25-150,000)
   ↓
2. POST /api/mpesa/onramp/initiate
   ↓
3. Backend sends STK Push to phone
   ↓
4. User enters M-Pesa PIN
   ↓
5. M-Pesa calls /api/mpesa/callback
   ↓
6. Backend transfers HBAR
   ↓
7. Transaction complete
```

### Off-Ramp (Sell HBAR)

```
1. User enters HBAR amount (min 2 HBAR)
   ↓
2. POST /api/mpesa/offramp/initiate
   ↓
3. Backend sends B2C payment
   ↓
4. M-Pesa calls /api/mpesa/result
   ↓
5. KES sent to user's M-Pesa
   ↓
6. Transaction complete
```

## 📝 Transaction Limits

- **On-Ramp Min:** 25 KES
- **On-Ramp Max:** 150,000 KES
- **Off-Ramp Min:** 2 HBAR or 25 KES
- **Off-Ramp Max:** 150,000 KES

## 🧪 Testing

### Test On-Ramp
```bash
curl -X POST http://localhost:5000/api/mpesa/onramp/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "phone_number": "254708374149"}'
```

### Check Rates
```bash
curl http://localhost:5000/api/mpesa/rates
```

## 🚀 Production Deployment

1. Register callback URLs with Safaricom
2. Update .env with production credentials
3. Use HTTPS for callbacks
4. Test thoroughly before launch

---

# Hedera Integration

## 📋 Overview

Real Hedera Hashgraph integration using official SDKs and wallets.

## 🛠️ Tools Used

- **Backend:** `hedera-sdk-py` (Python)
- **Frontend:** `@hashgraph/hashconnect` (JavaScript)
- **Wallets:** HashPack, Blade
- **Mirror Node:** Live balance queries

## 📁 Files Used

### Backend
```
backend/hedera_service.py        Hedera SDK logic
backend/routes/auth.py           Wallet-based auth
backend/.env                     Hedera credentials
```

### Frontend
```
src/context/WalletContext.tsx    Wallet connection
src/components/WalletConnect.tsx Dialog UI
src/services/api.ts              API integration
```

## ⚙️ Configuration

### Backend Setup

```env
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key-here
```

### Get Hedera Account

1. Visit: https://portal.hedera.com
2. Create testnet account
3. Get Account ID and Private Key
4. Fund with testnet HBAR

## 🔐 Wallet-Based KYC

### How It Works

```
1. User clicks "Connect Wallet"
   ↓
2. Choose HashPack or Blade
   ↓
3. Approve in wallet extension
   ↓
4. Wallet address retrieved
   ↓
5. Backend auto-registers user
   ↓
6. Auto-approved (wallet = identity)
```

### Benefits

- ✅ No document uploads
- ✅ No manual verification
- ✅ Instant approval
- ✅ Blockchain-verified
- ✅ Non-custodial

## 🔄 Features

### Live Balance
Fetched from Hedera Mirror Node:
```
GET https://testnet.mirrornode.hedera.com/api/v1/accounts/{accountId}
```

### Account Info
- Account ID
- HBAR balance
- Public key
- Account memo

### Wallet Types
- **HashPack:** Chrome extension
- **Blade:** Mobile + Browser extension

## 🧪 Testing

### Install Wallets

1. **HashPack:**
   - Chrome Web Store: "HashPack Wallet"
   - Create account
   - Get testnet HBAR from faucet

2. **Blade:**
   - Chrome Web Store: "Blade Wallet"
   - Create account
   - Get testnet HBAR

### Test Connection

1. Visit http://localhost:8081
2. Click "Get Started"
3. Click "Connect Wallet to Continue"
4. Choose wallet
5. Approve connection

## 📊 Ready for Production

### Mainnet Setup

```env
HEDERA_NETWORK=mainnet
HEDERA_OPERATOR_ID=0.0.YOUR_MAINNET_ACCOUNT
HEDERA_OPERATOR_KEY=your-mainnet-private-key
```

### HTS Token Integration

Ready to add:
- Custom tokens
- NFTs
- Token associations
- Token transfers

### HCS Integration

Ready to add:
- Message logging
- Audit trails
- Transaction history

---

# Smart Contract Integration (Optional)

## 📋 Overview

Add trustless escrow using Hedera Smart Contracts.

**Status:** Guide complete, implementation optional

## 🎯 Use Case

Hold HBAR in smart contract during M-Pesa processing:

```
1. User initiates off-ramp
   ↓
2. HBAR locked in escrow contract
   ↓
3. M-Pesa payment processed
   ↓
4. If success: Release HBAR
5. If fail: Refund HBAR
```

## 📁 Files to Create

### Smart Contract
```
backend/contracts/escrow.sol     Solidity contract
```

### Backend Service
```
backend/services/contract_service.py   Contract interaction
```

### Integration
```
backend/routes/mpesa.py          Add escrow calls
```

## 📝 Escrow Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RampEscrow {
    address public owner;
    
    struct Transaction {
        address user;
        uint256 hbarAmount;
        uint256 kesAmount;
        bool completed;
        bool refunded;
    }
    
    mapping(uint256 => Transaction) public transactions;
    
    function lockFunds(uint256 txId, uint256 kesAmount) 
        external payable {
        // Lock HBAR for off-ramp
    }
    
    function releaseFunds(uint256 txId, address payable user) 
        external {
        // Release after M-Pesa success
    }
    
    function refundFunds(uint256 txId) 
        external {
        // Refund if M-Pesa fails
    }
}
```

## 🚀 Deployment Steps

1. Compile Solidity to bytecode
2. Deploy to Hedera testnet
3. Get contract ID
4. Integrate with M-Pesa routes
5. Test escrow flow
6. Deploy to mainnet

## 📚 Resources

- **Hedera Docs:** https://docs.hedera.com/guides/docs/sdks/smart-contracts
- **Solidity:** https://docs.soliditylang.org
- **Contract Service:** https://docs.hedera.com/guides/docs/hedera-api/smart-contract-service

## ✨ Benefits

- **Trustless:** No manual intervention
- **Automated:** Instant fund release
- **Transparent:** All on-chain
- **Secure:** Funds protected
- **Refundable:** Auto-refund on failure

---

# 🎯 Quick Reference

## API Endpoints

```
Public:
GET  /api/public/stats            Live platform stats

M-Pesa:
POST /api/mpesa/onramp/initiate   Buy HBAR
POST /api/mpesa/offramp/initiate  Sell HBAR
GET  /api/mpesa/rates             Exchange rates
POST /api/mpesa/callback          Payment callback
POST /api/mpesa/result            B2C result

Auth:
POST /api/auth/signup             Register user
POST /api/auth/signin             Login user

Transactions:
GET  /api/transactions            Get history
GET  /api/transactions/:id        Get receipt
```

## Environment Variables

```env
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-key

# Database
DATABASE_URL=sqlite:///hedera_ramp.db

# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT
HEDERA_OPERATOR_KEY=your-private-key

# M-Pesa
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_API_URL=https://sandbox.safaricom.co.ke

# CORS
CORS_ORIGINS=http://localhost:8081
```

## Transaction Flow

```
Landing → Welcome → Connect Wallet → Dashboard → On/Off-Ramp → Receipt
```

---

**Built by SetLabs**  
**Powered by Hedera Hashgraph**  
**For Kenya 🇰🇪**

