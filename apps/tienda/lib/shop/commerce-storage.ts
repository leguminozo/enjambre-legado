/** Claves sessionStorage / localStorage del comercio (una sola fuente). */

export const PENDING_CHECKOUT_STORAGE_KEY = 'oyz_pending_checkout';
export const PENDING_SUBSCRIPTION_STORAGE_KEY = 'oyz_pending_subscription';
export const REPLENISHMENT_ADDRESS_STORAGE_KEY = 'oyz_replenishment_address';
export const CART_STORAGE_KEY = 'oyz_tienda_cart_v1';
export const SHIPPING_REGION_STORAGE_KEY = 'oyz_shipping_region';
export const CHECKOUT_SUCCESS_META_KEY = 'oyz_checkout_success_meta';
export const RESENA_CLAIM_TOKEN_KEY = 'oyz_resena_claim_token';
/** Código de embajador/creador capturado desde ?ref= o ?codigo= (session). */
export const CREATOR_REF_CODE_KEY = 'oyz_creator_ref_code';
/** Código de descuento o promoción capturado desde ?descuento=, ?cupon= o ?promo= */
export const PROMO_DISCOUNT_CODE_KEY = 'oyz_promo_discount_code';
/**
 * Snapshot del checkout para el evento Purchase de Meta Ads: se guarda al
 * iniciar el pago (email + items + total + buyOrder) y se consume solo si el
 * buyOrder de la orden confirmada coincide (evita fires stale/duplicados).
 */
export const PURCHASE_SNAPSHOT_STORAGE_KEY = 'oyz_purchase_snapshot';

/**
 * Sesión + persistente: la pasarela (Flow/Webpay) puede abrir otra pestaña o
 * contexto donde sessionStorage nace vacío y el snapshot/pendiente se perdería.
 * Escritura en ambos; lectura con fallback a localStorage.
 */
export function writeCommerceStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  } catch {
    // fail-soft: el pago nunca debe fallar por storage lleno/bloqueado
  }
}

export function readCommerceStorage(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearCommerceStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    // fail-soft
  }
}

/** Parámetros de atribución de campañas publicitarias (Meta Ads, Google Ads, etc.) */
export const UTM_STORAGE_KEY = 'oyz_utm_attribution';

export type UtmAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  fbclid?: string;
  gclid?: string;
  capturedAt: string;
  landingUrl?: string;
};

export function writeUtmAttribution(data: UtmAttribution): void {
  writeCommerceStorage(UTM_STORAGE_KEY, JSON.stringify(data));
}

export function readUtmAttribution(): UtmAttribution | null {
  const raw = readCommerceStorage(UTM_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UtmAttribution;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearUtmAttribution(): void {
  clearCommerceStorage(UTM_STORAGE_KEY);
}

export type CartStorageState<T> = {
  version: 2;
  updatedAt: number;
  lines: T[];
};

/** Acepta v1 (array plano) y v2; nunca lanza por storage corrupto. */
export function parseCartStorage<T>(raw: string | null): { lines: T[]; updatedAt: number } {
  if (!raw) return { lines: [], updatedAt: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { lines: parsed as T[], updatedAt: 0 };
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { lines?: unknown }).lines)
    ) {
      const value = parsed as { lines: T[]; updatedAt?: unknown };
      return {
        lines: value.lines,
        updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
      };
    }
    return { lines: [], updatedAt: 0 };
  } catch {
    return { lines: [], updatedAt: 0 };
  }
}

export function serializeCartStorage<T>(lines: T[], updatedAt = Date.now()): string {
  const state: CartStorageState<T> = { version: 2, updatedAt, lines };
  return JSON.stringify(state);
}

/** Un carrito local anterior al último pago confirmado ya no debe re-mezclarse. */
export function isStaleLocalCart(localUpdatedAt: number, clearedAt: string | null): boolean {
  if (!clearedAt || localUpdatedAt <= 0) return false;
  const clearedMs = new Date(clearedAt).getTime();
  return Number.isFinite(clearedMs) && localUpdatedAt <= clearedMs;
}
