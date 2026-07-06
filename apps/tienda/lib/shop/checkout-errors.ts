type CheckoutErrorContext = 'quote' | 'init' | 'commit';

const FALLBACK: Record<CheckoutErrorContext, string> = {
  quote: 'No pudimos calcular envío y descuentos. Revisa la región e intenta de nuevo.',
  init: 'No se pudo iniciar el pago. Intenta de nuevo en unos minutos.',
  commit: 'No se pudo confirmar el pago. Si ya pagaste, contáctanos con tu comprobante.',
};

function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/** Mensajes amigables para respuestas del checkout en Núcleo (sin filtrar detalles internos en prod). */
export function friendlyCheckoutApiMessage(
  code: string | undefined,
  message: string | undefined,
  context: CheckoutErrorContext = 'quote',
): string {
  const msg = (message ?? '').toLowerCase();

  if (code === 'forbidden' && msg.includes('csrf')) {
    return 'Sesión interrumpida. Recarga la página e intenta de nuevo.';
  }

  if (msg.includes('missing supabase') || msg.includes('service_role')) {
    return isDev()
      ? 'Falta SUPABASE_SERVICE_ROLE_KEY en Núcleo. Ejecuta: pnpm go-live:bootstrap'
      : 'Estamos actualizando el checkout. Intenta en unos minutos o escríbenos.';
  }

  if (
    code === 'quote_failed' &&
    (msg.includes('descuento') ||
      msg.includes('discount') ||
      msg.includes('código') ||
      msg.includes('codigo'))
  ) {
    return 'El código promocional no es válido o ya expiró.';
  }

  if (
    msg.includes('flow_api') ||
    msg.includes('flow_secret') ||
    msg.includes('transbank') ||
    msg.includes('falta flow') ||
    msg.includes('payment_provider')
  ) {
    return isDev()
      ? 'Faltan credenciales de pago en Núcleo (FLOW_* o TRANSBANK_*).'
      : 'El pago no está disponible temporalmente. Contáctanos para completar tu pedido.';
  }

  if (message && message.length <= 120 && !msg.includes('missing') && !msg.includes('stack')) {
    return message;
  }

  return FALLBACK[context];
}

/** Errores de configuración del servidor — el checkout no puede completarse hasta corregirlos. */
export function isCheckoutConfigError(
  code: string | undefined,
  message: string | undefined,
): boolean {
  const msg = (message ?? '').toLowerCase();
  return (
    msg.includes('missing supabase') ||
    msg.includes('service_role') ||
    msg.includes('flow_api') ||
    msg.includes('flow_secret') ||
    msg.includes('transbank') ||
    msg.includes('falta flow') ||
    msg.includes('payment_provider') ||
    code === 'preview_failed'
  );
}

/** Bloquea el botón de pago cuando la región ya está lista pero no hay cotización válida. */
export function shouldBlockCheckoutPayment(
  region: string,
  opts: {
    quoteLoading: boolean;
    quote: unknown;
    quoteError: string | null;
  },
): boolean {
  if (region.trim().length < 2) return true;
  if (opts.quoteLoading) return true;
  return !opts.quote || Boolean(opts.quoteError);
}

/** Indica si el formulario de envío tiene los campos mínimos para cotizar/pagar. */
export function isCheckoutShippingReady(shipping: {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
}): boolean {
  return Object.keys(
    (() => {
      const e: Record<string, string> = {};
      if (shipping.nombre.trim().length < 2) e.nombre = '1';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) e.email = '1';
      if (shipping.telefono.trim().length < 8) e.telefono = '1';
      if (shipping.direccion.trim().length < 5) e.direccion = '1';
      if (shipping.comuna.trim().length < 2) e.comuna = '1';
      if (shipping.ciudad.trim().length < 2) e.ciudad = '1';
      if (shipping.region.trim().length < 2) e.region = '1';
      return e;
    })(),
  ).length === 0;
}