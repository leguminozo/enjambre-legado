export type CartLineInput = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type ShippingInfo = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigoPostal?: string;
  instrucciones?: string;
};

export type CheckoutSession = {
  buyOrder: string;
  sessionId: string;
  cart: CartLineInput[];
  total: number;
  provider: 'transbank' | 'flow';
  shipping: ShippingInfo | null;
  createdAt: number;
};

export type PaymentInitResult = {
  url: string;
  token: string;
  buyOrder: string;
  sessionId: string;
  provider: 'transbank' | 'flow';
};

export type PaymentCommitResult = {
  authorized: boolean;
  buyOrder: string;
  authorizationCode: string;
  cardType: string;
  last4: string;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: 'transbank' | 'flow';
  init(buyOrder: string, sessionId: string, amount: number, returnUrl: string, email?: string): Promise<PaymentInitResult>;
  commit(token: string): Promise<PaymentCommitResult>;
  refund(buyOrder: string, amount: number): Promise<{ ok: boolean }>;
}

import { createAdminClient } from '@/utils/supabase/admin';

type CheckoutSessionRow = {
  id: string;
  buy_order: string;
  session_id: string;
  provider: 'transbank' | 'flow';
  cart: CartLineInput[];
  total: number;
  shipping: ShippingInfo | null;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  completed_at: string | null;
};

function toCheckoutSession(row: CheckoutSessionRow): CheckoutSession {
  return {
    buyOrder: row.buy_order,
    sessionId: row.session_id,
    provider: row.provider,
    cart: row.cart,
    total: row.total,
    shipping: row.shipping,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function saveCheckoutSession(session: CheckoutSession): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('checkout_sessions').insert({
    buy_order: session.buyOrder,
    session_id: session.sessionId,
    provider: session.provider,
    cart: session.cart,
    total: session.total,
    shipping: session.shipping,
  });
  if (error) throw new Error(`Failed to save checkout session: ${error.message}`);
}

export async function getCheckoutSession(buyOrder: string): Promise<CheckoutSession | undefined> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('checkout_sessions')
    .select('*')
    .eq('buy_order', buyOrder)
    .eq('status', 'pending')
    .single();

  if (error || !data) return undefined;
  return toCheckoutSession(data as unknown as CheckoutSessionRow);
}

export async function completeCheckoutSession(buyOrder: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('checkout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('buy_order', buyOrder)
    .eq('status', 'pending');
  if (error) throw new Error(`Failed to complete checkout session: ${error.message}`);
}
