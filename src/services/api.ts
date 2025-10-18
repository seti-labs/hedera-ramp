/**
 * API Service for Hedera Ramp Hub
 * Provides typed API calls to the Flask backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://hedera-ramp-backend.herokuapp.com/api' 
    : 'http://localhost:5000/api'
  );

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('walletState');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  wallet_address: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  wallet_type: 'hashpack' | 'blade';
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_started';
  kyc_submitted_at?: string;
  kyc_verified_at?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface KYCStatus {
  kyc_status: string;
  kyc_submitted_at?: string;
  kyc_verified_at?: string;
  kyc_rejection_reason?: string;
  is_verified: boolean;
}

export interface Transaction {
  id: number;
  user_id: number;
  transaction_type: 'onramp' | 'offramp';
  amount: string;
  fiat_amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  hedera_transaction_id?: string;
  hedera_transaction_hash?: string;
  payment_method?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface UserData {
  id: number;
  user_id: number;
  key: string;
  value: any;
  data_type: string;
  category?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Authentication API
export const authAPI = {
  signup: async (data: {
    email: string;
    password: string;
    wallet_address: string;
    wallet_type: 'hashpack' | 'blade';
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  signin: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  signinWallet: async (data: { wallet_address: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signin/wallet', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.put('/auth/update-profile', data);
    return response.data;
  },

  changePassword: async (data: {
    old_password: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// KYC API
export const kycAPI = {
  getStatus: async (): Promise<KYCStatus> => {
    const response = await api.get<KYCStatus>('/kyc/status');
    return response.data;
  },

  submit: async (data: {
    document_type: string;
    document_number: string;
    document_country: string;
    file_path?: string;
    file_url?: string;
  }): Promise<{ message: string; kyc_status: string; document: any }> => {
    const response = await api.post('/kyc/submit', data);
    return response.data;
  },

  getDocuments: async (): Promise<{ documents: any[] }> => {
    const response = await api.get('/kyc/documents');
    return response.data;
  },

  resubmit: async (data: {
    document_type: string;
    document_number: string;
    document_country: string;
    file_path?: string;
    file_url?: string;
  }): Promise<{ message: string; kyc_status: string; document: any }> => {
    const response = await api.post('/kyc/resubmit', data);
    return response.data;
  },
};

// Transaction API
export const transactionAPI = {
  getAll: async (params?: {
    transaction_type?: 'onramp' | 'offramp';
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    total: number;
    count: number;
    limit: number;
    offset: number;
    transactions: Transaction[];
  }> => {
    const response = await api.get('/transactions/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<{ transaction: Transaction }> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: {
    transaction_type: 'onramp' | 'offramp';
    amount: string;
    fiat_amount: string;
    currency?: string;
    payment_method?: string;
    notes?: string;
    metadata?: any;
  }): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.post('/transactions/create', data);
    return response.data;
  },

  updateStatus: async (
    id: number,
    data: {
      status: string;
      hedera_transaction_id?: string;
      hedera_transaction_hash?: string;
    }
  ): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.put(`/transactions/${id}/status`, data);
    return response.data;
  },

  getStats: async (): Promise<{
    total_transactions: number;
    by_type: { onramp: number; offramp: number };
    by_status: any;
    recent_transactions: Transaction[];
  }> => {
    const response = await api.get('/transactions/stats');
    return response.data;
  },

  cancel: async (id: number): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.post(`/transactions/${id}/cancel`);
    return response.data;
  },
};

// User Data CRUD API
export const dataAPI = {
  getAll: async (params?: {
    category?: string;
    is_public?: boolean;
  }): Promise<{ count: number; data: UserData[] }> => {
    const response = await api.get('/data/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<{ data: UserData }> => {
    const response = await api.get(`/data/${id}`);
    return response.data;
  },

  getByKey: async (key: string): Promise<{ data: UserData }> => {
    const response = await api.get(`/data/key/${key}`);
    return response.data;
  },

  create: async (data: {
    key: string;
    value: any;
    category?: string;
    is_public?: boolean;
  }): Promise<{ message: string; data: UserData }> => {
    const response = await api.post('/data/', data);
    return response.data;
  },

  updateById: async (
    id: number,
    data: {
      value?: any;
      category?: string;
      is_public?: boolean;
    }
  ): Promise<{ message: string; data: UserData }> => {
    const response = await api.put(`/data/${id}`, data);
    return response.data;
  },

  updateByKey: async (
    key: string,
    data: {
      value?: any;
      category?: string;
      is_public?: boolean;
    }
  ): Promise<{ message: string; data: UserData }> => {
    const response = await api.put(`/data/key/${key}`, data);
    return response.data;
  },

  deleteById: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/data/${id}`);
    return response.data;
  },

  deleteByKey: async (key: string): Promise<{ message: string }> => {
    const response = await api.delete(`/data/key/${key}`);
    return response.data;
  },

  upsert: async (data: {
    key: string;
    value: any;
    category?: string;
    is_public?: boolean;
  }): Promise<{ message: string; data: UserData }> => {
    const response = await api.post('/data/upsert', data);
    return response.data;
  },

  bulkCreate: async (entries: Array<{
    key: string;
    value: any;
    category?: string;
    is_public?: boolean;
  }>): Promise<{ message: string; created: string[]; errors: any[] }> => {
    const response = await api.post('/data/bulk', { entries });
    return response.data;
  },
};

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem('refresh_token', token);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Export M-Pesa API
export { mpesaAPI } from './mpesa';

export default api;

