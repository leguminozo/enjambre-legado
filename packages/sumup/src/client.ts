import {
  CreateCheckoutSchema,
  RefundTransactionSchema,
  type SumUpAuthConfig,
  type SumUpResult,
  type SumUpTransaction,
  type SumUpTransactionHistoryResponse,
  type SumUpFinancialPayout,
  type SumUpCheckout,
  type SumUpReader,
  type SumUpMerchant,
  type ListTransactionsOptions,
  type ListPayoutsOptions,
} from "./types";

export class SumUpClient {
  private baseUrl: string;
  private apiKey: string;
  private merchantCode: string;

  constructor(config: SumUpAuthConfig) {
    this.apiKey = config.apiKey;
    this.merchantCode = config.merchantCode;
    this.baseUrl = "https://api.sumup.com";
  }

  private getHeaders(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/problem+json, application/json",
    };
  }

  private handleError(status: number, body: unknown): SumUpResult<never> {
    const problem = body as Record<string, unknown>;
    return {
      success: false,
      error: {
        code: String(problem.error_code ?? problem.code ?? "API_ERROR"),
        message: String(problem.message ?? problem.detail ?? problem.title ?? "SumUp API error"),
        status,
        detail: problem.detail ? String(problem.detail) : undefined,
        type: problem.type ? String(problem.type) : undefined,
      },
    };
  }

  private async request<T>(path: string, options?: RequestInit): Promise<SumUpResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options?.headers ?? {}),
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unknown error" }));
        return this.handleError(response.status, body);
      }

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return { success: true, data: undefined as unknown as T };
      }

      const data = await response.json();
      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async getTransaction(
    params: { id?: string; transaction_code?: string; foreign_transaction_id?: string; client_transaction_id?: string }
  ): Promise<SumUpResult<SumUpTransaction>> {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.set("id", params.id);
    if (params.transaction_code) searchParams.set("transaction_code", params.transaction_code);
    if (params.foreign_transaction_id) searchParams.set("foreign_transaction_id", params.foreign_transaction_id);
    if (params.client_transaction_id) searchParams.set("client_transaction_id", params.client_transaction_id);

    return this.request<SumUpTransaction>(
      `/v2.1/merchants/${this.merchantCode}/transactions?${searchParams}`
    );
  }

  async listTransactions(options?: ListTransactionsOptions): Promise<SumUpResult<SumUpTransactionHistoryResponse>> {
    const params = new URLSearchParams();
    if (options?.transaction_code) params.set("transaction_code", options.transaction_code);
    if (options?.order) params.set("order", options.order);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.newest_time) params.set("newest_time", options.newest_time);
    if (options?.oldest_time) params.set("oldest_time", options.oldest_time);
    if (options?.changes_since) params.set("changes_since", options.changes_since);
    if (options?.newest_ref) params.set("newest_ref", options.newest_ref);
    if (options?.oldest_ref) params.set("oldest_ref", options.oldest_ref);
    options?.statuses?.forEach((s) => params.append("statuses[]", s));
    options?.payment_types?.forEach((pt) => params.append("payment_types[]", pt));
    options?.entry_modes?.forEach((em) => params.append("entry_modes[]", em));
    options?.types?.forEach((t) => params.append("types[]", t));
    options?.users?.forEach((u) => params.append("users[]", u));

    return this.request<SumUpTransactionHistoryResponse>(
      `/v2.1/merchants/${this.merchantCode}/transactions/history?${params}`
    );
  }

  async refundTransaction(transactionId: string, amount?: number): Promise<SumUpResult<void>> {
    const body = amount !== undefined ? { amount } : undefined;
    if (body) {
      const parsed = RefundTransactionSchema.safeParse(body);
      if (!parsed.success) {
        return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") } };
      }
    }
    return this.request<void>(
      `/v1.0/merchants/${this.merchantCode}/payments/${transactionId}/refunds`,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }
    );
  }

  async listPayouts(options: ListPayoutsOptions): Promise<SumUpResult<SumUpFinancialPayout[]>> {
    const params = new URLSearchParams();
    params.set("start_date", options.start_date);
    params.set("end_date", options.end_date);
    if (options.format) params.set("format", options.format);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.order) params.set("order", options.order);

    return this.request<SumUpFinancialPayout[]>(
      `/v1.0/merchants/${this.merchantCode}/payouts?${params}`
    );
  }

  async listCheckouts(): Promise<SumUpResult<SumUpCheckout[]>> {
    return this.request<SumUpCheckout[]>(`/v0.1/checkouts`);
  }

  async createCheckout(data: {
    amount: number;
    currency: string;
    checkout_reference: string;
    description?: string;
    return_url?: string;
    redirect_url?: string;
    valid_until?: string;
  }): Promise<SumUpResult<SumUpCheckout>> {
    const parsed = CreateCheckoutSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") } };
    }
    return this.request<SumUpCheckout>(`/v0.1/checkouts`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
  }

  async getCheckout(checkoutId: string): Promise<SumUpResult<SumUpCheckout>> {
    return this.request<SumUpCheckout>(`/v0.1/checkouts/${checkoutId}`);
  }

  async processCheckout(checkoutId: string, data: {
    payment_type: string;
    card?: { name: string; number: string; expiry_month: string; expiry_year: string; cvv: string };
  }): Promise<SumUpResult<SumUpCheckout>> {
    return this.request<SumUpCheckout>(`/v0.1/checkouts/${checkoutId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deactivateCheckout(checkoutId: string): Promise<SumUpResult<void>> {
    return this.request<void>(`/v0.1/checkouts/${checkoutId}`, {
      method: "DELETE",
    });
  }

  async listReaders(): Promise<SumUpResult<SumUpReader[]>> {
    return this.request<SumUpReader[]>(`/v0.1/readers`);
  }

  async createReaderCheckout(readerId: string, data: {
    amount: number;
    currency: string;
    checkout_reference: string;
    description?: string;
  }): Promise<SumUpResult<{ checkout_id: string }>> {
    return this.request<{ checkout_id: string }>(
      `/v0.1/readers/${readerId}/checkout`,
      { method: "POST", body: JSON.stringify(data) }
    );
  }

  async terminateReaderCheckout(readerId: string): Promise<SumUpResult<void>> {
    return this.request<void>(
      `/v0.1/readers/${readerId}/checkout`,
      { method: "DELETE" }
    );
  }

  async getMerchant(): Promise<SumUpResult<SumUpMerchant>> {
    return this.request<SumUpMerchant>(`/v0.1/merchants/${this.merchantCode}`);
  }
}
