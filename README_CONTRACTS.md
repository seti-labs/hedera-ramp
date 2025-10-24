# Hedera Ramp Hub Smart Contracts

**Mobile Money to HBAR On/Off-Ramp Smart Contracts for Hedera Hashgraph**

Built by **SetLabs** • Powered by Hedera Hashgraph

## 🌟 Overview

This repository contains the smart contracts for the Hedera Ramp Hub platform, enabling seamless conversion between mobile money (KES) and HBAR cryptocurrency on the Hedera network.

## ✨ Features

- ✅ **On-Ramp Transactions** - Convert KES (mobile money) to HBAR
- ✅ **Off-Ramp Transactions** - Convert HBAR to KES (mobile money)
- ✅ **KYC Verification System** - Built-in user verification
- ✅ **Transaction Limits** - Configurable min/max amounts
- ✅ **Escrow System** - Secure transaction handling
- ✅ **Exchange Rate Management** - Real-time rate updates
- ✅ **Admin Controls** - Platform management functions
- ✅ **Fee Management** - Configurable platform fees

## 🏗️ Smart Contract Architecture

### Core Contract: `HederaRampHub.sol`

The main smart contract that handles all ramp operations:

```solidity
contract HederaRampHub is ReentrancyGuard, Ownable, Pausable {
    // User management
    struct User { ... }
    
    // Transaction management
    struct Transaction { ... }
    
    // Exchange rate management
    struct ExchangeRate { ... }
}
```

### Key Components

1. **User Management**
   - User registration with phone numbers
   - KYC verification system
   - User activity tracking

2. **Transaction System**
   - On-ramp: KES → HBAR
   - Off-ramp: HBAR → KES
   - Transaction status tracking
   - Escrow functionality

3. **Exchange Rate System**
   - Real-time rate updates
   - Rate validation
   - Historical rate tracking

4. **Admin Functions**
   - Platform management
   - Fee configuration
   - Emergency controls

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Hedera account with HBAR for deployment
- Hedera SDK for JavaScript

### Installation

```bash
# Clone the repository
git clone https://github.com/setlabs/hedera-ramp-hub.git
cd hedera-ramp-hub/contracts

# Install dependencies
npm install

# Install Hedera SDK
npm install @hashgraph/sdk

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts
```

### Environment Setup

Create a `.env` file in the contracts directory:

```env
# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key
HEDERA_CONTRACT_ID=0.0.CONTRACT_ID

# Contract Configuration
INITIAL_BALANCE=10
GAS_LIMIT=1000000
ONRAMP_FEE_BPS=50
OFFRAMP_FEE_BPS=50

# Exchange Rates (example)
KES_TO_HBAR=2350000000000000
HBAR_TO_KES=425500000000000000000
```

### Deployment

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Deploy with custom network
HEDERA_NETWORK=testnet npm run deploy
```

## 📋 Contract Functions

### User Management

```javascript
// Register a new user
await registerUser("254712345678", "KE");

// Verify user KYC
await verifyUserKyc("0.0.USER_ADDRESS");

// Get user information
await getUserInfo("0.0.USER_ADDRESS");
```

### Transaction Management

```javascript
// Initiate on-ramp (KES → HBAR)
await initiateOnRamp("25000000000000000000", "254712345678"); // 25 KES

// Initiate off-ramp (HBAR → KES)
await initiateOffRamp("200000000", "254712345678"); // 2 HBAR

// Update transaction status
await updateTransactionStatus(1, 2, "intersend_tx_123", "Payment confirmed");

// Get transaction information
await getTransactionInfo(1);
```

### Exchange Rate Management

```javascript
// Update exchange rates
await updateExchangeRates(
    "2350000000000000",  // 1 KES = 0.00235 HBAR
    "425500000000000000000"  // 1 HBAR = 425.5 KES
);

// Get current rates
await getExchangeRates();

// Calculate amounts
await calculateHbarAmount("25000000000000000000"); // 25 KES
await calculateKesAmount("200000000"); // 2 HBAR
```

### Admin Functions

```javascript
// Add admin
await addAdmin("0.0.ADMIN_ADDRESS");

// Add KYC verifier
await addKycVerifier("0.0.VERIFIER_ADDRESS");

// Update platform fees
await updateFees(50, 50); // 0.5% each

// Get platform statistics
await getPlatformStats();
```

## 🔧 Integration with Backend

### Backend Integration

The smart contract integrates with your existing Flask backend:

```python
# backend/hedera_service.py
from hedera import Client, ContractId, ContractCallQuery, ContractExecuteTransaction

class HederaService:
    def __init__(self, network, operator_id, operator_key, contract_id):
        self.client = Client.forTestnet() if network == "testnet" else Client.forMainnet()
        self.client.setOperator(operator_id, operator_key)
        self.contract_id = ContractId.fromString(contract_id)
    
    def initiate_onramp(self, user_address, fiat_amount, phone_number):
        # Call smart contract initiateOnRamp function
        pass
    
    def initiate_offramp(self, user_address, hbar_amount, phone_number):
        # Call smart contract initiateOffRamp function
        pass
    
    def update_transaction_status(self, transaction_id, status, intersend_id, notes):
        # Call smart contract updateTransactionStatus function
        pass
