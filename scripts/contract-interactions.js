/**
 * Hedera Ramp Hub Smart Contract Interaction Scripts
 * 
 * This script provides functions to interact with the deployed HederaRampHub contract
 * including user registration, KYC verification, transaction management, etc.
 */

const {
    Client,
    ContractCallQuery,
    ContractExecuteTransaction,
    PrivateKey,
    AccountId,
    Hbar,
    ContractFunctionParameters
} = require("@hashgraph/sdk");

// Configuration
const CONFIG = {
    NETWORK: process.env.HEDERA_NETWORK || "testnet",
    OPERATOR_ID: process.env.HEDERA_OPERATOR_ID || "0.0.YOUR_ACCOUNT_ID",
    OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY || "your-private-key",
    CONTRACT_ID: process.env.HEDERA_CONTRACT_ID || "0.0.CONTRACT_ID",
    GAS_LIMIT: 1000000
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
    
    const operatorId = AccountId.fromString(CONFIG.OPERATOR_ID);
    const operatorKey = PrivateKey.fromString(CONFIG.OPERATOR_KEY);
    
    client.setOperator(operatorId, operatorKey);
    
    return client;
}

/**
 * User Management Functions
 */

/**
 * Register a new user
 * @param {string} phoneNumber User's phone number
 * @param {string} countryCode User's country code
 */
async function registerUser(phoneNumber, countryCode) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "registerUser",
                new ContractFunctionParameters()
                    .addString(phoneNumber)
                    .addString(countryCode)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ User registered successfully");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ User registration failed:", error);
        throw error;
    }
}

/**
 * Verify user KYC
 * @param {string} userAddress User's wallet address
 */
async function verifyUserKyc(userAddress) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "verifyKyc",
                new ContractFunctionParameters()
                    .addAddress(userAddress)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ KYC verification completed");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ KYC verification failed:", error);
        throw error;
    }
}

/**
 * Get user information
 * @param {string} userAddress User's wallet address
 */
async function getUserInfo(userAddress) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "getUserInfo",
                new ContractFunctionParameters()
                    .addAddress(userAddress)
            );
        
        const response = await query.execute(client);
        
        console.log("✅ User info retrieved");
        console.log("📋 User Info:", response);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to get user info:", error);
        throw error;
    }
}

/**
 * Transaction Management Functions
 */

/**
 * Initiate on-ramp transaction
 * @param {string} fiatAmount Amount in KES (in wei)
 * @param {string} phoneNumber User's phone number
 */
async function initiateOnRamp(fiatAmount, phoneNumber) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "initiateOnRamp",
                new ContractFunctionParameters()
                    .addUint256(fiatAmount)
                    .addString(phoneNumber)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ On-ramp transaction initiated");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ On-ramp initiation failed:", error);
        throw error;
    }
}

/**
 * Initiate off-ramp transaction
 * @param {string} hbarAmount Amount in HBAR (in tinybars)
 * @param {string} phoneNumber User's phone number
 */
async function initiateOffRamp(hbarAmount, phoneNumber) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "initiateOffRamp",
                new ContractFunctionParameters()
                    .addUint256(hbarAmount)
                    .addString(phoneNumber)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ Off-ramp transaction initiated");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Off-ramp initiation failed:", error);
        throw error;
    }
}

/**
 * Update transaction status
 * @param {string} transactionId Transaction ID
 * @param {string} newStatus New status (0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED, 4=CANCELLED)
 * @param {string} intersendTransactionId Intersend transaction ID
 * @param {string} notes Additional notes
 */
async function updateTransactionStatus(transactionId, newStatus, intersendTransactionId, notes) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "updateTransactionStatus",
                new ContractFunctionParameters()
                    .addUint256(transactionId)
                    .addUint8(newStatus)
                    .addString(intersendTransactionId)
                    .addString(notes)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ Transaction status updated");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Status update failed:", error);
        throw error;
    }
}

/**
 * Get transaction information
 * @param {string} transactionId Transaction ID
 */
async function getTransactionInfo(transactionId) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "getTransactionInfo",
                new ContractFunctionParameters()
                    .addUint256(transactionId)
            );
        
        const response = await query.execute(client);
        
        console.log("✅ Transaction info retrieved");
        console.log("📋 Transaction Info:", response);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to get transaction info:", error);
        throw error;
    }
}

