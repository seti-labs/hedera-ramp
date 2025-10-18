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
    AccountInfoQuery
)
import os
from typing import Optional, Dict, Any


class HederaService:
    """Service for interacting with Hedera Network."""
    
    def __init__(self, network: str = 'testnet', operator_id: Optional[str] = None, operator_key: Optional[str] = None):
        """
        Initialize Hedera client.
        
        Args:
            network: 'testnet', 'mainnet', or 'previewnet'
            operator_id: Hedera account ID (e.g., '0.0.12345')
            operator_key: Private key for the operator account
        """
        self.network = network
        self.operator_id = operator_id or os.getenv('HEDERA_OPERATOR_ID')
        self.operator_key = operator_key or os.getenv('HEDERA_OPERATOR_KEY')
        
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

