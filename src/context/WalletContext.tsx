import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KYCStatus } from '@/types/wallet';
import { walletManager, WalletState } from '@/services/walletManager';

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
  const [wallet, setWallet] = useState<WalletState>(walletManager.getState());
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    isVerified: false,
    status: 'not_started',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = walletManager.subscribe((newState) => {
      setWallet(newState);
    });

    // Load KYC status
    const savedKyc = localStorage.getItem('kycStatus');
    if (savedKyc) {
      setKycStatus(JSON.parse(savedKyc));
    }

    // Auto-connect if possible - try once only
    const attemptAutoConnect = async () => {
      try {
        console.log('🔄 Attempting auto-connect...');
        const connected = await walletManager.autoConnect();
        if (connected) {
          console.log('✅ Auto-connect successful!');
        } else {
          console.log('⚠️ Auto-connect failed - HashPack not detected');
        }
      } catch (error) {
        console.warn('Auto-connect error:', error);
      }
    };

    // Start auto-connect attempt (only once)
    attemptAutoConnect();

    return unsubscribe;
  }, []);

  const connectWallet = async (type: 'hashpack' | 'blade') => {
    setIsLoading(true);
    try {
      if (type === 'hashpack') {
        await walletManager.connectWallet();
      } else {
        throw new Error('Only HashPack is supported at this time');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    walletManager.disconnect();
    // Redirect to home
    window.location.href = '/';
  };

  const updateBalance = async () => {
    if (!wallet.accountId) return;
    
    setIsLoading(true);
    try {
      await walletManager.getBalance();
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
