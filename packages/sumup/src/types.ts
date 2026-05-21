import { z } from "zod";

export type SumUpCurrency =
  | "BGN" | "BRL" | "CHF" | "CLP" | "COP" | "CZK" | "DKK"
  | "EUR" | "GBP" | "HRK" | "HUF" | "NOK" | "PLN" | "RON"
  | "SEK" | "USD";

export type TransactionStatus =
  | "SUCCESSFUL" | "CANCELLED" | "FAILED" | "PENDING" | "REFUNDED";

export type SimpleStatus =
  | "SUCCESSFUL" | "PAID_OUT" | "CANCEL_FAILED" | "CANCELLED"
  | "CHARGEBACK" | "FAILED" | "REFUND_FAILED" | "REFUNDED"
  | "NON_COLLECTION" | "PENDING";

export type PaymentType =
  | "CASH" | "POS" | "ECOM" | "RECURRING" | "BITCOIN"
  | "BALANCE" | "MOTO" | "BOLETO" | "DIRECT_DEBIT" | "APM" | "UNKNOWN";

export type EntryMode =
  | "CHIP" | "MANUAL_ENTRY" | "CUSTOMER_ENTRY" | "MAGSTRIPE"
  | "MAGSTRIPE_FALLBACK" | "CONTACTLESS" | "CONTACTLESS_MAGSTRIPE"
  | "APPLE_PAY" | "GOOGLE_PAY" | "PAYPAL" | "NONE" | "N/A";

export type CardType =
  | "VISA" | "MASTERCARD" | "AMEX" | "DINERS" | "DISCOVER"
  | "JCB" | "MAESTRO" | "VISA_ELECTRON" | "UNKNOWN";

export type PayoutType = "BANK_ACCOUNT" | "PREPAID_CARD";

export type FinancialPayoutType =
  | "PAYOUT" | "CHARGE_BACK_DEDUCTION" | "REFUND_DEDUCTION"
  | "DD_RETURN_DEDUCTION" | "BALANCE_DEDUCTION";

export interface SumUpAuthConfig {
  apiKey: string;
  merchantCode: string;
  environment: "live" | "test";
}

export interface SumUpTransaction {
  id: string;
  transaction_code: string;
  amount: number;
  currency: SumUpCurrency;
  timestamp: string;
  status: TransactionStatus;
  payment_type: PaymentType;
  installments_count?: number;
  merchant_code: string;
  vat_amount?: number;
  tip_amount?: number;
  entry_mode?: EntryMode;
  auth_code?: string;
  product_summary?: string;
  payouts_total?: number;
  payouts_received?: number;
  payout_plan?: "SINGLE_PAYMENT" | "TRUE_INSTALLMENT" | "ACCELERATED_INSTALLMENT";
  foreign_transaction_id?: string;
  client_transaction_id?: string;
  username?: string;
  fee_amount?: number;
  simple_status?: SimpleStatus;
  payout_date?: string;
  payout_type?: PayoutType;
  card?: {
    last_4_digits: string;
    type: CardType;
  };
  device_info?: {
    name: string;
    system_name: string;
    model: string;
    system_version: string;
    uuid: string;
  };
  products?: Array<{
    name: string;
    price: number;
    quantity: number;
    total_price: number;
    vat_rate?: number;
    vat_amount?: number;
  }>;
  vat_rates?: Array<{
    rate: number;
    net: number;
    vat: number;
    gross: number;
  }>;
  transaction_events?: Array<{
    id: string;
    event_type: "PAYOUT" | "CHARGE_BACK" | "REFUND" | "PAYOUT_DEDUCTION";
    status: "FAILED" | "PAID_OUT" | "PENDING" | "RECONCILED" | "REFUNDED" | "SCHEDULED" | "SUCCESSFUL";
    amount: number;
    due_date?: string;
    date?: string;
    installment_number?: number;
    timestamp: string;
  }>;
  events?: Array<{
    id: string;
    transaction_id: string;
    type: "PAYOUT" | "CHARGE_BACK" | "REFUND" | "PAYOUT_DEDUCTION";
    status: "FAILED" | "PAID_OUT" | "PENDING" | "RECONCILED" | "REFUNDED" | "SCHEDULED" | "SUCCESSFUL";
    amount: number;
    timestamp: string;
    fee_amount?: number;
    installment_number?: number;
    deducted_amount?: number;
    deducted_fee_amount?: number;
  }>;
  location?: {
    lat: number;
    lon: number;
    horizontal_accuracy?: number;
  };
  local_time?: string;
  process_as?: "CREDIT" | "DEBIT";
  tax_enabled?: boolean;
  links?: Array<{
    rel: string;
    href: string;
    type?: string;
  }>;
}

