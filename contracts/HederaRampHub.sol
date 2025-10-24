// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title HederaRampHub
 * @dev Smart contract for Hedera Ramp Hub - Mobile Money to HBAR On/Off-Ramp Platform
 * @author SetLabs
 * 
 * Features:
 * - On-ramp: KES (mobile money) → HBAR
 * - Off-ramp: HBAR → KES (mobile money)
 * - KYC verification system
 * - Transaction limits and validation
 * - Escrow system for secure transactions
 * - Admin management functions
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract HederaRampHub is ReentrancyGuard, Ownable, Pausable {
    
    // ============ STRUCTS ============
    
    struct User {
        address walletAddress;
        bool isKycVerified;
        bool isActive;
        uint256 totalOnRampVolume;
        uint256 totalOffRampVolume;
        uint256 lastTransactionTime;
        string phoneNumber;
        string countryCode;
        uint256 createdAt;
    }
    
    struct Transaction {
        uint256 id;
        address user;
        TransactionType txType;
        uint256 hbarAmount;
        uint256 fiatAmount;
        string currency;
        TransactionStatus status;
        string phoneNumber;
        string intersendTransactionId;
        uint256 createdAt;
        uint256 completedAt;
        string notes;
    }
    
    struct ExchangeRate {
        uint256 kesToHbar; // Rate: 1 KES = X HBAR (in wei)
        uint256 hbarToKes; // Rate: 1 HBAR = X KES (in wei)
        uint256 lastUpdated;
        bool isActive;
    }
    
    // ============ ENUMS ============
    
    enum TransactionType {
        ONRAMP,    // KES → HBAR
        OFFRAMP    // HBAR → KES
    }
    
    enum TransactionStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    // ============ STATE VARIABLES ============
    
    // Transaction limits
    uint256 public constant MIN_AMOUNT_KES = 25 * 10**18; // 25 KES (in wei)
    uint256 public constant MAX_AMOUNT_KES = 150000 * 10**18; // 150,000 KES (in wei)
    uint256 public constant MIN_AMOUNT_HBAR = 2 * 10**8; // 2 HBAR (in tinybars)
    
    // Platform fees (in basis points, 100 = 1%)
    uint256 public onRampFeeBps = 50; // 0.5%
    uint256 public offRampFeeBps = 50; // 0.5%
    
    // Exchange rates
    ExchangeRate public currentRate;
    
    // Mappings
    mapping(address => User) public users;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    mapping(string => bool) public usedPhoneNumbers;
    mapping(string => bool) public usedIntersendIds;
    
    // Counters
    uint256 public transactionCounter;
    uint256 public totalOnRampVolume;
    uint256 public totalOffRampVolume;
    uint256 public totalFeesCollected;
    
    // Admin addresses
    mapping(address => bool) public admins;
    mapping(address => bool) public kycVerifiers;
    
    // Escrow
    uint256 public escrowBalance;
    
    // Events
    event UserRegistered(address indexed user, string phoneNumber, string countryCode);
    event UserKycVerified(address indexed user, address indexed verifier);
    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed user,
        TransactionType txType,
        uint256 hbarAmount,
        uint256 fiatAmount,
        string currency
    );
    event TransactionStatusUpdated(
        uint256 indexed transactionId,
        TransactionStatus oldStatus,
        TransactionStatus newStatus
    );
    event ExchangeRateUpdated(uint256 kesToHbar, uint256 hbarToKes, uint256 timestamp);
    event FeesCollected(uint256 amount, string reason);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event KycVerifierAdded(address indexed verifier);
    event KycVerifierRemoved(address indexed verifier);
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }
    
    modifier onlyKycVerifier() {
        require(kycVerifiers[msg.sender] || admins[msg.sender] || msg.sender == owner(), "Not a KYC verifier");
        _;
    }
    
    modifier onlyKycVerified() {
        require(users[msg.sender].isKycVerified, "KYC verification required");
        _;
    }
    
    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "User account is not active");
        _;
    }
    
    modifier validAmount(uint256 amount, TransactionType txType) {
        if (txType == TransactionType.ONRAMP) {
            require(amount >= MIN_AMOUNT_KES && amount <= MAX_AMOUNT_KES, "Invalid KES amount");
        } else {
            require(amount >= MIN_AMOUNT_HBAR, "Invalid HBAR amount");
        }
        _;
    }
    
    modifier validPhoneNumber(string memory phoneNumber) {
        require(bytes(phoneNumber).length > 0, "Phone number required");
        require(!usedPhoneNumbers[phoneNumber], "Phone number already used");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        // Initialize with default exchange rates
        currentRate = ExchangeRate({
            kesToHbar: 2350000000000000, // 1 KES = 0.00235 HBAR (example rate)
            hbarToKes: 425500000000000000000, // 1 HBAR = 425.5 KES (example rate)
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Set owner as admin
        admins[msg.sender] = true;
        kycVerifiers[msg.sender] = true;
    }
    
    // ============ USER MANAGEMENT ============
    
    /**
     * @dev Register a new user
     * @param phoneNumber User's phone number
     * @param countryCode User's country code
     */
    function registerUser(
        string memory phoneNumber,
        string memory countryCode
    ) external validPhoneNumber(phoneNumber) {
        require(!users[msg.sender].isActive, "User already registered");
        
        users[msg.sender] = User({
            walletAddress: msg.sender,
            isKycVerified: false,
            isActive: true,
            totalOnRampVolume: 0,
            totalOffRampVolume: 0,
            lastTransactionTime: 0,
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            createdAt: block.timestamp
        });
        
        usedPhoneNumbers[phoneNumber] = true;
        
        emit UserRegistered(msg.sender, phoneNumber, countryCode);
    }
    
    /**
     * @dev Verify user KYC
     * @param userAddress User's wallet address
     */
    function verifyKyc(address userAddress) external onlyKycVerifier {
        require(users[userAddress].isActive, "User not found");
        require(!users[userAddress].isKycVerified, "User already KYC verified");
        
        users[userAddress].isKycVerified = true;
        
        emit UserKycVerified(userAddress, msg.sender);
    }
    
    /**
     * @dev Deactivate user account
     * @param userAddress User's wallet address
     */
    function deactivateUser(address userAddress) external onlyAdmin {
        require(users[userAddress].isActive, "User not found");
        
        users[userAddress].isActive = false;
    }
    
    // ============ TRANSACTION MANAGEMENT ============
    
    /**
     * @dev Initiate on-ramp transaction (KES → HBAR)
     * @param fiatAmount Amount in KES (in wei)
     * @param phoneNumber User's phone number
     */
    function initiateOnRamp(
        uint256 fiatAmount,
        string memory phoneNumber
    ) external 
        onlyKycVerified 
        onlyActiveUser 
        validAmount(fiatAmount, TransactionType.ONRAMP)
        whenNotPaused
        nonReentrant
    {
        require(currentRate.isActive, "Exchange rates not available");
        
        // Calculate HBAR amount based on current rate
        uint256 hbarAmount = (fiatAmount * currentRate.kesToHbar) / 10**18;
        require(hbarAmount > 0, "Invalid HBAR amount");
        
        // Check if user has sufficient balance for fees
        uint256 feeAmount = (fiatAmount * onRampFeeBps) / 10000;
        require(msg.value >= feeAmount, "Insufficient fee payment");
        
        // Create transaction
        transactionCounter++;
        Transaction memory newTx = Transaction({
            id: transactionCounter,
            user: msg.sender,
            txType: TransactionType.ONRAMP,
            hbarAmount: hbarAmount,
            fiatAmount: fiatAmount,
            currency: "KES",
            status: TransactionStatus.PENDING,
            phoneNumber: phoneNumber,
            intersendTransactionId: "",
            createdAt: block.timestamp,
            completedAt: 0,
            notes: ""
        });
        
        transactions[transactionCounter] = newTx;
        userTransactions[msg.sender].push(transactionCounter);
        
        // Update user stats
        users[msg.sender].totalOnRampVolume += fiatAmount;
        users[msg.sender].lastTransactionTime = block.timestamp;
        
        // Update platform stats
        totalOnRampVolume += fiatAmount;
        totalFeesCollected += feeAmount;
        
        emit TransactionCreated(
            transactionCounter,
            msg.sender,
            TransactionType.ONRAMP,
            hbarAmount,
            fiatAmount,
            "KES"
        );
    }
    
    /**
     * @dev Initiate off-ramp transaction (HBAR → KES)
     * @param hbarAmount Amount in HBAR (in tinybars)
     * @param phoneNumber User's phone number
     */
    function initiateOffRamp(
        uint256 hbarAmount,
        string memory phoneNumber
    ) external 
        onlyKycVerified 
        onlyActiveUser 
        validAmount(hbarAmount, TransactionType.OFFRAMP)
        whenNotPaused
        nonReentrant
    {
        require(currentRate.isActive, "Exchange rates not available");
        
        // Calculate KES amount based on current rate
        uint256 fiatAmount = (hbarAmount * currentRate.hbarToKes) / 10**8;
        require(fiatAmount >= MIN_AMOUNT_KES && fiatAmount <= MAX_AMOUNT_KES, "Invalid KES amount");
        
        // Calculate fees
        uint256 feeAmount = (hbarAmount * offRampFeeBps) / 10000;
        uint256 netHbarAmount = hbarAmount - feeAmount;
        
        // Create transaction
        transactionCounter++;
        Transaction memory newTx = Transaction({
            id: transactionCounter,
            user: msg.sender,
            txType: TransactionType.OFFRAMP,
            hbarAmount: hbarAmount,
            fiatAmount: fiatAmount,
            currency: "KES",
            status: TransactionStatus.PENDING,
            phoneNumber: phoneNumber,
            intersendTransactionId: "",
            createdAt: block.timestamp,
            completedAt: 0,
            notes: ""
        });
        
        transactions[transactionCounter] = newTx;
        userTransactions[msg.sender].push(transactionCounter);
        
        // Update user stats
        users[msg.sender].totalOffRampVolume += fiatAmount;
        users[msg.sender].lastTransactionTime = block.timestamp;
        
        // Update platform stats
        totalOffRampVolume += fiatAmount;
        totalFeesCollected += feeAmount;
        
        // Transfer HBAR to escrow
        escrowBalance += hbarAmount;
        
        emit TransactionCreated(
            transactionCounter,
            msg.sender,
            TransactionType.OFFRAMP,
            hbarAmount,
            fiatAmount,
            "KES"
        );
    }
    
    /**
     * @dev Update transaction status (called by admin/backend)
     * @param transactionId Transaction ID
     * @param newStatus New transaction status
     * @param intersendTransactionId Intersend transaction ID
     * @param notes Additional notes
     */
    function updateTransactionStatus(
        uint256 transactionId,
        TransactionStatus newStatus,
        string memory intersendTransactionId,
        string memory notes
    ) external onlyAdmin {
        require(transactionId > 0 && transactionId <= transactionCounter, "Invalid transaction ID");
        
        Transaction storage transaction = transactions[transactionId];
        require(transaction.id > 0, "Transaction not found");
        
        TransactionStatus oldStatus = transaction.status;
        transaction.status = newStatus;
        transaction.intersendTransactionId = intersendTransactionId;
        transaction.notes = notes;
        
        if (newStatus == TransactionStatus.COMPLETED) {
            transaction.completedAt = block.timestamp;
            
            // For on-ramp: transfer HBAR to user
            if (transaction.txType == TransactionType.ONRAMP) {
                // This would typically be handled by the backend after Intersend payment confirmation
                // The actual HBAR transfer would happen here
            }
            
            // For off-ramp: release HBAR from escrow
            if (transaction.txType == TransactionType.OFFRAMP) {
                escrowBalance -= transaction.hbarAmount;
                // Transfer HBAR to platform wallet
            }
        }
        
        emit TransactionStatusUpdated(transactionId, oldStatus, newStatus);
    }
    
    // ============ EXCHANGE RATE MANAGEMENT ============
    
    /**
     * @dev Update exchange rates
     * @param kesToHbar Rate: 1 KES = X HBAR (in wei)
     * @param hbarToKes Rate: 1 HBAR = X KES (in wei)
     */
    function updateExchangeRates(
        uint256 kesToHbar,
        uint256 hbarToKes
    ) external onlyAdmin {
        require(kesToHbar > 0 && hbarToKes > 0, "Invalid rates");
        
        currentRate.kesToHbar = kesToHbar;
        currentRate.hbarToKes = hbarToKes;
        currentRate.lastUpdated = block.timestamp;
        currentRate.isActive = true;
        
        emit ExchangeRateUpdated(kesToHbar, hbarToKes, block.timestamp);
    }
    
    /**
     * @dev Pause exchange rates
     */
    function pauseExchangeRates() external onlyAdmin {
        currentRate.isActive = false;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Add admin
     * @param adminAddress Admin address
     */
    function addAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != address(0), "Invalid address");
        admins[adminAddress] = true;
        emit AdminAdded(adminAddress);
    }
    
    /**
     * @dev Remove admin
     * @param adminAddress Admin address
     */
    function removeAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != owner(), "Cannot remove owner");
        admins[adminAddress] = false;
        emit AdminRemoved(adminAddress);
    }
    
    /**
     * @dev Add KYC verifier
     * @param verifierAddress Verifier address
     */
    function addKycVerifier(address verifierAddress) external onlyAdmin {
        require(verifierAddress != address(0), "Invalid address");
        kycVerifiers[verifierAddress] = true;
        emit KycVerifierAdded(verifierAddress);
    }
    
    /**
     * @dev Remove KYC verifier
     * @param verifierAddress Verifier address
     */
    function removeKycVerifier(address verifierAddress) external onlyAdmin {
        kycVerifiers[verifierAddress] = false;
        emit KycVerifierRemoved(verifierAddress);
    }
    
    /**
     * @dev Update platform fees
     * @param newOnRampFeeBps New on-ramp fee in basis points
     * @param newOffRampFeeBps New off-ramp fee in basis points
     */
    function updateFees(
        uint256 newOnRampFeeBps,
        uint256 newOffRampFeeBps
    ) external onlyAdmin {
        require(newOnRampFeeBps <= 1000 && newOffRampFeeBps <= 1000, "Fees too high");
        onRampFeeBps = newOnRampFeeBps;
        offRampFeeBps = newOffRampFeeBps;
    }
    
    /**
     * @dev Withdraw collected fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyAdmin {
        require(amount <= totalFeesCollected, "Insufficient fees");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        totalFeesCollected -= amount;
        payable(owner()).transfer(amount);
        
        emit FeesCollected(amount, "Fee withdrawal");
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyAdmin {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get user information
     * @param userAddress User's wallet address
     */
    function getUserInfo(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }
    
    /**
     * @dev Get transaction information
     * @param transactionId Transaction ID
     */
    function getTransactionInfo(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
    
    /**
     * @dev Get user transactions
     * @param userAddress User's wallet address
     */
    function getUserTransactions(address userAddress) external view returns (uint256[] memory) {
        return userTransactions[userAddress];
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalTransactions,
        uint256 totalOnRamp,
        uint256 totalOffRamp,
        uint256 totalFees,
        uint256 escrowBalance
    ) {
        return (
            transactionCounter,
            totalOnRampVolume,
            totalOffRampVolume,
            totalFeesCollected,
            escrowBalance
        );
    }
    
    /**
     * @dev Get current exchange rates
     */
    function getExchangeRates() external view returns (ExchangeRate memory) {
        return currentRate;
    }
    
    /**
     * @dev Calculate HBAR amount for given KES amount
     * @param kesAmount Amount in KES (in wei)
     */
    function calculateHbarAmount(uint256 kesAmount) external view returns (uint256) {
        require(currentRate.isActive, "Exchange rates not available");
        return (kesAmount * currentRate.kesToHbar) / 10**18;
    }
    
    /**
     * @dev Calculate KES amount for given HBAR amount
     * @param hbarAmount Amount in HBAR (in tinybars)
     */
    function calculateKesAmount(uint256 hbarAmount) external view returns (uint256) {
        require(currentRate.isActive, "Exchange rates not available");
        return (hbarAmount * currentRate.hbarToKes) / 10**8;
    }
    
    // ============ FALLBACK ============
    
    receive() external payable {
        // Accept HBAR deposits
    }
}
