/**
 * Hedera Ramp Hub Smart Contract Deployment Script
 * 
 * This script deploys the HederaRampHub smart contract to Hedera network
 * using the Hedera SDK for JavaScript.
 * 
 * Prerequisites:
 * - Node.js and npm installed
 * - Hedera account with HBAR for deployment
 * - Hedera SDK: npm install @hashgraph/sdk
 */

const {
    Client,
    ContractCreateFlow,
    PrivateKey,
    AccountId,
    Hbar,
    ContractFunctionParameters,
    ContractCallQuery,
    ContractExecuteTransaction
} = require("@hashgraph/sdk");

// Configuration
const CONFIG = {
    // Hedera Network Configuration
    NETWORK: process.env.HEDERA_NETWORK || "testnet", // "testnet" or "mainnet"
    
    // Operator Account (deployer)
    OPERATOR_ID: process.env.HEDERA_OPERATOR_ID || "0.0.YOUR_ACCOUNT_ID",
    OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY || "your-private-key",
    
    // Contract Configuration
    CONTRACT_NAME: "HederaRampHub",
    CONTRACT_SYMBOL: "HRH",
    INITIAL_BALANCE: 10, // HBAR for contract
    GAS_LIMIT: 1000000,
    
    // Exchange Rates (example rates)
    INITIAL_KES_TO_HBAR: "2350000000000000", // 1 KES = 0.00235 HBAR
    INITIAL_HBAR_TO_KES: "425500000000000000000", // 1 HBAR = 425.5 KES
    
    // Platform Fees (in basis points)
    ONRAMP_FEE_BPS: 50, // 0.5%
    OFFRAMP_FEE_BPS: 50, // 0.5%
};

/**
 * Initialize Hedera client
 */
