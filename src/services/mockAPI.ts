/**
 * Mock API service for development and demonstration
 */

import { mockStudentProfile, mockInvestments, mockInvestmentStats, mockPublicStats } from '@/utils/mockData';

// Mock delay to simulate API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockStudentAPI = {
  // Get student profile
  getProfile: async () => {
    await delay(500);
    return {
      student: mockStudentProfile,
      investments: mockInvestments
    };
  },

  // Register student
  register: async (data: any) => {
    await delay(1000);
    return {
      message: 'Student profile created successfully',
      student: mockStudentProfile
    };
  },

  // Get investments
  getInvestments: async () => {
    await delay(300);
    return {
      investments: mockInvestments,
      total_invested: mockInvestmentStats.total_invested,
      total_returns: mockInvestmentStats.total_returns
    };
  },

  // Create investment
  createInvestment: async (data: any) => {
    await delay(1000);
    const newInvestment = {
      id: mockInvestments.length + 1,
      student_id: 1,
      investment_type: data.investment_type,
      amount: data.amount,
      currency: data.currency || 'KES',
      lock_period_months: data.lock_period_months,
      lock_start_date: new Date().toISOString(),
      lock_end_date: new Date(Date.now() + data.lock_period_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_locked: true,
      expected_return_rate: data.investment_type === 'crypto' ? 0.08 : 0.05,
      actual_return: 0,
      status: 'active',
      withdrawal_requested_at: null,
      withdrawn_at: null,
      hedera_transaction_id: `0.0.1234567@${Date.now()}`,
      smart_contract_address: '0.0.9876543',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return {
      message: 'Investment created successfully',
      investment: newInvestment
    };
  },

  // Request withdrawal
  requestWithdrawal: async (investmentId: number) => {
    await delay(800);
    return {
      message: 'Withdrawal request submitted successfully',
      investment: mockInvestments.find(inv => inv.id === investmentId)
    };
  },

  // Get stats
  getStats: async () => {
    await delay(200);
    return mockInvestmentStats;
  }
};

export const mockPublicAPI = {
  // Get public stats
  getStats: async () => {
    await delay(300);
    return mockPublicStats;
  }
};

export const mockTransactionAPI = {
  // Get all transactions
  getAll: async (params: any = {}) => {
    await delay(400);
    return {
      transactions: mockInvestments.map(inv => ({
        id: inv.id,
        transaction_type: inv.investment_type,
        amount: inv.amount.toString(),
        currency: inv.currency,
        status: inv.status,
        created_at: inv.created_at,
        completed_at: inv.withdrawn_at,
        notes: `${inv.investment_type} investment - ${inv.lock_period_months} months`
      })),
      total: mockInvestments.length
    };
  },

  // Get transaction stats
  getStats: async () => {
    await delay(200);
    return {
      total_transactions: mockInvestments.length,
      completed_transactions: mockInvestments.filter(inv => inv.status === 'matured' || inv.status === 'withdrawn').length,
      total_volume: mockInvestmentStats.total_invested,
      total_returns: mockInvestmentStats.total_returns
    };
  }
};

export const mockIntersendAPI = {
  // Get rates
  getRates: async () => {
    await delay(200);
    return {
      KES_TO_HBAR: 0.000235,
      HBAR_TO_KES: 4255.32,
      last_updated: new Date().toISOString(),
      currency: 'KES',
      provider: 'Intersend'
    };
  }
};
