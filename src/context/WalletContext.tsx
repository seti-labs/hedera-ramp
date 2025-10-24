import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletState, KYCStatus } from '@/types/wallet';

// Polyfills for HashConnect
if (typeof window !== 'undefined') {
  (window as any).require = (window as any).require || function() { return {}; };
  
  // Add Buffer polyfill for HashConnect
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      from: (data: any, encoding?: string) => {
        if (typeof data === 'string') {
          return new TextEncoder().encode(data);
        }
        return data;
      },
      isBuffer: () => false,
    };
  }

  // Add Long.js polyfill for HashConnect/Protobuf
  // This fixes "Cannot read properties of undefined (reading 'from')" error
  import('long').then((LongModule) => {
    const Long = LongModule.default;
    (window as any).Long = Long;
    console.log('Long.js polyfill loaded for HashConnect');
  }).catch((err) => {
    console.warn('Failed to load Long.js polyfill:', err);
  });
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
      console.log('🔄 Attempting to connect to HashPack...');

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
      
      // Create HashConnect instance with debug mode
      const hashconnect = new HashConnect();
      
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: 'Hedera Ramp Hub',
        description: 'M-Pesa to HBAR On/Off-Ramp Platform',
        icon: window.location.origin + '/hedera-logo.svg',
        url: window.location.origin
      };

      // Initialize HashConnect
      console.log('🔄 Initializing HashConnect...');
      
      let initState;
      try {
        initState = await hashconnect.init(appMetadata, 'testnet', false);
        console.log('✅ HashConnect initialized:', initState);
      } catch (initError) {
        console.error('❌ HashConnect initialization failed:', initError);
        throw new Error('Failed to initialize HashConnect. Please:\n1. Make sure HashPack is installed from hashpack.app\n2. Unlock your HashPack wallet\n3. Refresh the page and try again');
      }

      // Wait for pairing to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout. Please:\n1. Make sure HashPack is unlocked\n2. Switch to Testnet network\n3. Check for popup blockers\n4. Try clicking the HashPack extension icon'));
        }, 60000); // 60 seconds timeout

        // Listen for pairing event BEFORE calling connect
        hashconnect.pairingEvent.once((data) => {
          clearTimeout(timeout);
          console.log('✅ Pairing successful:', data);
          
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

        // Trigger the connection - this should open HashPack popup
        console.log('🔄 Calling hashconnect.connect() to open HashPack...');
        
        // Add a small delay to ensure user interaction is registered
        setTimeout(() => {
          hashconnect.connect().then((connectionState) => {
            console.log('HashConnect.connect() returned:', connectionState);
          }).catch((connectError) => {
            clearTimeout(timeout);
            console.error('❌ HashConnect.connect() failed:', connectError);
            reject(new Error('Failed to open HashPack connection. Please:\n1. Make sure HashPack extension is installed\n2. Click the HashPack extension icon\n3. Check for popup blockers'));
          });
        }, 100);
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
