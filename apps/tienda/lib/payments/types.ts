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

const sessions = new Map<string, CheckoutSession>();
const SESSION_TTL_MS = 30 * 60 * 1000;

function sweepExpired() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(key);
    }
  }
}

export function saveCheckoutSession(session: CheckoutSession): void {
  sweepExpired();
  sessions.set(session.buyOrder, session);
}

export function getCheckoutSession(buyOrder: string): CheckoutSession | undefined {
  return sessions.get(buyOrder);
}

export function deleteCheckoutSession(buyOrder: string): void {
  sessions.delete(buyOrder);
}
