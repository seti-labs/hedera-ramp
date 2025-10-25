import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletState, KYCStatus } from '@/types/wallet';
import { mockWalletState, mockKycStatus } from '@/utils/mockData';

interface MockWalletContextType {
  wallet: WalletState;
  kycStatus: KYCStatus;
  connectWallet: (type: 'hashpack' | 'blade') => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
  setKycStatus: (status: KYCStatus) => void;
  isLoading: boolean;
}

const MockWalletContext = createContext<MockWalletContextType | undefined>(undefined);

export const useMockWallet = () => {
  const context = useContext(MockWalletContext);
  if (context === undefined) {
    throw new Error('useMockWallet must be used within a MockWalletProvider');
  }
  return context;
};

interface MockWalletProviderProps {
  children: ReactNode;
}

export const MockWalletProvider = ({ children }: MockWalletProviderProps) => {
  const [wallet, setWallet] = useState<WalletState>(mockWalletState);
  const [kycStatus, setKycStatus] = useState<KYCStatus>(mockKycStatus);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate wallet connection
  const connectWallet = async (type: 'hashpack' | 'blade') => {
    setIsLoading(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setWallet({
      isConnected: true,
      accountId: mockWalletState.accountId,
      balance: mockWalletState.balance,
      walletType: type
    });
    
    // Store in localStorage for persistence
    localStorage.setItem('walletState', JSON.stringify({
      isConnected: true,
      accountId: mockWalletState.accountId,
      balance: mockWalletState.balance,
      walletType: type
    }));
    
    setIsLoading(false);
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      accountId: '',
      balance: '0',
      walletType: 'hashpack'
    });
    localStorage.removeItem('walletState');
  };

  const updateBalance = async () => {
    // Simulate balance update
    const newBalance = (parseFloat(mockWalletState.balance) + Math.random() * 10).toFixed(2);
    setWallet(prev => ({
      ...prev,
      balance: newBalance
    }));
  };

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('walletState');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to load wallet state:', error);
      }
    }
  }, []);

  const value: MockWalletContextType = {
    wallet,
    kycStatus,
    connectWallet,
    disconnectWallet,
    updateBalance,
    setKycStatus,
    isLoading
  };

  return (
    <MockWalletContext.Provider value={value}>
      {children}
    </MockWalletContext.Provider>
  );
};
