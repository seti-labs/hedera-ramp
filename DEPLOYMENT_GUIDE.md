# 🚀 Hedera Ramp Hub Smart Contract Deployment Guide

## 📋 Prerequisites

### 1. **Hedera Account Setup**
- Visit [Hedera Portal](https://portal.hedera.com)
- Create a testnet account
- Get your Account ID and Private Key
- Ensure you have at least 10 HBAR for deployment

### 2. **Environment Setup**
```bash
# Install Node.js dependencies
cd contracts
npm install @hashgraph/sdk

# Install Python dependencies
cd ../backend
pip install hedera-sdk-py
```

## 🔧 **Step 1: Set Environment Variables**

Create a `.env` file in the contracts directory:

```bash
# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key-here

# Contract Configuration
INITIAL_BALANCE=10
GAS_LIMIT=1000000
```

## 🚀 **Step 2: Deploy Smart Contract**

### **Option A: Using the Deployment Script**
```bash
cd contracts
node scripts/deploy-contract.js
```

### **Option B: Manual Deployment**
```bash
# Set environment variables
export HEDERA_NETWORK=testnet
export HEDERA_OPERATOR_ID=0.0.123456789
export HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...

# Run deployment
node scripts/deploy-contract.js
```

## 📋 **Step 3: Get Contract ID**

After successful deployment, you'll see:
```
✅ Contract deployed successfully!
📋 Contract ID: 0.0.123456789
🔗 Transaction ID: 0.0.123456789@1234567890.123456789
```

**Save this Contract ID!** You'll need it for the backend integration.

## 🔧 **Step 4: Update Backend Configuration**

Add the contract ID to your backend `.env` file:

```bash
# Add to backend/.env
HEDERA_CONTRACT_ID=0.0.123456789
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your-private-key-here
```

## 🧪 **Step 5: Test the Integration**

### **Start the Backend**
```bash
cd backend
python app.py
```

### **Test the Contract**
```bash
# Test Hedera service health
curl http://localhost:5000/api/hedera/health

# Test exchange rates
curl http://localhost:5000/api/hedera/rates/current

# Test platform stats
curl http://localhost:5000/api/hedera/platform/stats
```

### **Run Integration Tests**
```bash
cd backend
python test_hedera_integration.py
```

## 🔍 **Step 6: Verify Deployment**

### **Check Contract on Hedera Explorer**
1. Go to [Hedera Explorer](https://hashscan.io/testnet)
2. Search for your Contract ID
3. Verify the contract is deployed and active

### **Test Contract Functions**
```bash
# Test user registration (requires authentication)
curl -X POST http://localhost:5000/api/hedera/users/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"phone_number": "254712345678", "country_code": "KE"}'
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. "Contract ID not configured"**
- Ensure `HEDERA_CONTRACT_ID` is set in your `.env` file
- Check that the contract ID is correct

#### **2. "Invalid network"**
- Verify `HEDERA_NETWORK` is set to "testnet" or "mainnet"
- Ensure your operator credentials match the network

#### **3. "Insufficient balance"**
- Ensure your operator account has enough HBAR
- Check that the contract has sufficient balance

#### **4. "Transaction failed"**
- Check gas limits
- Verify all required parameters are provided
- Ensure the contract is not paused

### **Debug Commands:**
```bash
# Check Hedera service status
curl http://localhost:5000/api/hedera/health

# Check contract configuration
echo $HEDERA_CONTRACT_ID
echo $HEDERA_NETWORK

# Test with small amounts first
curl "http://localhost:5000/api/hedera/rates/calculate-hbar?kes_amount=25000000000000000000"
```

## 📊 **Step 7: Monitor the Contract**

### **Platform Statistics**
```bash
curl http://localhost:5000/api/hedera/platform/stats
```

### **Exchange Rates**
```bash
curl http://localhost:5000/api/hedera/rates/current
```

### **Transaction History**
- Check Hedera Explorer for transaction history
- Monitor your backend logs for contract interactions

## 🚀 **Step 8: Production Deployment**

### **Mainnet Deployment**
1. **Get Mainnet Account**
   - Create mainnet account on Hedera Portal
   - Ensure sufficient HBAR for deployment

2. **Update Configuration**
   ```bash
   export HEDERA_NETWORK=mainnet
   export HEDERA_OPERATOR_ID=0.0.MAINNET_ACCOUNT_ID
   export HEDERA_OPERATOR_KEY=mainnet-private-key
   ```

3. **Deploy to Mainnet**
   ```bash
   node scripts/deploy-contract.js
   ```

4. **Update Backend**
   - Update `HEDERA_NETWORK=mainnet` in backend `.env`
   - Update `HEDERA_CONTRACT_ID` with mainnet contract ID

## ✅ **Success Checklist**

- [ ] Smart contract deployed successfully
- [ ] Contract ID obtained and saved
- [ ] Backend configuration updated
- [ ] Hedera service health check passes
- [ ] Exchange rates are working
- [ ] Platform statistics are accessible
- [ ] Integration tests pass
- [ ] Contract visible on Hedera Explorer

## 🆘 **Support**

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify configuration** - all environment variables set correctly
3. **Test with small amounts** first
4. **Check Hedera Explorer** for transaction status
5. **Review the contract code** for any issues

## 📞 **Need Help?**

- **Hedera Documentation**: [docs.hedera.com](https://docs.hedera.com)
- **Hedera Discord**: [discord.gg/hedera](https://discord.gg/hedera)
- **GitHub Issues**: Create an issue in the repository

---

**🎉 Congratulations! Your Hedera Ramp Hub smart contract is now deployed and ready to use!**
