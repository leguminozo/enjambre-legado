/**
 * SumUp API Client
 * Documentación oficial: https://developer.sumup.com/api
 */

import {
  SumUpAuth,
  SumUpCheckout,
  CreateCheckoutParams,
  SumUpTransaction,
  ListTransactionsParams,
  SumUpCustomer,
  CreateCustomerParams,
  SumUpPayout,
  SumUpReceipt,
  SumUpResponse,
  PaginatedResponse,
} from './types';

const SUMUP_BASE_URL = 'https://api.sumup.com/v0.1';
const SUMUP_SANDBOX_URL = 'https://api.sumup-sandbox.com/v0.1';

export class SumUpClient {
  private apiKey: string;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor(apiKey: string, isSandbox = true) {
    this.apiKey = apiKey;
    this.isSandbox = isSandbox;
    this.baseUrl = isSandbox ? SUMUP_SANDBOX_URL : SUMUP_BASE_URL;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EIRL-PROPYME/1.0',
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<SumUpResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: 'API_ERROR',
            message: data.message || 'Error en la solicitud',
            details: data.details,
          },
        };
      }

      return { data: data as T };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Error de red',
        },
      };
    }
  }

  // ==================== Checkouts ====================

  async createCheckout(
    params: CreateCheckoutParams
  ): Promise<SumUpResponse<SumUpCheckout>> {
    return this.request<SumUpCheckout>('/checkouts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCheckout(checkoutId: string): Promise<SumUpResponse<SumUpCheckout>> {
    return this.request<SumUpCheckout>(`/checkouts/${checkoutId}`);
  }

  async listCheckouts(): Promise<SumUpResponse<PaginatedResponse<SumUpCheckout>>> {
    return this.request<PaginatedResponse<SumUpCheckout>>('/checkouts');
  }

  async deactivateCheckout(checkoutId: string): Promise<SumUpResponse<void>> {
    return this.request<void>(`/checkouts/${checkoutId}/deactivate`, {
      method: 'POST',
    });
  }

  // ==================== Transactions ====================

  async getTransaction(
    transactionId: string
  ): Promise<SumUpResponse<SumUpTransaction>> {
    return this.request<SumUpTransaction>(`/transactions/${transactionId}`);
  }

  async listTransactions(
    params?: ListTransactionsParams
  ): Promise<SumUpResponse<PaginatedResponse<SumUpTransaction>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<SumUpTransaction>>(endpoint);
  }

  async refundTransaction(
    transactionId: string,
    amount?: number
  ): Promise<SumUpResponse<SumUpTransaction>> {
    return this.request<SumUpTransaction>(`/transactions/${transactionId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // ==================== Customers ====================

  async createCustomer(
    params: CreateCustomerParams
  ): Promise<SumUpResponse<SumUpCustomer>> {
    return this.request<SumUpCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCustomer(customerId: string): Promise<SumUpResponse<SumUpCustomer>> {
    return this.request<SumUpCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(
    customerId: string,
    params: Partial<CreateCustomerParams>
  ): Promise<SumUpResponse<SumUpCustomer>> {
    return this.request<SumUpCustomer>(`/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  // ==================== Payouts ====================

  async listPayouts(): Promise<SumUpResponse<PaginatedResponse<SumUpPayout>>> {
    return this.request<PaginatedResponse<SumUpPayout>>('/payouts');
  }

  // ==================== Receipts ====================

  async getReceipt(receiptId: string): Promise<SumUpResponse<SumUpReceipt>> {
    return this.request<SumUpReceipt>(`/receipts/${receiptId}`);
  }

  // ==================== Health Check ====================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ==================== Factory ====================

export function createSumUpClient(): SumUpClient {
  const apiKey = process.env.SUMUP_API_KEY || '';
  const isSandbox = process.env.SUMUP_SANDBOX === 'true';

  if (!apiKey) {
    throw new Error('SUMUP_API_KEY no configurada en las variables de entorno');
  }

  return new SumUpClient(apiKey, isSandbox);
}