```

### API Endpoints

Your existing API endpoints can now interact with the smart contract:

```python
# backend/routes/intersend.py
@intersend_bp.route('/onramp/initiate', methods=['POST'])
def initiate_intersend_onramp():
    # ... existing code ...
    
    # Call smart contract
    hedera_service.initiate_onramp(
        current_user.wallet_address,
        amount,
        phone_number
    )
    
    # ... rest of the code ...
```

## 📊 Transaction Flow

### On-Ramp Flow (KES → HBAR)

1. **User Registration**
   - User connects wallet
   - Registers with phone number
   - Completes KYC verification

2. **Transaction Initiation**
   - User enters KES amount (25-150,000)
   - Smart contract validates limits
   - Creates transaction record

3. **Payment Processing**
   - User pays via mobile money (Intersend)
   - Backend receives payment confirmation
   - Updates transaction status

4. **HBAR Transfer**
   - Smart contract transfers HBAR to user
   - Transaction marked as completed
   - User receives HBAR in wallet

### Off-Ramp Flow (HBAR → KES)

1. **Transaction Initiation**
   - User enters HBAR amount (min 2 HBAR)
   - Smart contract validates balance
   - Creates transaction record

2. **HBAR Escrow**
   - User's HBAR transferred to escrow
   - Transaction marked as processing

3. **Mobile Money Transfer**
   - Backend initiates KES transfer via Intersend
   - User receives KES via mobile money

4. **Completion**
   - Transaction marked as completed
   - HBAR released from escrow

## 🔐 Security Features

### Access Control

- **Owner**: Full contract control
- **Admins**: Platform management
- **KYC Verifiers**: User verification
- **Users**: Transaction operations

### Security Measures

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Input Validation**: Comprehensive parameter validation
- **Access Control**: Role-based permissions

### Transaction Limits

- **Minimum KES**: 25 KES
- **Maximum KES**: 150,000 KES
- **Minimum HBAR**: 2 HBAR
- **Rate Limits**: Configurable per user

## 📈 Platform Statistics

The contract tracks comprehensive platform metrics:

```javascript
// Get platform statistics
const stats = await getPlatformStats();
console.log(stats);
// {
//   totalTransactions: 1250,
//   totalOnRamp: 5000000000000000000000, // 5000 KES
//   totalOffRamp: 3000000000000000000000, // 3000 KES
//   totalFees: 40000000000000000000, // 40 KES
//   escrowBalance: 1000000000 // 10 HBAR
// }
```

## 🚀 Deployment Guide

### Testnet Deployment

1. **Get Testnet Account**
   - Visit [Hedera Portal](https://portal.hedera.com)
   - Create testnet account
   - Get account ID and private key

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Deploy Contract**
   ```bash
   npm run deploy:testnet
   ```

4. **Verify Deployment**
   ```bash
   node scripts/contract-interactions.js
   ```

### Mainnet Deployment

1. **Prepare Mainnet Account**
   - Ensure sufficient HBAR for deployment
   - Test all functions on testnet first

2. **Deploy to Mainnet**
   ```bash
   npm run deploy:mainnet
   ```

3. **Initialize Platform**
   - Set initial exchange rates
   - Configure admin accounts
   - Set up KYC verifiers

## 🔧 Configuration

### Exchange Rates

Update exchange rates regularly:

```javascript
// Example: Update rates every hour
setInterval(async () => {
    const newRates = await fetchExchangeRatesFromAPI();
    await updateExchangeRates(
        newRates.kesToHbar,
        newRates.hbarToKes
    );
}, 3600000); // 1 hour
```

### Fee Management

Configure platform fees:

```javascript
// Set fees to 0.5% each
await updateFees(50, 50);

// Set fees to 1% each
await updateFees(100, 100);
```

## 📚 API Reference

### Contract Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `registerUser` | Register new user | `phoneNumber`, `countryCode` |
| `verifyKyc` | Verify user KYC | `userAddress` |
| `initiateOnRamp` | Start on-ramp transaction | `fiatAmount`, `phoneNumber` |
| `initiateOffRamp` | Start off-ramp transaction | `hbarAmount`, `phoneNumber` |
| `updateTransactionStatus` | Update transaction status | `transactionId`, `status`, `intersendId`, `notes` |
| `updateExchangeRates` | Update exchange rates | `kesToHbar`, `hbarToKes` |
| `getUserInfo` | Get user information | `userAddress` |
| `getTransactionInfo` | Get transaction details | `transactionId` |
| `getPlatformStats` | Get platform statistics | None |

### Transaction Statuses

- `0` - PENDING
- `1` - PROCESSING  
- `2` - COMPLETED
- `3` - FAILED
- `4` - CANCELLED

## 🐛 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check account balance
   - Verify network configuration
   - Ensure gas limit is sufficient

2. **Transaction Fails**
   - Check user KYC status
   - Verify transaction limits
   - Ensure sufficient balance

3. **Rate Updates Fail**
   - Check admin permissions
   - Verify rate values
   - Ensure contract is not paused

### Debug Commands

```bash
# Check contract status
node -e "require('./scripts/contract-interactions.js').getPlatformStats()"

# Verify user registration
node -e "require('./scripts/contract-interactions.js').getUserInfo('0.0.USER_ADDRESS')"

# Check exchange rates
node -e "require('./scripts/contract-interactions.js').getExchangeRates()"
```

## 📞 Support

For technical support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/setlabs/hedera-ramp-hub/issues)
- **Documentation**: [Read the docs](https://docs.hedera.com)
- **Community**: [Hedera Discord](https://discord.gg/hedera)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by SetLabs for the Hedera ecosystem**
