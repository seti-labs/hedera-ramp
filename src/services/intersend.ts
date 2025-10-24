/**
 * Intersend API Service
 * Handles Intersend mobile money transactions for on-ramp and off-ramp
 */

import api from './api';

export interface IntersendOnRampRequest {
  amount: number;
  phone_number: string;
  crypto_amount?: string;
  account_reference?: string;
}

export interface IntersendOffRampRequest {
  amount: number;
  phone_number: string;
  crypto_amount?: string;
}

export interface IntersendOnRampResponse {
  message: string;
  transaction_id: number;
  intersend_transaction_id?: string;
  status: string;
  amount: number;
  crypto_amount: string;
  phone_number: string;
}

export interface IntersendOffRampResponse {
  message: string;
  transaction_id: number;
  intersend_transaction_id?: string;
  status: string;
  amount: number;
  crypto_amount: string;
  phone_number: string;
}

export interface IntersendTransactionStatus {
  transaction_id: number;
  status: string;
  amount: number;
  crypto_amount: string;
  phone_number: string;
  created_at: string;
  completed_at?: string;
}

export interface IntersendRates {
  KES_TO_HBAR: number;
  HBAR_TO_KES: number;
  last_updated: string;
  currency: string;
  provider: string;
}

export interface IntersendConfig {
  provider: string;
  supported_currencies: string[];
  min_amount: number;
  max_amount: number;
  phone_number_format: string;
  supported_countries: string[];
  features: {
    onramp: boolean;
    offramp: boolean;
    real_time_rates: boolean;
    instant_transfers: boolean;
  };
}

export const intersendAPI = {
  /**
   * Initiate Intersend on-ramp (buy crypto with mobile money)
   */
  initiateOnRamp: async (data: IntersendOnRampRequest): Promise<IntersendOnRampResponse> => {
    const response = await api.post<IntersendOnRampResponse>('/intersend/onramp/initiate', data);
    return response.data;
  },

  /**
   * Initiate Intersend off-ramp (sell crypto for mobile money)
   */
  initiateOffRamp: async (data: IntersendOffRampRequest): Promise<IntersendOffRampResponse> => {
    const response = await api.post<IntersendOffRampResponse>('/intersend/offramp/initiate', data);
    return response.data;
  },

  /**
   * Get Intersend transaction status
   */
  getTransactionStatus: async (transactionId: number): Promise<IntersendTransactionStatus> => {
    const response = await api.get<IntersendTransactionStatus>(`/intersend/status/${transactionId}`);
    return response.data;
  },

  /**
   * Get current Intersend exchange rates
   */
  getRates: async (): Promise<IntersendRates> => {
    const response = await api.get<IntersendRates>('/intersend/rates');
    return response.data;
  },

  /**
   * Get Intersend configuration
   */
  getConfig: async (): Promise<IntersendConfig> => {
    const response = await api.get<IntersendConfig>('/intersend/config');
    return response.data;
  },

  /**
   * Calculate crypto amount from KES
   */
  calculateCryptoAmount: async (kesAmount: number): Promise<number> => {
    const rates = await intersendAPI.getRates();
    return kesAmount * rates.KES_TO_HBAR;
  },

  /**
   * Calculate KES amount from crypto
   */
  calculateKESAmount: async (cryptoAmount: number): Promise<number> => {
    const rates = await intersendAPI.getRates();
    return cryptoAmount * rates.HBAR_TO_KES;
  },

  /**
   * Validate phone number format
   */
  validatePhoneNumber: (phone: string): boolean => {
    const regex = /^254\d{9}$/;
    return regex.test(phone);
  },

  /**
   * Format phone number (add 254 prefix if needed)
   */
  formatPhoneNumber: (phone: string): string => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 254, return as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }
    
    // If it's 9 digits, add 254 prefix
    if (cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    // Return as is if it doesn't match expected patterns
    return cleaned;
  },
};

export default intersendAPI;
