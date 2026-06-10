export type CartLine = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

export type VentaOrigen = 'feria' | 'local';

export type VentaChannel = 'feria' | 'delivery' | 'local' | 'corporativo' | 'web' | 'referido';

export type PaymentMethod = 'efectivo' | 'debito' | 'transferencia' | 'tarjeta_pos';

export type ClienteLookup = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  purchase_count: number;
};

export type SumUpReaderStatus = 'online' | 'offline' | 'busy' | 'error';

export type SumUpReader = {
  id: string;
  name: string;
  serial_number: string;
  device_id: string;
  status: SumUpReaderStatus;
  paired_at: string;
  last_seen_at?: string;
};

export type SumUpCheckoutStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export type SumUpCheckout = {
  id: string;
  amount: number;
  currency: string;
  checkout_reference: string;
  status: SumUpCheckoutStatus;
  payment_type?: string;
  description?: string;
  transactions?: Array<{
    id: string;
    transaction_code: string;
    amount: number;
    status: string;
  }>;
};

export type TerminalFlowStep = 'idle' | 'selecting_reader' | 'sending_to_terminal' | 'waiting_payment' | 'paid' | 'failed' | 'expired' | 'cancelled';

export type TerminalFlowResult = {
  checkout_id: string;
  transaction_id?: string;
  status: SumUpCheckoutStatus;
};
