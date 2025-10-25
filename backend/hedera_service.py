"""
Hedera Service - Initialization and interaction with Hedera Network
This service provides utility functions for interacting with Hedera Hashgraph.
Smart contract code is not included as requested.
"""

from hedera import (
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    TransferTransaction,
    AccountBalanceQuery,
    AccountInfoQuery,
    ContractId,
    ContractCallQuery,
    ContractExecuteTransaction,
    ContractFunctionParameters
)
import os
from typing import Optional, Dict, Any


class HederaService:
    """Service for interacting with Hedera Network."""
    
    def __init__(self, network: str = 'testnet', operator_id: Optional[str] = None, operator_key: Optional[str] = None, contract_id: Optional[str] = None):
        """
        Initialize Hedera client.
        
        Args:
            network: 'testnet', 'mainnet', or 'previewnet'
            operator_id: Hedera account ID (e.g., '0.0.12345')
            operator_key: Private key for the operator account
            contract_id: Smart contract ID (e.g., '0.0.CONTRACT_ID')
        """
        self.network = network
        self.operator_id = operator_id or os.getenv('HEDERA_OPERATOR_ID')
        self.operator_key = operator_key or os.getenv('HEDERA_OPERATOR_KEY')
        self.contract_id = contract_id or os.getenv('HEDERA_CONTRACT_ID')
        
        # Initialize client based on network
        if network == 'mainnet':
            self.client = Client.forMainnet()
        elif network == 'previewnet':
            self.client = Client.forPreviewnet()
        else:  # Default to testnet
            self.client = Client.forTestnet()
        
        # Set operator if credentials are provided
        if self.operator_id and self.operator_key:
            self.client.setOperator(
                AccountId.fromString(self.operator_id),
                PrivateKey.fromString(self.operator_key)
            )
        
        # Set contract ID if provided
        if self.contract_id:
            self.contract_id_obj = ContractId.fromString(self.contract_id)
        else:
            self.contract_id_obj = None
    
    def get_client(self) -> Client:
        """Get the configured Hedera client."""
        return self.client
    
    async def get_account_balance(self, account_id: str) -> Optional[float]:
        """
        Get the HBAR balance of an account.
        
        Args:
            account_id: Hedera account ID (e.g., '0.0.12345')
            
        Returns:
            Balance in HBAR or None if error
        """
        try:
            account_id_obj = AccountId.fromString(account_id)
            query = AccountBalanceQuery().setAccountId(account_id_obj)
            balance = await query.execute(self.client)
            return float(balance.hbars.toString())
        except Exception as e:
            print(f"Error getting account balance: {e}")
            return None
    
    async def get_account_info(self, account_id: str) -> Optional[Dict[str, Any]]:
        """
        Get account information from Hedera network.
        
        Args:
            account_id: Hedera account ID (e.g., '0.0.12345')
            
        Returns:
            Dictionary with account info or None if error
        """
        try:
            account_id_obj = AccountId.fromString(account_id)
            query = AccountInfoQuery().setAccountId(account_id_obj)
            info = await query.execute(self.client)
            
            return {
                'account_id': str(info.accountId),
                'balance': float(info.balance.toString()),
                'key': str(info.key),
                'is_deleted': info.isDeleted,
                'account_memo': info.accountMemo
            }
        except Exception as e:
            print(f"Error getting account info: {e}")
            return None
    
    async def transfer_hbar(self, to_account_id: str, amount: float) -> Optional[str]:
        """
        Transfer HBAR from operator account to another account.
        
        Args:
            to_account_id: Recipient's Hedera account ID
            amount: Amount in HBAR to transfer
            
        Returns:
            Transaction ID or None if error
        """
        try:
            to_account = AccountId.fromString(to_account_id)
            
            transaction = (
                TransferTransaction()
                .addHbarTransfer(AccountId.fromString(self.operator_id), Hbar(-amount))
                .addHbarTransfer(to_account, Hbar(amount))
            )
            
            # Submit transaction
            tx_response = await transaction.execute(self.client)
            
            # Get receipt
            receipt = await tx_response.getReceipt(self.client)
            
            if receipt.status.toString() == "SUCCESS":
                return str(tx_response.transactionId)
            
            return None
        except Exception as e:
            print(f"Error transferring HBAR: {e}")
            return None
    
    async def validate_account_id(self, account_id: str) -> bool:
        """
        Validate if an account ID exists on the network.
        
        Args:
            account_id: Hedera account ID to validate
            
        Returns:
            True if valid and exists, False otherwise
        """
        try:
            info = await self.get_account_info(account_id)
            return info is not None and not info.get('is_deleted', True)
        except Exception:
            return False
    
    # ============ SMART CONTRACT FUNCTIONS ============
    
    def register_user_on_contract(self, user_address: str, phone_number: str, country_code: str = 'KE') -> Dict[str, Any]:
        """
        Register user on smart contract.
        
        Args:
            user_address: User's Hedera account ID
            phone_number: User's phone number
            country_code: User's country code
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "registerUser",
                    ContractFunctionParameters()
                        .addString(phone_number)
                        .addString(country_code)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def verify_user_kyc_on_contract(self, user_address: str) -> Dict[str, Any]:
        """
        Verify user KYC on smart contract.
        
        Args:
            user_address: User's Hedera account ID
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            user_account = AccountId.fromString(user_address)
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "verifyKyc",
                    ContractFunctionParameters()
                        .addAddress(user_account)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def initiate_onramp_transaction(self, user_address: str, fiat_amount: int, phone_number: str) -> Dict[str, Any]:
        """
        Initiate on-ramp transaction on smart contract.
        
        Args:
            user_address: User's Hedera account ID
            fiat_amount: Amount in KES (in wei)
            phone_number: User's phone number
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "initiateOnRamp",
                    ContractFunctionParameters()
                        .addUint256(fiat_amount)
                        .addString(phone_number)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def initiate_offramp_transaction(self, user_address: str, hbar_amount: int, phone_number: str) -> Dict[str, Any]:
        """
        Initiate off-ramp transaction on smart contract.
        
        Args:
            user_address: User's Hedera account ID
            hbar_amount: Amount in HBAR (in tinybars)
            phone_number: User's phone number
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "initiateOffRamp",
                    ContractFunctionParameters()
                        .addUint256(hbar_amount)
                        .addString(phone_number)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_transaction_status(self, transaction_id: int, status: int, intersend_id: str = "", notes: str = "") -> Dict[str, Any]:
        """
        Update transaction status on smart contract.
        
        Args:
            transaction_id: Transaction ID
            status: Status (0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED, 4=CANCELLED)
            intersend_id: Intersend transaction ID
            notes: Additional notes
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "updateTransactionStatus",
                    ContractFunctionParameters()
                        .addUint256(transaction_id)
                        .addUint8(status)
                        .addString(intersend_id)
                        .addString(notes)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_info_from_contract(self, user_address: str) -> Dict[str, Any]:
        """
        Get user info from smart contract.
        
        Args:
            user_address: User's Hedera account ID
            
        Returns:
            Dictionary with user info or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            user_account = AccountId.fromString(user_address)
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "getUserInfo",
                    ContractFunctionParameters()
                        .addAddress(user_account)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_transaction_info_from_contract(self, transaction_id: int) -> Dict[str, Any]:
        """
        Get transaction info from smart contract.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            Dictionary with transaction info or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "getTransactionInfo",
                    ContractFunctionParameters()
                        .addUint256(transaction_id)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_exchange_rates(self, kes_to_hbar: int, hbar_to_kes: int) -> Dict[str, Any]:
        """
        Update exchange rates on smart contract.
        
        Args:
            kes_to_hbar: Rate: 1 KES = X HBAR (in wei)
            hbar_to_kes: Rate: 1 HBAR = X KES (in wei)
            
        Returns:
            Dictionary with success status and transaction ID
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "updateExchangeRates",
                    ContractFunctionParameters()
                        .addUint256(kes_to_hbar)
                        .addUint256(hbar_to_kes)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId),
                "receipt": str(receipt)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_exchange_rates_from_contract(self) -> Dict[str, Any]:
        """
        Get current exchange rates from smart contract.
        
        Returns:
            Dictionary with exchange rates or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction("getExchangeRates")
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_hbar_amount(self, kes_amount: int) -> Dict[str, Any]:
        """
        Calculate HBAR amount for given KES amount.
        
        Args:
            kes_amount: Amount in KES (in wei)
            
        Returns:
            Dictionary with HBAR amount or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "calculateHbarAmount",
                    ContractFunctionParameters()
                        .addUint256(kes_amount)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "hbar_amount": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_kes_amount(self, hbar_amount: int) -> Dict[str, Any]:
        """
        Calculate KES amount for given HBAR amount.
        
        Args:
            hbar_amount: Amount in HBAR (in tinybars)
            
        Returns:
            Dictionary with KES amount or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "calculateKesAmount",
                    ContractFunctionParameters()
                        .addUint256(hbar_amount)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "kes_amount": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_platform_stats_from_contract(self) -> Dict[str, Any]:
        """
        Get platform statistics from smart contract.
        
        Returns:
            Dictionary with platform stats or error
        """
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction("getPlatformStats")
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============ SIMPLE CONTRACT FUNCTIONS ============
    
    def register_user_simple(self, user_address: str, phone_number: str) -> Dict[str, Any]:
        """Register user on simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "registerUser",
                    ContractFunctionParameters()
                        .addString(phone_number)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def verify_kyc_simple(self, user_address: str) -> Dict[str, Any]:
        """Verify user KYC on simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            user_account = AccountId.fromString(user_address)
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "verifyKyc",
                    ContractFunctionParameters()
                        .addAddress(user_account)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_transaction_simple(self, user_address: str, is_on_ramp: bool, amount: int, currency: str) -> Dict[str, Any]:
        """Create transaction on simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "createTransaction",
                    ContractFunctionParameters()
                        .addBool(is_on_ramp)
                        .addUint256(amount)
                        .addString(currency)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def complete_transaction_simple(self, transaction_id: int) -> Dict[str, Any]:
        """Complete transaction on simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "completeTransaction",
                    ContractFunctionParameters()
                        .addUint256(transaction_id)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_rates_simple(self, kes_to_hbar: int, hbar_to_kes: int) -> Dict[str, Any]:
        """Update exchange rates on simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            tx = ContractExecuteTransaction() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "updateExchangeRates",
                    ContractFunctionParameters()
                        .addUint256(kes_to_hbar)
                        .addUint256(hbar_to_kes)
                )
            
            response = tx.execute(self.client)
            receipt = response.getReceipt(self.client)
            
            return {
                "success": True, 
                "transaction_id": str(response.transactionId)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_rates_simple(self) -> Dict[str, Any]:
        """Get exchange rates from simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction("getExchangeRates")
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_hbar_simple(self, kes_amount: int) -> Dict[str, Any]:
        """Calculate HBAR amount for KES on simple contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "calculateHbarAmount",
                    ContractFunctionParameters()
                        .addUint256(kes_amount)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_kes_simple(self, hbar_amount: int) -> Dict[str, Any]:
        """Calculate KES amount for HBAR on simple contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction(
                    "calculateKesAmount",
                    ContractFunctionParameters()
                        .addUint256(hbar_amount)
                )
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_stats_simple(self) -> Dict[str, Any]:
        """Get platform statistics from simple smart contract"""
        try:
            if not self.contract_id_obj:
                return {"success": False, "error": "Contract ID not configured"}
            
            query = ContractCallQuery() \
                .setContractId(self.contract_id_obj) \
                .setGas(100000) \
                .setFunction("getPlatformStats")
            
            response = query.execute(self.client)
            
            return {
                "success": True, 
                "data": response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def close(self):
        """Close the Hedera client connection."""
        if self.client:
            self.client.close()


# Global instance
hedera_service = None


def init_hedera_service(network: str = 'testnet', operator_id: Optional[str] = None, operator_key: Optional[str] = None) -> HederaService:
    """
    Initialize and return the global Hedera service instance.
    
    Args:
        network: 'testnet', 'mainnet', or 'previewnet'
        operator_id: Hedera account ID
        operator_key: Private key for the operator account
        
    Returns:
        HederaService instance
    """
    global hedera_service
    hedera_service = HederaService(network, operator_id, operator_key)
    return hedera_service


def get_hedera_service() -> Optional[HederaService]:
    """Get the global Hedera service instance."""
    return hedera_service

