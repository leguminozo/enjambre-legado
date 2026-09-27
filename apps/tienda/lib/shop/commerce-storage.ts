/** Claves sessionStorage / localStorage del comercio (una sola fuente). */

export const PENDING_CHECKOUT_STORAGE_KEY = 'oyz_pending_checkout';
export const PENDING_SUBSCRIPTION_STORAGE_KEY = 'oyz_pending_subscription';
export const REPLENISHMENT_ADDRESS_STORAGE_KEY = 'oyz_replenishment_address';
export const CART_STORAGE_KEY = 'oyz_tienda_cart_v1';
export const CHECKOUT_SUCCESS_META_KEY = 'oyz_checkout_success_meta';
export const RESENA_CLAIM_TOKEN_KEY = 'oyz_resena_claim_token';
/** Código de embajador/creador capturado desde ?ref= o ?codigo= (session). */
export const CREATOR_REF_CODE_KEY = 'oyz_creator_ref_code';
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