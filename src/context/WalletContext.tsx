import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletState, KYCStatus } from '@/types/wallet';

// Polyfill for require function
if (typeof window !== 'undefined') {
  (window as any).require = (window as any).require || function() { return {}; };
}

// Extend Window interface for HashPack and Blade
declare global {
  interface Window {
    hashconnect?: any;
    bladeConnector?: any;
    require?: any;
  }
}

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

  const connectHashPack = async () => {
    try {
      // Skip detection check - try to connect directly
      console.log('Attempting to connect to HashPack...');

      // Clear any existing pairing data to force fresh connection
      localStorage.removeItem('hashconnectData');
      localStorage.removeItem('hashconnectPairingString');
      
      // Initialize HashConnect with better error handling
      let HashConnect, HashConnectTypes;
      try {
        const hashconnectModule = await import('@hashgraph/hashconnect');
        HashConnect = hashconnectModule.HashConnect;
        HashConnectTypes = hashconnectModule.HashConnectTypes;
      } catch (importError) {
        console.error('Failed to import HashConnect:', importError);
        throw new Error('HashConnect library failed to load. Please refresh the page and try again.');
      }
      
      const hashconnect = new HashConnect();
      
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: 'Hedera Ramp Hub',
        description: 'M-Pesa to HBAR On/Off-Ramp Platform',
        icon: window.location.origin + '/hedera-logo.svg',
        url: window.location.origin,
      };

      // Initialize HashConnect
      await hashconnect.init(appMetadata, 'testnet', false);
      
      console.log('HashConnect initialized, connecting to HashPack...');

      // Create new pairing - this should trigger HashPack popup
      const state = await hashconnect.connect();
      
      console.log('HashConnect.connect() called, waiting for HashPack popup...');
      
      console.log('Connection state:', state);

      // Wait for pairing to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout. Please make sure HashPack is unlocked and on Testnet.'));
        }, 30000);

        hashconnect.pairingEvent.on((data) => {
          clearTimeout(timeout);
          console.log('Pairing successful:', data);
          
          if (data.accountIds && data.accountIds.length > 0) {
            const accountId = data.accountIds[0];
      
      const newWalletState = {
        isConnected: true,
              accountId: accountId,
              balance: '0',
              walletType: 'hashpack' as const,
            };
            
            setWallet(newWalletState);
            localStorage.setItem('walletState', JSON.stringify(newWalletState));
            
            // Update balance after connection
            setTimeout(() => updateBalance(), 1000);
            
            resolve(true);
          } else {
            reject(new Error('No account data received from HashPack'));
          }
        });
      });
    } catch (error) {
      console.error('HashPack connection error:', error);
      throw error;
    }
  };

  const connectBlade = async () => {
    try {
      // Check if Blade extension is installed
      if (!window.bladeConnector) {
        throw new Error('Blade wallet not found. Please install the Blade extension.');
      }

      const bladeConnector = window.bladeConnector;
      
      // Connect to Blade
      const result = await bladeConnector.createSession({
        network: 'testnet',
        dAppMetadata: {
          name: 'Hedera Ramp Hub',
          description: 'On-ramp and off-ramp solution for Hedera',
          url: window.location.origin,
          icon: window.location.origin + '/logo.svg',
        },
      });

      if (result.success && result.accountId) {
        const newWalletState = {
          isConnected: true,
          accountId: result.accountId,
          balance: null, // Will be updated
          walletType: 'blade' as const,
      };
      
      setWallet(newWalletState);
      localStorage.setItem('walletState', JSON.stringify(newWalletState));
      
        // Update balance
        updateBalance();
        
        return bladeConnector;
      } else {
        throw new Error('Failed to connect to Blade wallet');
      }
    } catch (error) {
      console.error('Blade connection error:', error);
      throw error;
    }
  };

  const connectWallet = async (type: 'hashpack' | 'blade') => {
    setIsLoading(true);
    try {
      if (type === 'hashpack') {
        await connectHashPack();
      } else {
        throw new Error('Only HashPack is supported at this time');
      }
      
      // Auto-fetch balance after connection
      setTimeout(() => updateBalance(), 1000);
    } catch (error: any) {
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
    
    // Clear all auth data
    localStorage.removeItem('walletState');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('kycStatus');
    
    // Redirect to home
    window.location.href = '/';
  };

  const updateBalance = async () => {
    if (!wallet.accountId) return;
    
    setIsLoading(true);
    try {
      // Fetch from Hedera Mirror Node API
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${wallet.accountId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance from Hedera network');
      }
      
      const data = await response.json();
      const balanceInHbar = (data.balance.balance / 100000000).toFixed(2); // Convert tinybars to HBAR
      
      const updatedWallet = { ...wallet, balance: balanceInHbar };
      setWallet(updatedWallet);
      localStorage.setItem('walletState', JSON.stringify(updatedWallet));
    } catch (error) {
      console.error('Failed to update balance:', error);
      // Fallback: keep existing balance
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
