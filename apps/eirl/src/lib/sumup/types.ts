/**
 * SumUp API Types
 * Basado en: https://developer.sumup.com/api
 */

// ==================== Authentication ====================
export interface SumUpAuth {
  apiKey: string;
  baseUrl: string;
}

// ==================== Checkouts ====================
export interface SumUpCheckout {
  checkout_id: string;
  amount: number;
  currency: string;
  description: string;
  status: CheckoutStatus;
  checkout_url?: string;
  created_at?: string;
  expires_at?: string;
  metadata?: Record<string, string>;
}

export type CheckoutStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'EXPIRED';

export interface CreateCheckoutParams {
  amount: number;
  currency: string;
  description: string;
  return_url?: string;
  callback_url?: string;
  metadata?: {
    empresa_id?: string;
    factura_id?: string;
    tipo?: 'factura' | 'gasto' | 'servicio';
  };
}

// ==================== Transactions ====================
export interface SumUpTransaction {
  transaction_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  timestamp: string;
  description?: string;
  checkout?: {
    checkout_id: string;
    description: string;
  };
  card?: {
    brand: string;
    last4: string;
    expiry_date: string;
  };
  refund?: {
    refund_id: string;
    amount: number;
    status: string;
    created_at: string;
  };
}

export type TransactionStatus = 
  | 'SUCCESSFUL' 
  | 'FAILED' 
  | 'PENDING' 
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'APPLE_PAY' 
  | 'GOOGLE_PAY' 
  | 'CONTACTLESS';

export interface ListTransactionsParams {
  from?: string;
  to?: string;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

// ==================== Customers ====================
export interface SumUpCustomer {
  customer_id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  created_at?: string;
}

export interface CreateCustomerParams {
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

// ==================== Payouts ====================
export interface SumUpPayout {
  payout_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  expected_arrival_date: string;
  transactions_count: number;
  created_at: string;
}

export type PayoutStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'CANCELLED';

// ==================== Receipts ====================
export interface SumUpReceipt {
  receipt_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  pdf_url?: string;
  created_at: string;
}

// ==================== API Responses ====================
export interface SumUpResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
  total_count?: number;
}

// ==================== Webhooks ====================
export interface SumUpWebhookEvent {
  id: string;
  type: WebhookEventType;
  created_at: string;
  data: {
    checkout?: SumUpCheckout;
    transaction?: SumUpTransaction;
    payout?: SumUpPayout;
  };
}

export type WebhookEventType = 
  | 'checkout.created'
  | 'checkout.completed'
  | 'checkout.failed'
  | 'checkout.expired'
  | 'transaction.successful'
  | 'transaction.failed'
  | 'transaction.refunded'
  | 'payout.created'
  | 'payout.paid'
  | 'payout.failed';

// ==================== Conciliation ====================
export interface ConciliacionSumUp {
  empresaId: string;
  periodo: string;
  totalTransacciones: number;
  montoTotal: number;
  montoComisiones: number;
  montoNeto: number;
  transacciones: {
    transaction_id: string;
    amount: number;
    fee: number;
    net: number;
    status: string;
    timestamp: string;
    conciliated: boolean;
    facturaId?: string;
    thirdPartyId?: string;
  }[];
  diferencias: {
    tipo: 'falta_factura' | 'monto_no_coincide' | 'diferencia_comision';
    transactionId: string;
    expected?: number;
    actual?: number;
  }[];
}
