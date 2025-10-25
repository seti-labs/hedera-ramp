/**
 * Mock data for development and demonstration purposes
 */

export const mockStudentProfile = {
  id: 1,
  user_id: 1,
  student_id: "2024/001",
  university: "University of Nairobi",
  major: "Computer Science",
  graduation_year: 2027,
  enrollment_status: "active",
  is_verified: true,
  verification_method: "email",
  verified_at: "2024-01-15T10:30:00Z",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:30:00Z"
};

export const mockInvestments = [
  {
    id: 1,
    student_id: 1,
    investment_type: "savings",
    amount: 50000,
    currency: "KES",
    lock_period_months: 36,
    lock_start_date: "2024-01-15T10:00:00Z",
    lock_end_date: "2027-01-15T10:00:00Z",
    is_locked: true,
    expected_return_rate: 0.05,
    actual_return: 2500,
    status: "active",
    withdrawal_requested_at: null,
    withdrawn_at: null,
    hedera_transaction_id: "0.0.1234567@1642248000.000000000",
    smart_contract_address: "0.0.9876543",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    student_id: 1,
    investment_type: "crypto",
    amount: 25000,
    currency: "KES",
    lock_period_months: 24,
    lock_start_date: "2024-02-01T09:00:00Z",
    lock_end_date: "2026-02-01T09:00:00Z",
    is_locked: true,
    expected_return_rate: 0.08,
    actual_return: 2000,
    status: "active",
    withdrawal_requested_at: null,
    withdrawn_at: null,
    hedera_transaction_id: "0.0.1234567@1642248000.000000001",
    smart_contract_address: "0.0.9876543",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-01T09:00:00Z"
  },
  {
    id: 3,
    student_id: 1,
    investment_type: "savings",
    amount: 10000,
    currency: "KES",
    lock_period_months: 12,
    lock_start_date: "2023-06-01T08:00:00Z",
    lock_end_date: "2024-06-01T08:00:00Z",
    is_locked: false,
    expected_return_rate: 0.05,
    actual_return: 500,
    status: "matured",
    withdrawal_requested_at: "2024-06-01T08:00:00Z",
    withdrawn_at: null,
    hedera_transaction_id: "0.0.1234567@1642248000.000000002",
    smart_contract_address: "0.0.9876543",
    created_at: "2023-06-01T08:00:00Z",
    updated_at: "2024-06-01T08:00:00Z"
  }
];

export const mockInvestmentStats = {
  total_invested: 85000,
  total_returns: 5000,
  active_investments: 2,
  locked_amount: 75000,
  available_for_withdrawal: 10500
};

export const mockPublicStats = {
  total_users: 1247,
  total_transactions: 3421,
  completed_transactions: 3156,
  total_volume_kes: 12500000,
  unique_wallets: 1247,
  onramp_count: 1892,
  offramp_count: 1264,
  recent_transactions: [
    {
      id: 1,
      amount: 25000,
      currency: "KES",
      type: "investment",
      status: "completed",
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      amount: 50000,
      currency: "KES", 
      type: "investment",
      status: "completed",
      created_at: "2024-01-14T15:30:00Z"
    },
    {
      id: 3,
      amount: 10000,
      currency: "KES",
      type: "withdrawal",
      status: "completed",
      created_at: "2024-01-13T09:15:00Z"
    }
  ],
  daily_activity: [
    { date: "2024-01-01", investments: 12, withdrawals: 3, volume: 250000 },
    { date: "2024-01-02", investments: 18, withdrawals: 5, volume: 380000 },
    { date: "2024-01-03", investments: 15, withdrawals: 2, volume: 320000 },
    { date: "2024-01-04", investments: 22, withdrawals: 7, volume: 450000 },
    { date: "2024-01-05", investments: 28, withdrawals: 4, volume: 520000 },
    { date: "2024-01-06", investments: 20, withdrawals: 6, volume: 410000 },
    { date: "2024-01-07", investments: 25, withdrawals: 8, volume: 480000 }
  ],
  last_updated: new Date().toISOString()
};

export const mockWalletState = {
  isConnected: true,
  accountId: "0.0.1234567",
  balance: "1250.50",
  walletType: "hashpack" as const
};

export const mockKycStatus = {
  status: "approved",
  submittedAt: "2024-01-10T10:00:00Z",
  approvedAt: "2024-01-12T14:30:00Z"
};
