import type { SupabaseClient } from '@supabase/supabase-js';

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
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    fbclid?: string;
    gclid?: string;
  };
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
  retornoFrascosDeclarados?: number;
  status?: 'pending' | 'completed' | 'expired';
  attemptKey?: string | null;
  pspUrl?: string | null;
  pspToken?: string | null;
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
import { createAdminClient } from '@enjambre/auth/server-index';
import { fromLoose } from '@/api/lib/supabase-loose';
import { z } from 'zod';

const BillingInfoSchema = z.object({
  tipoDte: z.enum(['boleta', 'factura']),
  rut: z.string().optional(),
  razonSocial: z.string().optional(),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  comuna: z.string().optional(),
});

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
  billing: BillingInfoSchema.nullable().optional(),
  retorno_frascos_declarados: z.number().int().nonnegative().optional(),
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
    billing: row.billing ?? null,
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
    retornoFrascosDeclarados: row.retorno_frascos_declarados ?? 0,
    status: row.status,
  };
}

export async function saveCheckoutSession(session: CheckoutSession): Promise<void> {
  const admin = createAdminClient({ persistSession: false });
  // fromLoose: columna codigo_creador aún no está en el typegen local
  const payload: Record<string, unknown> = {
    buy_order: session.buyOrder,
    session_id: session.sessionId,
    provider: session.provider,
    cart: session.cart,
    total: session.total,
    shipping: session.shipping,
    billing: session.billing ?? null,
    retorno_frascos_declarados: session.retornoFrascosDeclarados ?? 0,
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
    attempt_key: session.attemptKey ?? null,
    psp_url: session.pspUrl ?? null,
    psp_token: session.pspToken ?? null,
  };

  let { error } = await fromLoose(admin, 'checkout_sessions').insert(payload);
  if (error && error.message.includes('attempt_key')) {
    delete payload.attempt_key;
    delete payload.psp_url;
    delete payload.psp_token;
    const retry = await fromLoose(admin, 'checkout_sessions').insert(payload);
    error = retry.error;
  }
  if (error) throw new Error(`Failed to save checkout session: ${error.message}`);
}

export async function getCheckoutSessionByBuyOrder(
  buyOrder: string,
): Promise<CheckoutSession | undefined> {
  const admin = createAdminClient({ persistSession: false });
  const { data, error } = await admin
    .from('checkout_sessions')
    .select('*')
    .eq('buy_order', buyOrder)
    .maybeSingle();

  if (error || !data) return undefined;
  const parsed = CheckoutSessionRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error('[checkout] session row schema mismatch:', parsed.error.flatten());
    return undefined;
  }
  return toCheckoutSession(parsed.data);
}

/** Sesión pendiente para iniciar/retomar un pago. Ops y conciliación usan la de cualquier estado. */
export async function getCheckoutSession(buyOrder: string): Promise<CheckoutSession | undefined> {
  const session = await getCheckoutSessionByBuyOrder(buyOrder);
  return session?.status === 'pending' ? session : undefined;
}

export async function completeCheckoutSession(
  buyOrder: string,
  adminClient?: SupabaseClient,
): Promise<void> {
  const admin = adminClient ?? createAdminClient({ persistSession: false });
  const { error } = await admin
    .from('checkout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('buy_order', buyOrder);
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
  const admin = createAdminClient({ persistSession: false });
  const minutes = opts?.olderThanMinutes ?? 30;
  const limit = opts?.limit ?? 100;
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();

  // Always release holds past SQL TTL first
  await admin.rpc('release_expired_stock_holds');

  const { data: stale, error } = await admin
    .from('checkout_sessions')
    .select('buy_order')
    .eq('status', 'pending')
    .is('fulfillment_started_at', null)
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
        .eq('status', 'pending')
        .is('fulfillment_started_at', null);
      continue;
    }

    await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
    await admin
      .from('checkout_sessions')
      .update({ status: 'expired', completed_at: new Date().toISOString() })
      .eq('buy_order', buyOrder)
      .eq('status', 'pending')
      .is('fulfillment_started_at', null);
    expired.push(buyOrder);
  }

  return { expired: expired.length, buyOrders: expired, skippedPaid };
}

export const CHECKOUT_ATTEMPT_REPLAY_WINDOW_MS = 15 * 60_000;

export type CheckoutAttemptReplay = {
  buyOrder: string;
  sessionId: string;
  provider: 'transbank' | 'flow';
  total: number;
  subtotal: number;
  shippingCost: number;
  discountClp: number;
  discountCode: string | null;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountClp: number;
  buyerMode: BuyerMode;
  url: string;
  token: string;
};

export type CheckoutAttemptLookup =
  | { kind: 'none' }
  | { kind: 'replay'; replay: CheckoutAttemptReplay }
  | { kind: 'conflict' }
  | { kind: 'stale'; buyOrder: string };

/**
 * Idempotencia de init: sesión ligada a la clave de intento del cliente.
 * Solo reanuda sesiones pending, frescas, con redirección PSP almacenada y del
 * mismo comprador (o ambos invitados); cualquier otro caso se trata como nuevo
 * intento (stale) o como clave ajena (conflict).
 */
export async function lookupCheckoutAttempt(
  attemptKey: string,
  clienteId: string | null,
): Promise<CheckoutAttemptLookup> {
  const admin = createAdminClient({ persistSession: false });
  const { data, error } = await fromLoose(admin, 'checkout_sessions')
    .select(
      'buy_order, session_id, provider, total, subtotal, shipping_cost, discount_clp, discount_code, loyalty_points_redeemed, loyalty_discount_clp, status, created_at, cliente_id, buyer_mode, psp_url, psp_token',
    )
    .eq('attempt_key', attemptKey)
    .maybeSingle();

  if (error || !data) return { kind: 'none' };

  const row = data as Record<string, unknown>;
  const rowClienteId = (row.cliente_id as string | null) ?? null;
  if (rowClienteId !== (clienteId ?? null)) return { kind: 'conflict' };

  const url = (row.psp_url as string | null) ?? null;
  const token = (row.psp_token as string | null) ?? null;
  const createdAt = new Date(row.created_at as string).getTime();
  const fresh = Date.now() - createdAt < CHECKOUT_ATTEMPT_REPLAY_WINDOW_MS;

  if (row.status === 'pending' && fresh && url && token) {
    return {
      kind: 'replay',
      replay: {
        buyOrder: row.buy_order as string,
        sessionId: row.session_id as string,
        provider: row.provider as 'transbank' | 'flow',
        total: Number(row.total),
        subtotal: Number(row.subtotal ?? row.total),
        shippingCost: Number(row.shipping_cost ?? 0),
        discountClp: Number(row.discount_clp ?? 0),
        discountCode: (row.discount_code as string | null) ?? null,
        loyaltyPointsRedeemed: Number(row.loyalty_points_redeemed ?? 0),
        loyaltyDiscountClp: Number(row.loyalty_discount_clp ?? 0),
        buyerMode: (row.buyer_mode as BuyerMode | null) ?? 'legado',
        url,
        token,
      },
    };
  }

  return { kind: 'stale', buyOrder: row.buy_order as string };
}

/** Libera la clave de intento de una sesión vencida para poder reusarla en un intento nuevo. */
export async function detachCheckoutAttemptKey(buyOrder: string): Promise<void> {
  const admin = createAdminClient({ persistSession: false });
  const { error } = await fromLoose(admin, 'checkout_sessions')
    .update({ attempt_key: null })
    .eq('buy_order', buyOrder);
  if (error && !error.message.includes('attempt_key')) {
    throw new Error(`Failed to detach checkout attempt: ${error.message}`);
  }
}
