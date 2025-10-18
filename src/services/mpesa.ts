/**
 * M-Pesa API Service
 * Handles M-Pesa mobile money transactions for on-ramp and off-ramp
 */

import api from './api';

export interface MPesaOnRampRequest {
  amount: number;
  phone_number: string;
  crypto_amount?: string;
  account_reference?: string;
}

export interface MPesaOffRampRequest {
  amount: number;
  phone_number: string;
  crypto_amount: string;
  notes?: string;
}

export interface MPesaOnRampResponse {
  message: string;
  transaction_id: number;
  checkout_request_id: string;
  merchant_request_id: string;
  amount: number;
  currency: string;
}

export interface MPesaOffRampResponse {
  message: string;
  transaction_id: number;
  conversation_id: string;
  amount: number;
  currency: string;
  phone_number: string;
}

export interface MPesaTransactionStatus {
  transaction_id: number;
  status: string;
  transaction_type: string;
  amount: string;
  currency: string;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export interface MPesaRates {
  KES_TO_HBAR: number;
  HBAR_TO_KES: number;
  last_updated: string;
  currency: string;
}

export interface MPesaConfig {
  enabled: boolean;
  currency: string;
  min_onramp_amount: number;
  max_onramp_amount: number;
  min_offramp_amount: number;
  max_offramp_amount: number;
  phone_number_format: string;
  supported_countries: string[];
}

export const mpesaAPI = {
  /**
   * Initiate M-Pesa on-ramp (buy crypto with M-Pesa)
   */
  initiateOnRamp: async (data: MPesaOnRampRequest): Promise<MPesaOnRampResponse> => {
    const response = await api.post<MPesaOnRampResponse>('/mpesa/onramp/initiate', data);
    return response.data;
  },

  /**
   * Initiate M-Pesa off-ramp (sell crypto for M-Pesa)
   */
  initiateOffRamp: async (data: MPesaOffRampRequest): Promise<MPesaOffRampResponse> => {
    const response = await api.post<MPesaOffRampResponse>('/mpesa/offramp/initiate', data);
    return response.data;
  },

  /**
   * Get M-Pesa transaction status
   */
  getTransactionStatus: async (transactionId: number): Promise<MPesaTransactionStatus> => {
    const response = await api.get<MPesaTransactionStatus>(`/mpesa/status/${transactionId}`);
    return response.data;
  },

  /**
   * Get current M-Pesa exchange rates
   */
  getRates: async (): Promise<MPesaRates> => {
    const response = await api.get<MPesaRates>('/mpesa/rates');
    return response.data;
  },

  /**
   * Get M-Pesa configuration
   */
  getConfig: async (): Promise<MPesaConfig> => {
    const response = await api.get<MPesaConfig>('/mpesa/config');
    return response.data;
  },

  /**
   * Calculate crypto amount from KES
   */
  calculateCryptoAmount: async (kesAmount: number): Promise<number> => {
    const rates = await mpesaAPI.getRates();
    return kesAmount * rates.KES_TO_HBAR;
  },

  /**
   * Calculate KES amount from crypto
   */
  calculateKESAmount: async (cryptoAmount: number): Promise<number> => {
    const rates = await mpesaAPI.getRates();
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
    // Remove any spaces or special characters
    phone = phone.replace(/[^0-9]/g, '');
    
    // If starts with 0, replace with 254
    if (phone.startsWith('0')) {
      return '254' + phone.substring(1);
    }
    
    // If starts with +254, remove +
    if (phone.startsWith('254')) {
      return phone;
    }
    
    // If just 9 digits, add 254
    if (phone.length === 9) {
      return '254' + phone;
    }
    
    return phone;
  },
};

export default mpesaAPI;

