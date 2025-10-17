export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  balance: string | null;
  walletType: 'hashpack' | 'blade' | null;
}

export interface Transaction {
  id: string;
  type: 'onramp' | 'offramp';
  amount: string;
  fiatAmount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  transactionHash?: string;
}

export interface KYCStatus {
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'not_started';
  submittedAt?: string;
}
