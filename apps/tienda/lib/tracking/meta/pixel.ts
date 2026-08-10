/**
 * Meta Pixel (client-side). Carga el script fbevents.js solo cuando hay
 * consentimiento de marketing; `fireMetaPixelEvent` recibe el mismo `eventId`
 * que CAPI para deduplicación server↔client.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let pixelLoaded = false;

export function getMetaPixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || undefined;
}

/**
 * Inyecta el snippet canónico de Meta (cola de llamadas antes de que cargue
 * el script) + `fbq('consent','grant')` + init. Idempotente.
 */
export function loadMetaPixel(pixelId: string): void {
  if (pixelLoaded || typeof window === 'undefined') return;
  pixelLoaded = true;

  // Cola de llamadas pre-carga (patrón oficial de Meta)
  window._fbq = window._fbq || [];
  window.fbq = function fbqQueue(...args: unknown[]) {
    (window._fbq as unknown[]).push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onerror = () => {
    console.error('[meta-pixel] fallo al cargar fbevents.js');
  };
  document.head.appendChild(script);

  window.fbq('consent', 'grant');
  window.fbq('init', pixelId);
}

/** PageView por ruta (SPA). No-op si el pixel no está cargado/consentido. */
export function fireMetaPageView(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'PageView');
}

export type MetaPixelEventData = Record<string, unknown>;

/**
 * Dispara un evento estándar con eventID (dedupe con CAPI).
 * No-op sin pixel cargado — el gate de consentimiento vive en la capa llamadora.
 */
export function fireMetaPixelEvent(eventName: string, eventId: string, data: MetaPixelEventData): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, data, { eventID: eventId });
}
