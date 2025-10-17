import { useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface APIResponse<T = any> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export const useAPI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const request = async <T = any>(
    endpoint: string,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> => {
    setIsLoading(true);
    try {
      // Get JWT token from localStorage (if implemented)
      const token = localStorage.getItem('authToken');
      
      const config: AxiosRequestConfig = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      };

      const response = await axios(`${API_BASE_URL}${endpoint}`, config);
      
      return {
        data: response.data,
        error: null,
        isLoading: false,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        data: null,
        error: errorMessage,
        isLoading: false,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Convenience methods
  const get = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' });

  const post = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', data });

  const put = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', data });

  const del = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' });

  return {
    request,
    get,
    post,
    put,
    delete: del,
    isLoading,
  };
};
