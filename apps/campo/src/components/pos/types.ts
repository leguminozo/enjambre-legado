export type CartLine = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  qr_codes?: string[];
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

import type {
  SumUpReaderStatus,
  SumUpReader,
  SumUpCheckoutStatus,
  SumUpCheckout,
} from '@enjambre/sumup';

export type {
  SumUpReaderStatus,
  SumUpReader,
  SumUpCheckoutStatus,
  SumUpCheckout,
};

export type TerminalFlowStep = 'idle' | 'selecting_reader' | 'sending_to_terminal' | 'waiting_payment' | 'paid' | 'failed' | 'expired' | 'cancelled';

export type TerminalFlowResult = {
  checkout_id: string;
  transaction_id?: string;
  status: SumUpCheckoutStatus;
};

export type SumupMode = 'connected' | 'manual';
