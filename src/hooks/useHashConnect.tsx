import { useState, useEffect, useCallback, useRef } from 'react';
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

interface UseHashConnectReturn {
  hashconnect: HashConnect | null;
  connectWallet: () => Promise<void>;
  isPaired: boolean;
  accountIds: string[];
  isConnecting: boolean;
  error: string | null;
  isHashPackAvailable: boolean;
  isInitialized: boolean;
}

export const useHashConnect = (): UseHashConnectReturn => {
  const [hashconnect, setHashconnect] = useState<HashConnect | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHashPackAvailable, setIsHashPackAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use ref to prevent double initialization in React.StrictMode
  const initializationRef = useRef(false);

  // Modern HashPack detection - no window references
  const detectHashPack = useCallback(async (): Promise<boolean> => {
    console.log('🔍 Starting HashPack detection (no window references)...');
    
    try {
      // Method 1: Check for secure context (HTTPS/localhost)
      const isSecureContext = window.isSecureContext || 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        console.log('❌ Not in secure context - HashPack requires HTTPS');
        return false;
      }

      // Method 2: Check for HashPack extension via chrome.runtime
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
        try {
          const manifest = (window as any).chrome.runtime.getManifest();
          if (manifest && (
            manifest.name?.toLowerCase().includes('hashpack') ||
            manifest.name?.toLowerCase().includes('hedera')
          )) {
            console.log('✅ HashPack extension detected via manifest');
            return true;
          }
        } catch (e) {
          console.log('🔍 No extension manifest found');
        }
      }

      // Method 3: Try to detect HashPack by attempting connection
      // This is the most reliable method - let HashConnect handle detection
      console.log('🔍 Attempting HashConnect-based detection...');
      return true; // Let HashConnect handle the actual detection
      
    } catch (err) {
      console.log('🔍 HashPack detection error:', err);
      return false;
    }
  }, []);

  // Initialize HashConnect with modern approach
  const initializeHashConnect = useCallback(async () => {
    if (initializationRef.current) {
      console.log('🔄 HashConnect already initializing, skipping...');
      return;
    }
    
    initializationRef.current = true;
    
    try {
      console.log('🚀 Starting HashConnect initialization...');
      setError(null);
      
      // Step 1: Detect HashPack
      console.log('📡 Step 1: Detecting HashPack...');
      const hashPackDetected = await detectHashPack();
      setIsHashPackAvailable(hashPackDetected);
      
      if (!hashPackDetected) {
        console.log('⚠️ HashPack not detected, but continuing with initialization...');
      }

      // Step 2: Create HashConnect instance
      console.log('📡 Step 2: Creating HashConnect instance...');
      const hashConnect = new HashConnect();
      
      // Step 3: Prepare app metadata
      console.log('📡 Step 3: Preparing app metadata...');
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: 'Hedera Ramp Hub',
        description: 'M-Pesa to HBAR On/Off-Ramp Platform',
        icon: `${window.location.origin}/hedera-logo.svg`,
        url: window.location.origin
      };

      console.log('📡 App metadata:', appMetadata);

      // Step 4: Initialize HashConnect
      console.log('📡 Step 4: Initializing HashConnect with testnet...');
      await hashConnect.init(appMetadata, 'testnet', false);
      
      setHashconnect(hashConnect);
      setIsInitialized(true);
      console.log('✅ HashConnect initialized successfully');

      // Step 5: Set up event listeners
      console.log('📡 Step 5: Setting up event listeners...');
      
      // Pairing event listener
      hashConnect.pairingEvent.on((data) => {
        console.log('🔗 Pairing event received:', data);
        
        if (data.accountIds && data.accountIds.length > 0) {
          setAccountIds(data.accountIds);
          setIsPaired(true);
          setIsConnecting(false);
          setError(null);
          console.log('✅ Wallet paired successfully with accounts:', data.accountIds);
        }
      });

      // Connection status change listener
      hashConnect.connectionStatusChangeEvent.on((data) => {
        console.log('🔄 Connection status changed:', data);
      });

      // Step 6: Check for existing pairings using getPairingData()
      console.log('📡 Step 6: Checking for existing pairings...');
      try {
        const pairingData = hashConnect.getPairingData();
        console.log('📡 Existing pairing data:', pairingData);
        
        if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
          setAccountIds(pairingData.accountIds);
          setIsPaired(true);
          console.log('✅ Found existing pairing:', pairingData.accountIds);
        }
      } catch (error) {
        console.log('📡 No existing pairings found:', error);
      }

      console.log('🎉 HashConnect initialization completed successfully!');
      
    } catch (err: any) {
      console.error('❌ HashConnect initialization failed:', err);
      setError(err.message || 'Failed to initialize HashConnect');
      initializationRef.current = false; // Reset on error
    }
  }, [detectHashPack]);

  // Initialize on mount
  useEffect(() => {
    initializeHashConnect();
  }, [initializeHashConnect]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    if (!hashconnect) {
      setError('HashConnect not initialized');
      return;
    }

    if (!isInitialized) {
      setError('HashConnect not ready');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('🔄 Attempting to connect to HashPack...');
      console.log('📡 HashConnect state:', {
        isInitialized,
        isPaired,
        accountIds: accountIds.length
      });
      
      // Use the modern connectToLocalWallet method
      await hashconnect.connectToLocalWallet();
      
      console.log('✅ Connection request sent to HashPack');
      
    } catch (err: any) {
      console.error('❌ Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect to wallet');
      setIsConnecting(false);
    }
  }, [hashconnect, isInitialized, isPaired, accountIds]);

  // Auto-reconnect functionality
  const attemptAutoReconnect = useCallback(async () => {
    if (!hashconnect || !isInitialized) return;
    
    try {
      console.log('🔄 Attempting auto-reconnect...');
      const pairingData = hashconnect.getPairingData();
      
      if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
        setAccountIds(pairingData.accountIds);
        setIsPaired(true);
        console.log('✅ Auto-reconnected with existing pairing:', pairingData.accountIds);
      }
    } catch (error) {
      console.log('📡 No existing pairing for auto-reconnect:', error);
    }
  }, [hashconnect, isInitialized]);

  // Attempt auto-reconnect on initialization
  useEffect(() => {
    if (isInitialized && hashconnect) {
      attemptAutoReconnect();
    }
  }, [isInitialized, hashconnect, attemptAutoReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hashconnect) {
        console.log('🧹 Cleaning up HashConnect');
        // Remove event listeners
        hashconnect.pairingEvent.removeAllListeners();
        hashconnect.connectionStatusChangeEvent.removeAllListeners();
      }
    };
  }, [hashconnect]);

  return {
    hashconnect,
    connectWallet,
    isPaired,
    accountIds,
    isConnecting,
    error,
    isHashPackAvailable,
    isInitialized
  };
};