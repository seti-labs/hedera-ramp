import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletState, KYCStatus } from '@/types/wallet';

interface WalletContextType {
  wallet: WalletState;
  kycStatus: KYCStatus;
  connectWallet: (type: 'hashpack' | 'blade') => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
  setKycStatus: (status: KYCStatus) => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    balance: null,
    walletType: null,
  });
  
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    isVerified: false,
    status: 'not_started',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('walletState');
    const savedKyc = localStorage.getItem('kycStatus');
    
    if (savedWallet) {
      setWallet(JSON.parse(savedWallet));
    }
    
    if (savedKyc) {
      setKycStatus(JSON.parse(savedKyc));
    }
  }, []);

  const connectWallet = async (type: 'hashpack' | 'blade') => {
    setIsLoading(true);
    try {
      // Simulate wallet connection
      // In production, use actual HashPack or Blade SDK
      
      // Mock account ID for demo
      const mockAccountId = `0.0.${Math.floor(Math.random() * 1000000)}`;
      const mockBalance = (Math.random() * 1000).toFixed(2);
      
      const newWalletState = {
        isConnected: true,
        accountId: mockAccountId,
        balance: mockBalance,
        walletType: type,
      };
      
      setWallet(newWalletState);
      localStorage.setItem('walletState', JSON.stringify(newWalletState));
      
      // In production, this would be:
      // if (type === 'hashpack') {
      //   const hashconnect = new HashConnect();
      //   await hashconnect.init(appMetadata);
      //   const state = await hashconnect.connect();
      //   // Set actual wallet state
      // }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      accountId: null,
      balance: null,
      walletType: null,
    });
    localStorage.removeItem('walletState');
  };

  const updateBalance = async () => {
    if (!wallet.accountId) return;
    
    setIsLoading(true);
    try {
      // In production, fetch from Hedera Mirror Node API
      // const response = await fetch(
      //   `https://testnet.mirrornode.hedera.com/api/v1/accounts/${wallet.accountId}`
      // );
      // const data = await response.json();
      // const balance = data.balance.balance / 100000000; // Convert tinybars to HBAR
      
      // Mock balance update
      const newBalance = (parseFloat(wallet.balance || '0') + Math.random() * 10).toFixed(2);
      const updatedWallet = { ...wallet, balance: newBalance };
      setWallet(updatedWallet);
      localStorage.setItem('walletState', JSON.stringify(updatedWallet));
    } catch (error) {
      console.error('Failed to update balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateKycStatus = (status: KYCStatus) => {
    setKycStatus(status);
    localStorage.setItem('kycStatus', JSON.stringify(status));
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        kycStatus,
        connectWallet,
        disconnectWallet,
        updateBalance,
        setKycStatus: updateKycStatus,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
