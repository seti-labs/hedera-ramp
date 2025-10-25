/**
 * Wallet Manager Test Utility
 * Simple test to verify wallet functionality
 */

import { walletManager } from '@/services/walletManager';

export const testWalletManager = async () => {
  console.log('🧪 Testing Wallet Manager...');
  
  try {
    // Test 1: Check initial state
    const initialState = walletManager.getState();
    console.log('✅ Initial state:', initialState);
    
    // Test 2: Check HashPack availability with detailed logging
    console.log('🔍 Checking HashPack availability...');
    const isAvailable = await walletManager.checkHashPackAvailability();
    console.log('✅ HashPack available:', isAvailable);
    
    // Test 3: Test auto-connect if available
    if (isAvailable) {
      console.log('🔄 Testing auto-connect...');
      const connected = await walletManager.autoConnect();
      console.log('✅ Auto-connect result:', connected);
      
      if (connected) {
        const connectedState = walletManager.getState();
        console.log('✅ Connected state:', connectedState);
        console.log('🎉 Successfully connected to wallet!');
      } else {
        console.log('⚠️ Auto-connect failed, but HashPack is available');
      }
    } else {
      console.log('❌ HashPack not detected - please ensure HashPack extension is installed and unlocked');
    }
    
    console.log('🎉 Wallet Manager test completed!');
    return true;
  } catch (error) {
    console.error('❌ Wallet Manager test failed:', error);
    return false;
  }
};

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Delay test to allow components to initialize
  setTimeout(() => {
    testWalletManager();
  }, 2000);
}
