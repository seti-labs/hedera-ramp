/**
 * Centralized Wallet Manager
 * Single source of truth for all wallet operations
 */

import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  balance: string | null;
  walletType: 'hashpack' | 'blade' | null;
}

export interface WalletTransaction {
  transactionId: string;
  amount: string;
  type: 'send' | 'receive' | 'swap';
  status: 'pending' | 'completed' | 'failed';
  hederaAccountId: string;
  metadata?: any;
}

class WalletManager {
  private static instance: WalletManager;
  private hashconnect: HashConnect | null = null;
  private isInitialized = false;
  private walletState: WalletState = {
    isConnected: false,
    accountId: null,
    balance: null,
    walletType: null,
  };
  private listeners: Array<(state: WalletState) => void> = [];

  private constructor() {
    this.loadFromStorage();
    this.initializePolyfills();
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  private initializePolyfills() {
    if (typeof window !== 'undefined') {
      // Buffer polyfill
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

      // Long.js polyfill
      import('long').then((LongModule) => {
        const Long = LongModule.default;
        (window as any).Long = Long;
        console.log('Long.js polyfill loaded');
      }).catch((err) => {
        console.warn('Failed to load Long.js polyfill:', err);
      });
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('walletState');
      if (saved) {
        this.walletState = { ...this.walletState, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load wallet state from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('walletState', JSON.stringify(this.walletState));
    } catch (error) {
      console.warn('Failed to save wallet state to storage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.walletState));
  }

  private updateState(updates: Partial<WalletState>) {
    this.walletState = { ...this.walletState, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  // Public API
  getState(): WalletState {
    return { ...this.walletState };
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { HashConnect, HashConnectTypes } = await import('@hashgraph/hashconnect');
      
      this.hashconnect = new HashConnect();
      
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: 'Hedera Ramp Hub',
        description: 'M-Pesa to HBAR On/Off-Ramp Platform',
        icon: window.location.origin + '/hedera-logo.svg',
        url: window.location.origin
      };

      await this.hashconnect.init(appMetadata, 'testnet', false);
      this.isInitialized = true;
      
      console.log('✅ WalletManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WalletManager:', error);
      throw error;
    }
  }

  async checkHashPackAvailability(): Promise<boolean> {
    const isAvailable = !!(
      window.hashconnect ||
      (window as any).hashconnect ||
      (window as any).HashConnect ||
      (window as any).hashpack ||
      ('hashconnect' in window)
    );
    
    if (isAvailable && !this.isInitialized) {
      try {
        await this.initialize();
        return true;
      } catch (error) {
        console.warn('HashPack detected but initialization failed:', error);
        return false;
      }
    }
    
    return isAvailable;
  }

  async connectWallet(): Promise<void> {
    if (!this.hashconnect) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Wallet connection timeout. Please try again.'));
      }, 30000);

      this.hashconnect!.pairingEvent.once((data) => {
        clearTimeout(timeout);
        
        if (data.accountIds && data.accountIds.length > 0) {
          const accountId = data.accountIds[0];
          
          this.updateState({
            isConnected: true,
            accountId: accountId,
            walletType: 'hashpack',
            balance: '0'
          });

          // Get balance
          this.getBalance().then(balance => {
            this.updateState({ balance });
          }).catch(err => {
            console.warn('Failed to get balance:', err);
          });

          // Sync with backend
          this.syncWithBackend().catch(err => {
            console.warn('Failed to sync with backend:', err);
          });

          resolve();
        } else {
          reject(new Error('No account data received from wallet'));
        }
      });

      this.hashconnect!.connect().catch(reject);
    });
  }

  async getBalance(): Promise<string> {
    if (!this.walletState.accountId) {
      throw new Error('No account connected');
    }

    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${this.walletState.accountId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance from Hedera network');
      }
      
      const data = await response.json();
      const balanceInHbar = (data.balance.balance / 100000000).toFixed(2);
      
      this.updateState({ balance: balanceInHbar });
      return balanceInHbar;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async syncWithBackend(): Promise<void> {
    if (!this.walletState.accountId) {
      throw new Error('No account connected');
    }

    try {
      const response = await fetch('/api/wallet/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          hedera_account_id: this.walletState.accountId,
          wallet_type: this.walletState.walletType,
          balance: this.walletState.balance
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      console.log('✅ Wallet synced with backend');
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      throw error;
    }
  }

  async recordTransaction(transaction: WalletTransaction): Promise<void> {
    try {
      const response = await fetch('/api/wallet/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          hedera_account_id: transaction.hederaAccountId,
          metadata: transaction.metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record transaction');
      }

      console.log('✅ Transaction recorded in backend');
    } catch (error) {
      console.error('Failed to record transaction:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.updateState({
      isConnected: false,
      accountId: null,
      balance: null,
      walletType: null,
    });
    
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('kycStatus');
  }

  async autoConnect(): Promise<boolean> {
    try {
      // Check if already connected
      if (this.walletState.isConnected) {
        return true;
      }

      // Check if HashPack is available
      const isAvailable = await this.checkHashPackAvailability();
      if (!isAvailable) {
        return false;
      }

      // Try to connect
      await this.connectWallet();
      return true;
    } catch (error) {
      console.warn('Auto-connect failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const walletManager = WalletManager.getInstance();
export default walletManager;
