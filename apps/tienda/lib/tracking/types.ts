/**
 * Eventos semánticos de tracking (Meta Ads).
 * La capa de llamada dispara eventos tipados; pixel y CAPI consumen el mismo
 * `eventId` (UUID) para deduplicación server↔client en Meta.
 */

export type MetaEventName = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

export type TrackedContentItem = {
  id: string;
  quantity: number;
  /** Precio unitario en CLP (sin decimales). */
  itemPrice?: number;
};

export type MetaTrackPayload = {
  eventName: MetaEventName;
  /** UUID v4 generado en el cliente — dedupe pixel↔CAPI. */
  eventId: string;
  /** Valor total del evento en CLP. */
  value?: number;
  currency?: 'CLP';
  contentIds?: string[];
  contents?: TrackedContentItem[];
  contentName?: string;
  numItems?: number;
  /** buyOrder / número de pedido (solo Purchase). */
  orderId?: string;
  /** Email del cliente — se hashea sha256 server-side (nunca viaja en claro). */
  email?: string;
  phone?: string;
  /** Cookies _fbp / _fbc leídas del navegador para matching con el pixel. */
  fbp?: string;
  fbc?: string;
  /** URL actual (event_source_url) — requerido por Meta para dedupe. */
  sourceUrl?: string;
  /** Código de evento de prueba de Meta Events Manager (opcional). */
  testEventCode?: string;
};

/**
 * Snapshot del checkout guardado en sessionStorage al iniciar el pago.
 * El evento Purchase solo se dispara si el buyOrder coincide con la orden
 * confirmada (mismo patrón anti-stale que CHECKOUT_SUCCESS_META_KEY).
 */
export type PurchaseSnapshot = {
  buyOrder: string;
  email?: string;
  total: number;
  items: TrackedContentItem[];
};
