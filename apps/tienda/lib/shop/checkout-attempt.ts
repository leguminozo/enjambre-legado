export const CHECKOUT_ATTEMPT_STORAGE_KEY = 'enj_checkout_attempt';

export type CheckoutAttemptFingerprintInput = {
  lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
  email: string;
  direccion: string;
  comuna: string;
  buyerMode?: string | null;
  courierCode?: string | null;
  puntosACanjear?: number;
  codigoDescuento?: string | null;
  codigoCreador?: string | null;
  retornoFrascosDeclarados?: number;
  tipoDte?: string | null;
};

/** Huella estable de la composición del pedido: si cambia, el intento es otro. */
export function buildCheckoutAttemptFingerprint(input: CheckoutAttemptFingerprintInput): string {
  const lines = input.lines
    .map((l) => `${l.productId}:${l.quantity}:${l.unitPrice}`)
    .sort((a, b) => a.localeCompare(b));
  return JSON.stringify({
    lines,
    email: input.email.trim().toLowerCase(),
    direccion: input.direccion.trim().toLowerCase(),
    comuna: input.comuna.trim().toLowerCase(),
    buyerMode: input.buyerMode ?? null,
    courierCode: input.courierCode ?? null,
    puntos: input.puntosACanjear ?? 0,
    descuento: input.codigoDescuento ?? null,
    creador: input.codigoCreador ?? null,
    frascos: input.retornoFrascosDeclarados ?? 0,
    tipoDte: input.tipoDte ?? null,
  });
}

export function newCheckoutAttemptKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getAttemptStorage(): Storage | null {
  try {
    return typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Clave de intento por pestaña: reutiliza la anterior mientras la composición
 * del pedido no cambie (reintentos y retornos del PSP), y la renueva si cambia.
 */
export function resolveCheckoutAttemptKey(fingerprint: string): string {
  const storage = getAttemptStorage();
  if (!storage) return newCheckoutAttemptKey();
  try {
    const raw = storage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { fingerprint?: string; key?: string };
      if (
        parsed.fingerprint === fingerprint &&
        typeof parsed.key === 'string' &&
        parsed.key.length >= 8
      ) {
        return parsed.key;
      }
    }
  } catch {
    // Storage ilegible o corrupto: se regenera la clave.
  }
  const key = newCheckoutAttemptKey();
  try {
    storage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, JSON.stringify({ fingerprint, key }));
  } catch {
    // Storage lleno o bloqueado: la clave igual se envía, solo no se persiste.
  }
  return key;
}
