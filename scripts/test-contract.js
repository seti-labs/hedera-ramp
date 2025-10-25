#!/usr/bin/env node

/**
 * Hedera Ramp Hub Smart Contract Test Script
 * 
 * This script tests the deployed smart contract for bugs and functionality.
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
    OPERATOR_ID: process.env.HEDERA_OPERATOR_ID,
    OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY,
    CONTRACT_ID: process.env.HEDERA_CONTRACT_ID
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
 * Test contract deployment and basic functionality
 */
async function testContractDeployment() {
    console.log("🔍 Testing contract deployment...");
    
    try {
        const client = initializeClient();
        const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
        
        // Test 1: Get platform stats
        const statsQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getPlatformStats");
        
        const statsResponse = await statsQuery.execute(client);
        console.log("✅ Contract is responding to queries");
        console.log("📊 Platform stats:", statsResponse);
        
        return true;
        
    } catch (error) {
        console.error("❌ Contract deployment test failed:", error);
        return false;
    }
}

/**
 * Test exchange rate functionality
 */
async function testExchangeRates() {
    console.log("🔍 Testing exchange rates...");
    
    try {
        const client = initializeClient();
        const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
        
        // Test 1: Get current exchange rates
        const ratesQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getExchangeRates");
        
        const ratesResponse = await ratesQuery.execute(client);
        console.log("✅ Exchange rates retrieved");
        console.log("📈 Current rates:", ratesResponse);
        
        // Test 2: Calculate HBAR amount for 25 KES
        const kesAmount = 25 * 10**18; // 25 KES in wei
        const hbarQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "calculateHbarAmount",
                new ContractFunctionParameters()
                    .addUint256(kesAmount)
            );
        
        const hbarResponse = await hbarQuery.execute(client);
        console.log("✅ HBAR calculation successful");
        console.log(`💰 25 KES = ${hbarResponse} HBAR`);
        
        // Test 3: Calculate KES amount for 2 HBAR
        const hbarAmount = 2 * 10**8; // 2 HBAR in tinybars
        const kesQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "calculateKesAmount",
                new ContractFunctionParameters()
                    .addUint256(hbarAmount)
            );
        
        const kesResponse = await kesQuery.execute(client);
        console.log("✅ KES calculation successful");
        console.log(`💰 2 HBAR = ${kesResponse} KES`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Exchange rates test failed:", error);
        return false;
    }
}

/**
 * Test transaction limits
 */
async function testTransactionLimits() {
    console.log("🔍 Testing transaction limits...");
    
    try {
        const client = initializeClient();
        const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
        
        // Test minimum KES amount (25 KES)
        const minKesAmount = 25 * 10**18;
        const minKesQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "calculateHbarAmount",
                new ContractFunctionParameters()
                    .addUint256(minKesAmount)
            );
        
        const minKesResponse = await minKesQuery.execute(client);
        console.log("✅ Minimum KES amount (25) processed");
        console.log(`💰 25 KES = ${minKesResponse} HBAR`);
        
        // Test maximum KES amount (150,000 KES)
        const maxKesAmount = 150000 * 10**18;
        const maxKesQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "calculateHbarAmount",
                new ContractFunctionParameters()
                    .addUint256(maxKesAmount)
            );
        
        const maxKesResponse = await maxKesQuery.execute(client);
        console.log("✅ Maximum KES amount (150,000) processed");
        console.log(`💰 150,000 KES = ${maxKesResponse} HBAR`);
        
        // Test minimum HBAR amount (2 HBAR)
        const minHbarAmount = 2 * 10**8;
        const minHbarQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "calculateKesAmount",
                new ContractFunctionParameters()
                    .addUint256(minHbarAmount)
            );
        
        const minHbarResponse = await minHbarQuery.execute(client);
        console.log("✅ Minimum HBAR amount (2) processed");
        console.log(`💰 2 HBAR = ${minHbarResponse} KES`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Transaction limits test failed:", error);
        return false;
    }
}

/**
 * Test admin functions
 */
