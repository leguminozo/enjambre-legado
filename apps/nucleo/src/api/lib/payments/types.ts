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

export type BuyerMode = 'legado' | 'privada' | 'b2b';

export type BillingInfo = {
  tipoDte: 'boleta' | 'factura';
  rut?: string;
  razonSocial?: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
};

export type CheckoutSession = {
  buyOrder: string;
  sessionId: string;
  cart: CartLineInput[];
  total: number;
  provider: 'transbank' | 'flow';
  shipping: ShippingInfo | null;
  billing?: BillingInfo | null;
  courierCode: string;
  shippingCost: number;
  subtotal: number;
  discountCode?: string | null;
  discountClp?: number;
  discountId?: string | null;
  stockReserved?: boolean;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountClp: number;
  createdAt: number;
  buyerMode?: BuyerMode;
  clienteId?: string | null;
  organizacionId?: string | null;
  codigoCreador?: string | null;
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

/** Inscripción recurrente (Pago Automático). Solo Flow la implementa. */
export type RecurringCreateInput = {
  buyOrder: string;
  sessionId: string;
  firstAmount: number;
  recurringAmount: number;
  email: string;
  returnUrl: string;
  confirmationUrl: string;
  planName?: string;
  optional?: Record<string, unknown>;
};

export type RecurringCreateResult = {
  url: string;
  token: string;
};

export type RecurringChargeStatus = {
  status: number; // 2 = pagado
  commerceOrder: string;
  flowOrder: number;
  amount: number;
};

export type PaymentProviderWithRecurring = PaymentProvider & {
  createRecurring(input: RecurringCreateInput): Promise<RecurringCreateResult>;
  getRecurringStatus(token: string): Promise<RecurringChargeStatus>;
  /** Cancelar la inscripción en el proveedor. Puede no estar soportada. */
  cancelRecurring(buyOrder: string): Promise<{ ok: boolean; error?: string }>;
};

import { resolveCourierCode } from '@enjambre/logistica';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { fromLoose } from '@/api/lib/supabase-loose';

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
  buyer_mode: z.enum(['legado', 'privada', 'b2b']).optional(),
  cliente_id: z.string().uuid().nullable().optional(),
  organizacion_id: z.string().uuid().nullable().optional(),
  courier_code: z.string().optional(),
  shipping_cost: z.number().int().nonnegative().optional(),
  subtotal: z.number().int().nonnegative().optional(),
  loyalty_points_redeemed: z.number().int().nonnegative().optional(),
  loyalty_discount_clp: z.number().int().nonnegative().optional(),
  discount_code: z.string().nullable().optional(),
  discount_id: z.string().uuid().nullable().optional(),
  discount_clp: z.number().int().nonnegative().optional(),
  stock_reserved: z.boolean().optional(),
  codigo_creador: z.string().nullable().optional(),
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
    courierCode: resolveCourierCode(row.courier_code),
    shippingCost: row.shipping_cost ?? 0,
    subtotal: row.subtotal ?? row.total,
    loyaltyPointsRedeemed: row.loyalty_points_redeemed ?? 0,
    loyaltyDiscountClp: row.loyalty_discount_clp ?? 0,
    discountCode: row.discount_code ?? null,
    discountClp: row.discount_clp ?? 0,
    discountId: row.discount_id ?? null,
    stockReserved: row.stock_reserved ?? false,
    createdAt: new Date(row.created_at).getTime(),
    buyerMode: row.buyer_mode ?? 'legado',
    clienteId: row.cliente_id ?? null,
    organizacionId: row.organizacion_id ?? null,
    codigoCreador: row.codigo_creador ?? null,
  };
}

export async function saveCheckoutSession(session: CheckoutSession): Promise<void> {
  const admin = createAdminClient();
  // fromLoose: columna codigo_creador aún no está en el typegen local
  const { error } = await fromLoose(admin, 'checkout_sessions').insert({
    buy_order: session.buyOrder,
    session_id: session.sessionId,
    provider: session.provider,
    cart: session.cart,
    total: session.total,
    shipping: session.shipping,
    buyer_mode: session.buyerMode ?? 'legado',
    cliente_id: session.clienteId ?? null,
    organizacion_id: session.organizacionId ?? null,
    courier_code: session.courierCode,
    shipping_cost: session.shippingCost,
    subtotal: session.subtotal,
    loyalty_points_redeemed: session.loyaltyPointsRedeemed,
    loyalty_discount_clp: session.loyaltyDiscountClp,
    discount_code: session.discountCode ?? null,
    discount_id: session.discountId ?? null,
    discount_clp: session.discountClp ?? 0,
    codigo_creador: session.codigoCreador ?? null,
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

/**
 * Expire abandoned pending sessions and release stock holds.
 * TTL should match reserve_checkout_stock (default 30m).
 * Never expires a buy_order that already has a venta (paid / fulfill lag).
 */
export async function expireStaleCheckoutSessions(opts?: {
  olderThanMinutes?: number;
  limit?: number;
}): Promise<{ expired: number; buyOrders: string[]; skippedPaid: string[] }> {
  const admin = createAdminClient();
  const minutes = opts?.olderThanMinutes ?? 30;
  const limit = opts?.limit ?? 100;
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();

  // Always release holds past SQL TTL first
  await admin.rpc('release_expired_stock_holds');

  const { data: stale, error } = await admin
    .from('checkout_sessions')
    .select('buy_order')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to list stale sessions: ${error.message}`);
  const candidates = (stale ?? []).map((r) => r.buy_order as string);
  if (candidates.length === 0) {
    return { expired: 0, buyOrders: [], skippedPaid: [] };
  }

  // Protect paid orders: pending session + venta means fulfill incomplete, not abandon
  const { data: ventas } = await admin
    .from('ventas')
    .select('buy_order')
    .in('buy_order', candidates);

  const paidOrders = new Set(
    (ventas ?? [])
      .map((v) => v.buy_order as string | null)
      .filter((b): b is string => Boolean(b)),
  );

  const skippedPaid: string[] = [];
  const expired: string[] = [];

  for (const buyOrder of candidates) {
    if (paidOrders.has(buyOrder)) {
      skippedPaid.push(buyOrder);
      // Heal: complete session so ops list stays clean (venta already exists)
      await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
      await admin
        .from('checkout_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('buy_order', buyOrder)
        .eq('status', 'pending');
      continue;
    }

    await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
    await admin
      .from('checkout_sessions')
      .update({ status: 'expired', completed_at: new Date().toISOString() })
      .eq('buy_order', buyOrder)
      .eq('status', 'pending');
    expired.push(buyOrder);
  }

  return { expired: expired.length, buyOrders: expired, skippedPaid };
}
