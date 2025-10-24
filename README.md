# Hedera Ramp Hub 🚀

**Mobile Money to HBAR On/Off-Ramp Platform**

Built by **SetiLabs** • Powered by Hedera Hashgraph

## 🌟 Overview

Hedera Ramp Hub is a seamless on-ramp and off-ramp solution that connects mobile money with Hedera's HBAR cryptocurrency, specifically designed for the Kenyan market.

## ✨ Features

- ✅ **Mobile Money Integration** - Full on-ramp and off-ramp support via Intersend
- ✅ **Hedera Wallets** - HashPack & Blade wallet support
- ✅ **Real-time Balance** - Live from Hedera Mirror Node
- ✅ **Transaction Receipts** - View, download, and print
- ✅ **Live Stats** - Real-time platform statistics
- ✅ **Wallet-Based Auth** - Your wallet is your identity

## 🚀 Live Application

**Frontend:** http://localhost:8081  
**Backend API:** http://localhost:5000

## 📊 Transaction Limits

### On-Ramp (Buy HBAR)
- **Minimum:** 25 KES
- **Maximum:** 150,000 KES
- **Payment:** Mobile money via Intersend

### Off-Ramp (Sell HBAR)
- **Minimum:** 2 HBAR or 25 KES
- **Maximum:** 150,000 KES
- **Payment:** Mobile money via Intersend

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- HashConnect SDK (@hashgraph/hashconnect)

### Backend
- Python 3.9+ / Flask
- SQLAlchemy
- Hedera SDK (hedera-sdk-py)
- M-Pesa API Integration
- JWT Authentication

### Blockchain
- Hedera Hashgraph (Testnet)
- Hedera Mirror Node API
- HashPack Wallet
- Blade Wallet

## 🔧 SDKs & Technologies Explained

This application integrates multiple SDKs to provide seamless interaction between M-Pesa, Hedera blockchain, and the user interface.

### 1. **Hedera HashConnect SDK** (`@hashgraph/hashconnect`)

**Version:** 1.24.0  
**Purpose:** Connect web applications to Hedera wallets

#### What It Does
- Pairs browser with HashPack/Blade wallet extensions
- Enables transaction signing through wallet
- Manages secure communication between dApp and wallet
- Persists wallet sessions across page reloads

#### How We Use It

**Location:** `src/context/WalletContext.tsx`

```typescript
// Initialize HashConnect
const hashconnect = new HashConnect();

// Connect to wallet
const appMetadata = {
  name: "Hedera Ramp Hub",
  description: "M-Pesa to HBAR ramp",
  icon: "/hedera-logo.svg"
};

await hashconnect.init(appMetadata, "testnet", true);
const state = await hashconnect.connect();

// Get wallet address (e.g., 0.0.1234567)
const accountId = state.pairingData[0].accountIds[0];
```

**Real Flow:**
1. User clicks "Connect Wallet" → HashConnect opens wallet popup
2. User approves in HashPack/Blade → App receives account ID
3. Session persists → Auto-reconnect on next visit

---

### 2. **Hedera Python SDK** (`hedera-sdk-py`)

**Version:** 2.50.0  
**Purpose:** Server-side blockchain operations

#### What It Does
- Transfers HBAR between accounts
- Validates Hedera account IDs
- Creates and signs transactions
- Interacts with smart contracts (ready for future)

#### How We Use It

**Location:** `backend/hedera_service.py`

```python
from hedera import Client, AccountId, TransferTransaction, Hbar

# Setup client
client = Client.forTestnet()
client.setOperator(operator_id, operator_key)

# Transfer HBAR to user (on-ramp complete)
def send_hbar(user_wallet, amount):
    tx = TransferTransaction()
        .addHbarTransfer(operator_id, Hbar(-amount))  # From platform
        .addHbarTransfer(user_wallet, Hbar(amount))    # To user
    
    receipt = tx.execute(client).getReceipt(client)
    return receipt.status  # SUCCESS
```

**Real Flow:**
1. User pays 1000 KES via M-Pesa → Backend receives confirmation
2. Python SDK transfers 23.5 HBAR → User's wallet updated
3. Transaction recorded on Hedera → Immutable proof

**Note:** Requires Java Runtime Environment (JRE)

---

### 3. **Recharts** (`recharts`)

**Version:** 2.15.4  
**Purpose:** Transaction activity visualization

#### What It Does
- Renders responsive charts using React components
- Displays 7-day transaction trends
- Interactive tooltips on hover
- Auto-scales to data ranges

#### How We Use It

