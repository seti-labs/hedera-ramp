// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title RampHub
 * @dev Simple smart contract for Hedera Ramp Hub
 */

contract RampHub {
    
    // ============ STRUCTS ============
    
    struct User {
        bool isRegistered;
        bool isKycVerified;
        string phoneNumber;
    }
    
    struct Transaction {
        uint256 id;
        address user;
        bool isOnRamp;
        uint256 amount;
        string currency;
        bool isCompleted;
        uint256 createdAt;
    }
    
    // ============ STATE VARIABLES ============
    
    address public owner;
    uint256 public transactionCounter;
    
    mapping(address => User) public users;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    
    uint256 public kesToHbarRate;
    uint256 public hbarToKesRate;
    
    mapping(address => bool) public admins;
    
    // ============ EVENTS ============
    
    event UserRegistered(address indexed user, string phoneNumber);
    event UserKycVerified(address indexed user);
    event TransactionCreated(uint256 indexed id, address indexed user, bool isOnRamp, uint256 amount);
    event TransactionCompleted(uint256 indexed id);
    event ExchangeRateUpdated(uint256 kesToHbar, uint256 hbarToKes);
    
    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Not an admin");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier onlyKycVerified() {
        require(users[msg.sender].isKycVerified, "KYC not verified");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        
        kesToHbarRate = 2350000000000000; // 1 KES = 0.00235 HBAR
        hbarToKesRate = 425500000000000000000; // 1 HBAR = 425.5 KES
    }
    
    // ============ USER FUNCTIONS ============
    
    function registerUser(string memory phoneNumber) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = User({
            isRegistered: true,
            isKycVerified: false,
            phoneNumber: phoneNumber
        });
        
        emit UserRegistered(msg.sender, phoneNumber);
    }
    
    function verifyKyc(address userAddress) external onlyAdmin {
        require(users[userAddress].isRegistered, "User not registered");
        require(!users[userAddress].isKycVerified, "Already KYC verified");
        
        users[userAddress].isKycVerified = true;
        emit UserKycVerified(userAddress);
    }
    
    // ============ TRANSACTION FUNCTIONS ============
    
    function createTransaction(
        bool isOnRamp,
        uint256 amount,
        string memory currency
    ) external onlyRegisteredUser onlyKycVerified {
        transactionCounter++;
        
        transactions[transactionCounter] = Transaction({
            id: transactionCounter,
            user: msg.sender,
            isOnRamp: isOnRamp,
            amount: amount,
            currency: currency,
            isCompleted: false,
            createdAt: block.timestamp
        });
        
        userTransactions[msg.sender].push(transactionCounter);
        
        emit TransactionCreated(transactionCounter, msg.sender, isOnRamp, amount);
    }
    
    function completeTransaction(uint256 transactionId) external onlyAdmin {
        require(transactionId > 0 && transactionId <= transactionCounter, "Invalid transaction ID");
        require(!transactions[transactionId].isCompleted, "Transaction already completed");
        
        transactions[transactionId].isCompleted = true;
        emit TransactionCompleted(transactionId);
    }
    
    // ============ EXCHANGE RATE FUNCTIONS ============
    
    function updateExchangeRates(uint256 kesToHbar, uint256 hbarToKes) external onlyAdmin {
        require(kesToHbar > 0 && hbarToKes > 0, "Invalid rates");
        
        kesToHbarRate = kesToHbar;
        hbarToKesRate = hbarToKes;
        
        emit ExchangeRateUpdated(kesToHbar, hbarToKes);
    }
    
    function calculateHbarAmount(uint256 kesAmount) external view returns (uint256) {
        return (kesAmount * kesToHbarRate) / 10**18;
    }
    
    function calculateKesAmount(uint256 hbarAmount) external view returns (uint256) {
        return (hbarAmount * hbarToKesRate) / 10**8;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function addAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != address(0), "Invalid address");
        admins[adminAddress] = true;
    }
    
    function removeAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != owner, "Cannot remove owner");
        admins[adminAddress] = false;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getUserInfo(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }
    
    function getTransactionInfo(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
    
    function getUserTransactions(address userAddress) external view returns (uint256[] memory) {
        return userTransactions[userAddress];
    }
    
    function getExchangeRates() external view returns (uint256, uint256) {
        return (kesToHbarRate, hbarToKesRate);
    }
    
    function getPlatformStats() external view returns (
        uint256 totalTransactions,
        uint256 completedTransactions
    ) {
        uint256 completed = 0;
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (transactions[i].isCompleted) {
                completed++;
            }
        }
        
        return (transactionCounter, completed);
    }
}