/**
 * Exchange Rate Management Functions
 */

/**
 * Update exchange rates
 * @param {string} kesToHbar Rate: 1 KES = X HBAR (in wei)
 * @param {string} hbarToKes Rate: 1 HBAR = X KES (in wei)
 */
async function updateExchangeRates(kesToHbar, hbarToKes) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "updateExchangeRates",
                new ContractFunctionParameters()
                    .addUint256(kesToHbar)
                    .addUint256(hbarToKes)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ Exchange rates updated");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Exchange rate update failed:", error);
        throw error;
    }
}

/**
 * Get current exchange rates
 */
async function getExchangeRates() {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction("getExchangeRates");
        
        const response = await query.execute(client);
        
        console.log("✅ Exchange rates retrieved");
        console.log("📋 Exchange Rates:", response);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to get exchange rates:", error);
        throw error;
    }
}

/**
 * Calculate HBAR amount for given KES amount
 * @param {string} kesAmount Amount in KES (in wei)
 */
async function calculateHbarAmount(kesAmount) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "calculateHbarAmount",
                new ContractFunctionParameters()
                    .addUint256(kesAmount)
            );
        
        const response = await query.execute(client);
        
        console.log("✅ HBAR amount calculated");
        console.log(`📋 HBAR Amount: ${response}`);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to calculate HBAR amount:", error);
        throw error;
    }
}

/**
 * Calculate KES amount for given HBAR amount
 * @param {string} hbarAmount Amount in HBAR (in tinybars)
 */
async function calculateKesAmount(hbarAmount) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "calculateKesAmount",
                new ContractFunctionParameters()
                    .addUint256(hbarAmount)
            );
        
        const response = await query.execute(client);
        
        console.log("✅ KES amount calculated");
        console.log(`📋 KES Amount: ${response}`);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to calculate KES amount:", error);
        throw error;
    }
}

/**
 * Platform Statistics Functions
 */

/**
 * Get platform statistics
 */
async function getPlatformStats() {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction("getPlatformStats");
        
        const response = await query.execute(client);
        
        console.log("✅ Platform stats retrieved");
        console.log("📋 Platform Stats:", response);
        
        return response;
        
    } catch (error) {
        console.error("❌ Failed to get platform stats:", error);
        throw error;
    }
}

/**
 * Admin Functions
 */

/**
 * Add admin
 * @param {string} adminAddress Admin address
 */
async function addAdmin(adminAddress) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "addAdmin",
                new ContractFunctionParameters()
                    .addAddress(adminAddress)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ Admin added successfully");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Failed to add admin:", error);
        throw error;
    }
}

/**
 * Add KYC verifier
 * @param {string} verifierAddress Verifier address
 */
async function addKycVerifier(verifierAddress) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "addKycVerifier",
                new ContractFunctionParameters()
                    .addAddress(verifierAddress)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ KYC verifier added successfully");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Failed to add KYC verifier:", error);
        throw error;
    }
}

/**
 * Update platform fees
 * @param {string} onRampFeeBps On-ramp fee in basis points
 * @param {string} offRampFeeBps Off-ramp fee in basis points
 */
async function updateFees(onRampFeeBps, offRampFeeBps) {
    const client = initializeClient();
    const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
    
    try {
        const tx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(CONFIG.GAS_LIMIT)
            .setFunction(
                "updateFees",
                new ContractFunctionParameters()
                    .addUint256(onRampFeeBps)
                    .addUint256(offRampFeeBps)
            );
        
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log("✅ Platform fees updated");
        console.log(`📋 Transaction ID: ${response.transactionId.toString()}`);
        
        return receipt;
        
    } catch (error) {
        console.error("❌ Failed to update fees:", error);
        throw error;
    }
}

// Export functions for use in other scripts
module.exports = {
    // User Management
    registerUser,
    verifyUserKyc,
    getUserInfo,
    
    // Transaction Management
    initiateOnRamp,
    initiateOffRamp,
    updateTransactionStatus,
    getTransactionInfo,
    
    // Exchange Rate Management
    updateExchangeRates,
    getExchangeRates,
    calculateHbarAmount,
    calculateKesAmount,
    
    // Platform Statistics
    getPlatformStats,
    
    // Admin Functions
    addAdmin,
    addKycVerifier,
    updateFees
};