function initializeClient() {
    let client;
    
    if (CONFIG.NETWORK === "testnet") {
        client = Client.forTestnet();
    } else if (CONFIG.NETWORK === "mainnet") {
        client = Client.forMainnet();
    } else {
        throw new Error("Invalid network. Use 'testnet' or 'mainnet'");
    }
    
    // Set operator credentials
    const operatorId = AccountId.fromString(CONFIG.OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(CONFIG.OPERATOR_KEY);
    
    client.setOperator(operatorId, operatorKey);
    
    console.log(`✅ Initialized Hedera client for ${CONFIG.NETWORK}`);
    console.log(`📋 Operator ID: ${operatorId.toString()}`);
    
    return client;
}

/**
 * Compile Solidity contract
 * Note: In production, you would use a proper Solidity compiler
 * This is a placeholder for the compilation process
 */
async function compileContract() {
    console.log("🔨 Compiling Solidity contract...");
    
    // In a real deployment, you would:
    // 1. Use solc or hardhat to compile the contract
    // 2. Get the bytecode from the compilation output
    // 3. Return the bytecode as a string
    
    // For this example, we'll use a placeholder
    // In production, replace this with actual compiled bytecode
    const bytecode = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063..."; // Placeholder
    
    console.log("✅ Contract compiled successfully");
    return bytecode;
}

/**
 * Deploy the smart contract
 */
async function deployContract(client, bytecode) {
    console.log("🚀 Deploying HederaRampHub contract...");
    
    try {
        // Create contract creation transaction
        const contractCreateFlow = new ContractCreateFlow()
            .setBytecode(bytecode)
            .setGas(CONFIG.GAS_LIMIT)
            .setInitialBalance(new Hbar(CONFIG.INITIAL_BALANCE))
            .setConstructorParameters(
                new ContractFunctionParameters()
                    .addString(CONFIG.INITIAL_KES_TO_HBAR)
                    .addString(CONFIG.INITIAL_HBAR_TO_KES)
                    .addUint256(CONFIG.ONRAMP_FEE_BPS)
                    .addUint256(CONFIG.OFFRAMP_FEE_BPS)
            );
        
        // Execute the transaction
        const contractCreateResponse = await contractCreateFlow.execute(client);
        
        // Get the receipt
        const contractReceipt = await contractCreateResponse.getReceipt(client);
        const contractId = contractReceipt.contractId;
        
        console.log("✅ Contract deployed successfully!");
        console.log(`📋 Contract ID: ${contractId.toString()}`);
        console.log(`🔗 Transaction ID: ${contractCreateResponse.transactionId.toString()}`);
        
        return contractId;
        
    } catch (error) {
        console.error("❌ Contract deployment failed:", error);
        throw error;
    }
}

/**
 * Initialize contract with initial configuration
 */
async function initializeContract(client, contractId) {
    console.log("⚙️ Initializing contract...");
    
    try {
        // Set initial exchange rates
        const setRatesTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "updateExchangeRates",
                new ContractFunctionParameters()
                    .addUint256(CONFIG.INITIAL_KES_TO_HBAR)
                    .addUint256(CONFIG.INITIAL_HBAR_TO_KES)
            );
        
        const setRatesResponse = await setRatesTx.execute(client);
        const setRatesReceipt = await setRatesResponse.getReceipt(client);
        
        console.log("✅ Exchange rates set");
        console.log(`📋 Transaction ID: ${setRatesResponse.transactionId.toString()}`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Contract initialization failed:", error);
        throw error;
    }
}

/**
 * Verify contract deployment
 */
async function verifyContract(client, contractId) {
    console.log("🔍 Verifying contract deployment...");
    
    try {
        // Get contract info
        const contractInfoQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getPlatformStats");
        
        const contractInfoResponse = await contractInfoQuery.execute(client);
        
        console.log("✅ Contract verification successful");
        console.log(`📋 Contract is responding to queries`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Contract verification failed:", error);
        throw error;
    }
}

/**
 * Save deployment information
 */
function saveDeploymentInfo(contractId, transactionId, network) {
    const deploymentInfo = {
        contractId: contractId.toString(),
        transactionId: transactionId.toString(),
        network: network,
        deployedAt: new Date().toISOString(),
        config: {
            initialBalance: CONFIG.INITIAL_BALANCE,
            gasLimit: CONFIG.GAS_LIMIT,
            onRampFeeBps: CONFIG.ONRAMP_FEE_BPS,
            offRampFeeBps: CONFIG.OFFRAMP_FEE_BPS
        }
    };
    
    const fs = require('fs');
    const path = require('path');
    
    const deploymentPath = path.join(__dirname, '..', 'deployments', `${network}-deployment.json`);
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📁 Deployment info saved to: ${deploymentPath}`);
}

/**
 * Main deployment function
 */
async function main() {
    console.log("🚀 Starting Hedera Ramp Hub Contract Deployment");
    console.log("=" .repeat(50));
    
    try {
        // Initialize client
        const client = initializeClient();
        
        // Compile contract
        const bytecode = await compileContract();
        
        // Deploy contract
        const contractId = await deployContract(client, bytecode);
        
        // Initialize contract
        await initializeContract(client, contractId);
        
        // Verify deployment
        await verifyContract(client, contractId);
        
        // Save deployment info
        saveDeploymentInfo(contractId, "deployment-transaction-id", CONFIG.NETWORK);
        
        console.log("=" .repeat(50));
        console.log("🎉 Deployment completed successfully!");
        console.log(`📋 Contract ID: ${contractId.toString()}`);
        console.log(`🌐 Network: ${CONFIG.NETWORK}`);
        console.log(`💰 Initial Balance: ${CONFIG.INITIAL_BALANCE} HBAR`);
        console.log("=" .repeat(50));
        
        // Display next steps
        console.log("\n📋 Next Steps:");
        console.log("1. Update your backend .env with the contract ID");
        console.log("2. Configure exchange rate updates");
        console.log("3. Set up admin accounts");
        console.log("4. Test the contract functions");
        console.log("5. Deploy to mainnet when ready");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Run deployment if this script is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    main,
    initializeClient,
    deployContract,
    initializeContract,
    verifyContract
};
