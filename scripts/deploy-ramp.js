#!/usr/bin/env node

/**
 * Simple RampHub Contract Deployment
 */

const {
    Client,
    ContractCreateFlow,
    PrivateKey,
    AccountId,
    Hbar
} = require("@hashgraph/sdk");

const CONFIG = {
    NETWORK: process.env.HEDERA_NETWORK || "testnet",
    OPERATOR_ID: process.env.HEDERA_OPERATOR_ID,
    OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY,
    INITIAL_BALANCE: 5,
    GAS_LIMIT: 500000
};

function initializeClient() {
    let client;
    
    if (CONFIG.NETWORK === "testnet") {
        client = Client.forTestnet();
    } else if (CONFIG.NETWORK === "mainnet") {
        client = Client.forMainnet();
    } else {
        throw new Error("Invalid network");
    }
    
    const operatorId = AccountId.fromString(CONFIG.OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(CONFIG.OPERATOR_KEY);
    
    client.setOperator(operatorId, operatorKey);
    
    console.log(`✅ Client initialized for ${CONFIG.NETWORK}`);
    return client;
}

async function deployContract(client) {
    console.log("🚀 Deploying RampHub contract...");
    
    try {
        // Placeholder bytecode - in production, compile the contract first
        const bytecode = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063...";
        
        const contractCreateFlow = new ContractCreateFlow()
            .setBytecode(bytecode)
            .setGas(CONFIG.GAS_LIMIT)
            .setInitialBalance(new Hbar(CONFIG.INITIAL_BALANCE));
        
        const contractCreateResponse = await contractCreateFlow.execute(client);
        const contractReceipt = await contractCreateResponse.getReceipt(client);
        const contractId = contractReceipt.contractId;
        
        console.log("✅ Contract deployed successfully!");
        console.log(`📋 Contract ID: ${contractId.toString()}`);
        console.log(`🔗 Transaction ID: ${contractCreateResponse.transactionId.toString()}`);
        
        return contractId;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

async function main() {
    console.log("🚀 Starting RampHub Contract Deployment");
    console.log("=" .repeat(40));
    
    try {
        if (!CONFIG.OPERATOR_ID || !CONFIG.OPERATOR_KEY) {
            console.error("❌ Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY");
            process.exit(1);
        }
        
        const client = initializeClient();
        const contractId = await deployContract(client);
        
        console.log("=" .repeat(40));
        console.log("🎉 Contract deployed successfully!");
        console.log(`📋 Contract ID: ${contractId.toString()}`);
        console.log("=" .repeat(40));
        
        console.log("\n📋 Next Steps:");
        console.log("1. Copy the Contract ID above");
        console.log("2. Add to backend .env:");
        console.log(`   HEDERA_CONTRACT_ID=${contractId.toString()}`);
        console.log("3. Test the contract functions");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, deployContract };