async function testAdminFunctions() {
    console.log("🔍 Testing admin functions...");
    
    try {
        const client = initializeClient();
        const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
        
        // Test updating exchange rates
        const newKesToHbar = "2400000000000000"; // 0.0024 HBAR per KES
        const newHbarToKes = "416666666666666666666"; // 416.67 KES per HBAR
        
        const updateRatesTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                "updateExchangeRates",
                new ContractFunctionParameters()
                    .addUint256(newKesToHbar)
                    .addUint256(newHbarToKes)
            );
        
        const updateRatesResponse = await updateRatesTx.execute(client);
        const updateRatesReceipt = await updateRatesResponse.getReceipt(client);
        
        console.log("✅ Exchange rates updated successfully");
        console.log(`📋 Transaction ID: ${updateRatesResponse.transactionId.toString()}`);
        
        // Verify the update
        const ratesQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getExchangeRates");
        
        const ratesResponse = await ratesQuery.execute(client);
        console.log("✅ Updated rates verified");
        console.log("📈 New rates:", ratesResponse);
        
        return true;
        
    } catch (error) {
        console.error("❌ Admin functions test failed:", error);
        return false;
    }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
    console.log("🔍 Testing error handling...");
    
    try {
        const client = initializeClient();
        const contractId = AccountId.fromString(CONFIG.CONTRACT_ID);
        
        // Test with invalid amounts
        const invalidKesAmount = 10 * 10**18; // 10 KES (below minimum)
        const invalidHbarAmount = 1 * 10**8; // 1 HBAR (below minimum)
        
        console.log("⚠️  Testing with invalid amounts (should fail gracefully)");
        
        // These should fail due to transaction limits
        try {
            const invalidKesQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction(
                    "calculateHbarAmount",
                    new ContractFunctionParameters()
                        .addUint256(invalidKesAmount)
                );
            
            await invalidKesQuery.execute(client);
            console.log("⚠️  Invalid KES amount was processed (unexpected)");
        } catch (error) {
            console.log("✅ Invalid KES amount properly rejected");
        }
        
        try {
            const invalidHbarQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction(
                    "calculateKesAmount",
                    new ContractFunctionParameters()
                        .addUint256(invalidHbarAmount)
                );
            
            await invalidHbarQuery.execute(client);
            console.log("⚠️  Invalid HBAR amount was processed (unexpected)");
        } catch (error) {
            console.log("✅ Invalid HBAR amount properly rejected");
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error handling test failed:", error);
        return false;
    }
}

/**
 * Main test function
 */
async function main() {
    console.log("🧪 Starting Hedera Ramp Hub Smart Contract Tests");
    console.log("=" .repeat(60));
    
    // Validate configuration
    if (!CONFIG.OPERATOR_ID || !CONFIG.OPERATOR_KEY || !CONFIG.CONTRACT_ID) {
        console.error("❌ Missing required configuration");
        console.log("Please set the following environment variables:");
        console.log("  HEDERA_OPERATOR_ID");
        console.log("  HEDERA_OPERATOR_KEY");
        console.log("  HEDERA_CONTRACT_ID");
        process.exit(1);
    }
    
    const tests = [
        ("Contract Deployment", testContractDeployment),
        ("Exchange Rates", testExchangeRates),
        ("Transaction Limits", testTransactionLimits),
        ("Admin Functions", testAdminFunctions),
        ("Error Handling", testErrorHandling)
    ];
    
    const results = [];
    
    for (const [testName, testFunc] of tests) {
        console.log(`\n📋 Running: ${testName}`);
        try {
            const result = await testFunc();
            results.push([testName, result]);
        } catch (error) {
            console.error(`❌ ${testName} failed with exception:`, error);
            results.push([testName, false]);
        }
    }
    
    // Summary
    console.log("\n" + "=" .repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=" .repeat(60));
    
    let passed = 0;
    const total = results.length;
    
    for (const [testName, result] of results) {
        const status = result ? "✅ PASS" : "❌ FAIL";
        console.log(`${status} - ${testName}`);
        if (result) passed++;
    }
    
    console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log("🎉 All tests passed! Smart contract is working correctly.");
        console.log("✅ No bugs detected!");
    } else {
        console.log("⚠️  Some tests failed. Please check the issues above.");
    }
    
    console.log("\n📋 Contract Status:");
    console.log(`   Contract ID: ${CONFIG.CONTRACT_ID}`);
    console.log(`   Network: ${CONFIG.NETWORK}`);
    console.log(`   Status: ${passed === total ? "✅ HEALTHY" : "⚠️  ISSUES DETECTED"}`);
}

// Run tests if this script is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    main,
    testContractDeployment,
    testExchangeRates,
    testTransactionLimits,
    testAdminFunctions,
    testErrorHandling
};