**Location:** `src/pages/Landing.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

// Data from backend
const dailyActivity = [
  { date: '2025-10-12', count: 15 },
  { date: '2025-10-13', count: 23 },
  { date: '2025-10-14', count: 18 },
  // ... 7 days
];

<LineChart data={dailyActivity}>
  <Line dataKey="count" stroke="#171717" strokeWidth={3} />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
</LineChart>
```

**Real Flow:**
1. Landing page loads → Fetches `/api/public/stats`
2. Backend counts last 7 days → Returns daily transaction counts
3. Recharts renders line chart → Shows activity trends

---

### 4. **Hedera Mirror Node API** (REST)

**Purpose:** Query blockchain data without running a node

#### What It Does
- Provides REST API to Hedera's public data
- Returns current account balances
- Shows transaction history
- No authentication needed for public data

#### How We Use It

**Location:** `src/context/WalletContext.tsx`

```typescript
// Get live HBAR balance
const updateBalance = async () => {
  const response = await fetch(
    `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
  );
  const data = await response.json();
  
  // Convert tinybars to HBAR (100,000,000 tinybars = 1 HBAR)
  const hbar = data.balance.balance / 100000000;
};
```

**API Response Example:**
```json
{
  "account": "0.0.1234567",
  "balance": {
    "balance": 1500000000,
    "timestamp": "1697654321.123"
  }
}
```

**Real Flow:**
1. User connects wallet → App gets account ID (0.0.1234567)
2. Query Mirror Node → Get current balance (15 HBAR)
3. Display in navbar → Auto-refresh on demand

---

### 5. **M-Pesa Daraja API** (Safaricom)

**Purpose:** Mobile money payment integration

#### What It Does
- **STK Push:** Send payment prompt to user's phone
- **B2C Payment:** Send money from business to customer
- **Callbacks:** Receive payment confirmations
- **OAuth:** Secure API access

#### How We Use It

**Location:** `backend/routes/mpesa.py`

```python
# On-Ramp: Send STK Push
def initiate_mpesa_onramp(amount, phone):
    # Get OAuth token
    token = get_mpesa_token()
    
    # STK Push request
    response = requests.post(
        f"{MPESA_API_URL}/mpesa/stkpush/v1/processrequest",
        json={
            "BusinessShortCode": MPESA_SHORTCODE,
            "Amount": amount,
            "PhoneNumber": phone,
            "CallBackURL": MPESA_CALLBACK_URL
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# Callback: Payment confirmed
@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    data = request.json
    if data['ResultCode'] == 0:
        # Payment successful → Transfer HBAR
        send_hbar_to_user()
```

**Real Flow:**
1. User enters amount → Backend sends STK Push
2. Phone vibrates → "Enter M-Pesa PIN to pay 1000 KES"
3. User enters PIN → M-Pesa calls our callback
4. Backend transfers HBAR → Transaction complete

---

## 📊 Complete SDK Flow Diagram

```
┌──────────────────────────────────────┐
│         USER BROWSER                 │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  HashConnect SDK             │   │
│  │  • Connects to wallet        │   │
│  │  • Gets account ID           │   │
│  └───────────┬──────────────────┘   │
│              │                       │
│              ↓                       │
│  ┌──────────────────────────────┐   │
│  │  Wallet Extension            │   │
│  │  (HashPack / Blade)          │   │
│  │  • Signs transactions        │   │
│  │  • Stores private keys       │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Recharts                    │   │
│  │  • Displays activity chart   │   │
│  │  • 7-day trends              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Axios + Mirror Node API     │   │
│  │  • Fetches live balance      │   │
│  │  • No auth needed            │   │
│  └───────────┬──────────────────┘   │
└──────────────┼──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│      BACKEND SERVER (Flask)          │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Hedera Python SDK           │   │
│  │  • Transfers HBAR            │   │
│  │  • Validates accounts        │   │
│  │  • Signs with operator key   │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  M-Pesa Daraja API           │   │
│  │  • STK Push (on-ramp)        │   │
│  │  • B2C Payment (off-ramp)    │   │
│  │  • OAuth authentication      │   │
│  └──────────────────────────────┘   │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│       HEDERA TESTNET                 │
│  • Immutable ledger                  │
│  • Account: 0.0.1234567              │
│  • Mirror Node: Public API           │
└──────────────────────────────────────┘
```

---

## 🔄 Example: Complete On-Ramp Transaction

**Using All SDKs Together:**

```
1. Frontend: HashConnect SDK
   → User connects wallet
   → Get account ID: 0.0.1234567

2. Frontend: React Form
   → User enters: 1000 KES
   → Calculates: ~23.5 HBAR

3. Frontend: Axios
   → POST /api/mpesa/onramp/initiate

4. Backend: M-Pesa API
   → Sends STK Push to phone

5. User's Phone
   → "Enter PIN to pay 1000 KES"
   → User enters PIN

6. M-Pesa → Backend Callback
   → Payment confirmed
   → POST /api/mpesa/callback

7. Backend: Hedera Python SDK
   → Transfer 23.5 HBAR
   → From: 0.0.9999999 (platform)
   → To: 0.0.1234567 (user)

8. Hedera Blockchain
   → Transaction confirmed
   → TX ID: 0.0.123@1697654321.000

9. Frontend: Mirror Node API
   → Fetch new balance
   → Old: 15.0 HBAR
   → New: 38.5 HBAR

10. Frontend: Recharts
    → Updates daily chart
    → Today's count: +1
```

**All happens in ~30 seconds!**

---

## 📦 Quick Start

### 1. Start Backend
```bash
cd backend
pip3 install -r requirements.txt
python3 app.py
```

### 2. Start Frontend
```bash
npm install
npm run dev
```

### 3. Open Application
Visit http://localhost:8081

## 🔧 Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (backend/.env)
```env
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///hedera_ramp.db

# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key

# M-Pesa
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_API_URL=https://sandbox.safaricom.co.ke
```

## 📱 How It Works

### User Flow
1. **Connect Wallet** - HashPack or Blade (your wallet = your identity)
2. **Choose Transaction** - On-Ramp or Off-Ramp
3. **Use M-Pesa** - Pay or receive via mobile money
4. **Get Receipt** - Download transaction receipt

### On-Ramp (M-Pesa → HBAR)
1. Enter KES amount (min 25 KES)
2. Enter M-Pesa phone number
3. Approve M-Pesa payment on phone
4. Receive HBAR in wallet

### Off-Ramp (HBAR → M-Pesa)
1. Enter HBAR amount (min 2 HBAR)
2. Enter M-Pesa phone number
3. Confirm transaction
4. Receive KES via M-Pesa

## 🔐 Security

- **Non-Custodial** - Users control their private keys
- **Wallet-Based Identity** - Hedera wallet = verification
- **JWT Authentication** - Secure API access
- **No Password Storage** - For wallet-only signups
- **Blockchain Verified** - All transactions on-chain

## 📊 API Endpoints

### Public (No Auth)
- `GET /api/public/stats` - Platform statistics
- `GET /api/health` - Health check

### Protected (Auth Required)
- `POST /api/mpesa/onramp/initiate` - Buy HBAR
- `POST /api/mpesa/offramp/initiate` - Sell HBAR
- `GET /api/transactions/` - Get transactions
- `GET /api/mpesa/rates` - Exchange rates

## 🚀 Deployment

### Frontend (Vercel)
- **URL:** https://hedera-ramp.vercel.app
- **Auto-deploys** from `main` branch
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Backend (Render)
- **URL:** https://hedera-ramp.onrender.com
- **Auto-deploys** from `main` branch
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn --bind 0.0.0.0:$PORT wsgi:app`

### ⚠️ Important: CORS Configuration on Render

If you see CORS errors in the browser console, you **MUST** update the `CORS_ORIGINS` environment variable in your Render dashboard:

1. Go to: https://dashboard.render.com
2. Find your backend service: **hedera-ramp-backend**
3. Click **"Environment"** tab
4. Find or add `CORS_ORIGINS` variable
5. Set value to:
   ```
   https://hedera-ramp.vercel.app,http://localhost:5173,http://localhost:8080
   ```
6. Click **"Save Changes"** (this will auto-redeploy)

**Why?** Render dashboard environment variables override `render.yaml` settings.

## 📚 Documentation

- `README.md` - This file (main documentation)
- `INTEGRATIONS.md` - Smart contract & M-Pesa integration guide

## 🎯 Status

**Backend:** ✅ Running  
**Frontend:** ✅ Running  
**Hedera Integration:** ✅ Complete  
**M-Pesa Integration:** ✅ Complete  
**Wallet Support:** ✅ HashPack & Blade  
**Receipts:** ✅ Functional  
**Live Stats:** ✅ Working  

## 🌍 Target Market

**Primary:** Kenya 🇰🇪  
**Currency:** Kenyan Shillings (KES)  
**Payment:** M-Pesa mobile money  
**Blockchain:** Hedera HBAR  

## 🏢 Credits

**Built by:** SetiLabs  
**Blockchain:** Hedera Hashgraph  
**Payment:** M-Pesa (Safaricom)  

## 📞 Support

For questions or support, contact SetiLabs.

## 📄 License

© 2025 SetiLabs. All rights reserved.

---

**Visit:** http://localhost:8081  
**Status:** ✅ Production Ready