export interface SumUpTransactionHistoryItem {
  id: string;
  transaction_code: string;
  amount: number;
  currency: SumUpCurrency;
  timestamp: string;
  status: TransactionStatus;
  payment_type: PaymentType;
  installments_count?: number;
  product_summary?: string;
  payouts_total?: number;
  payouts_received?: number;
  payout_plan?: string;
  transaction_id: string;
  client_transaction_id?: string;
  user?: string;
  type: "PAYMENT" | "REFUND" | "CHARGE_BACK";
  card_type?: CardType;
  payout_date?: string;
  payout_type?: PayoutType;
  refunded_amount?: number;
}

export interface SumUpTransactionHistoryResponse {
  items: SumUpTransactionHistoryItem[];
  links: Array<{
    rel: string;
    href: string;
  }>;
}

export interface SumUpFinancialPayout {
  id: number;
  type: FinancialPayoutType;
  amount: number;
  date: string;
  currency: string;
  fee: number;
  status: "SUCCESSFUL" | "FAILED";
  reference: string;
  transaction_code: string;
}

export interface SumUpCheckout {
  id: string;
  amount: number;
  currency: SumUpCurrency;
  checkout_reference: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  payment_type?: PaymentType;
  description?: string;
  created_at: string;
  valid_until?: string;
  transactions?: SumUpTransaction[];
  return_url?: string;
  redirect_url?: string;
}

export interface SumUpReader {
  id: string;
  name: string;
  serial_number: string;
  device_id: string;
  status: "online" | "offline" | "busy" | "error";
  paired_at: string;
  last_seen_at?: string;
}

export interface SumUpMerchant {
  merchant_code: string;
  company_name: string;
  country: string;
  currency: SumUpCurrency;
}

export interface SumUpApiError {
  code: string;
  message: string;
  status?: number;
  detail?: string;
  type?: string;
}

export type SumUpResult<T> =
  | { success: true; data: T }
  | { success: false; error: SumUpApiError };

export interface ListTransactionsOptions {
  transaction_code?: string;
  order?: "ascending" | "descending";
  limit?: number;
  users?: string[];
  statuses?: TransactionStatus[];
  payment_types?: PaymentType[];
  entry_modes?: EntryMode[];
  types?: Array<"PAYMENT" | "REFUND" | "CHARGE_BACK">;
  changes_since?: string;
  newest_time?: string;
  newest_ref?: string;
  oldest_time?: string;
  oldest_ref?: string;
}

export interface ListPayoutsOptions {
  start_date: string;
  end_date: string;
  format?: "json" | "csv";
  limit?: number;
  order?: "asc" | "desc";
}

export const CreateCheckoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["CLP", "USD", "EUR", "GBP", "BRL", "CHF", "COP", "CZK", "DKK", "BGN", "HRK", "HUF", "NOK", "PLN", "RON", "SEK"]),
  checkout_reference: z.string().min(1),
  description: z.string().optional(),
  return_url: z.string().url().optional(),
  redirect_url: z.string().url().optional(),
  valid_until: z.string().datetime().optional(),
});

export const RefundTransactionSchema = z.object({
  amount: z.number().positive().optional(),
});
