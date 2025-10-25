#!/bin/bash

# Hedera Ramp Hub Smart Contract Deployment Script
# This script will deploy the smart contract and get the contract ID

echo "🚀 Starting Hedera Ramp Hub Smart Contract Deployment"
echo "=================================================="

# Check if required environment variables are set
if [ -z "$HEDERA_OPERATOR_ID" ] || [ "$HEDERA_OPERATOR_ID" = "0.0.YOUR_ACCOUNT_ID" ]; then
    echo "❌ Error: HEDERA_OPERATOR_ID not set"
    echo "Please set your Hedera account ID:"
    echo "export HEDERA_OPERATOR_ID=0.0.123456789"
    exit 1
fi

if [ -z "$HEDERA_OPERATOR_KEY" ] || [ "$HEDERA_OPERATOR_KEY" = "your-private-key" ]; then
    echo "❌ Error: HEDERA_OPERATOR_KEY not set"
    echo "Please set your Hedera private key:"
    echo "export HEDERA_OPERATOR_KEY=302e020100300506032b657004220420..."
    exit 1
fi

# Set default network if not specified
if [ -z "$HEDERA_NETWORK" ]; then
    export HEDERA_NETWORK=testnet
fi

echo "📋 Configuration:"
echo "   Network: $HEDERA_NETWORK"
echo "   Operator ID: $HEDERA_OPERATOR_ID"
echo "   Contract: HederaRampHub.sol"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install npm: https://www.npmjs.com/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install @hashgraph/sdk
fi

# Create deployments directory
mkdir -p deployments

# Run the deployment script
echo "🚀 Deploying smart contract..."
node scripts/deploy-contract.js

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the Contract ID from the output above"
    echo "2. Add it to your backend .env file:"
    echo "   HEDERA_CONTRACT_ID=0.0.CONTRACT_ID"
    echo "3. Start your backend: cd backend && python app.py"
    echo "4. Test the integration: python test_hedera_integration.py"
    echo ""
    echo "🎉 Your smart contract is ready to use!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
