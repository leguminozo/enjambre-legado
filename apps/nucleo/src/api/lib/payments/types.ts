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

export type PaymentProvider = {
  readonly name: 'transbank' | 'flow';
  init(buyOrder: string, sessionId: string, amount: number, returnUrl: string, email?: string): Promise<PaymentInitResult>;
  commit(token: string): Promise<PaymentCommitResult>;
  refund(buyOrder: string, amount: number): Promise<{ ok: boolean }>;
};

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
import { z } from 'zod';

const CheckoutSessionRowSchema = z.object({
  id: z.string(),
  buy_order: z.string(),
  session_id: z.string(),
  provider: z.enum(['transbank', 'flow']),
  cart: z.array(z.object({
    productId: z.string(),
    slug: z.string(),
    name: z.string(),
    unitPrice: z.number(),
    quantity: z.number(),
  })),
  total: z.number(),
  shipping: z.union([
    z.object({
      nombre: z.string(),
      email: z.string(),
      telefono: z.string(),
      direccion: z.string(),
      comuna: z.string(),
      ciudad: z.string(),
      region: z.string(),
      codigoPostal: z.string().optional(),
      instrucciones: z.string().optional(),
    }),
    z.null(),
  ]),
  status: z.enum(['pending', 'completed', 'expired']),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

type CheckoutSessionRow = z.infer<typeof CheckoutSessionRowSchema>;

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
  const parsed = CheckoutSessionRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error('[checkout] session row schema mismatch:', parsed.error.flatten());
    return undefined;
  }
  return toCheckoutSession(parsed.data);
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
