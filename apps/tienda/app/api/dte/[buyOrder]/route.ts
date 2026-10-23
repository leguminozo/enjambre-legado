import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dteLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

const BUY_ORDER_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FacturaRow = {
  sii_xml: string | null;
  download_token: string | null;
  download_token_expires_at: string | null;
  estado_sii: string | null;
};

function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ code, message }, { status, headers });
}

async function fetchFactura(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  ventaId: string,
): Promise<FacturaRow | null> {
  const select = 'sii_xml, download_token, download_token_expires_at, estado_sii';
  const byVenta = await admin
    .from('facturas_emitidas')
    .select(select)
    .eq('venta_id', ventaId)
    .maybeSingle();

  if (byVenta.data) return byVenta.data as FacturaRow;

  const byLegacyKey = await admin
    .from('facturas_emitidas')
    .select(select)
    .eq('idempotency_key', `venta:${ventaId}`)
    .maybeSingle();

  return (byLegacyKey.data as FacturaRow | null) ?? null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ buyOrder: string }> },
) {
  const { buyOrder } = await context.params;
  if (!BUY_ORDER_PATTERN.test(buyOrder)) {
    return jsonError(400, 'invalid_order', 'Código de pedido inválido');
  }

  const limit = dteLimiter(getClientIdentifier(request));
  if (!limit.success) {
    return jsonError(429, 'rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', {
      'Retry-After': String(Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000))),
    });
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError(503, 'service_unavailable', 'Documento no disponible por el momento');
  }

  const { data: venta, error: ventaError } = await admin
    .from('ventas')
    .select('id, user_id')
    .eq('buy_order', buyOrder)
    .maybeSingle();

  if (ventaError) {
    console.error('[api/dte] venta lookup failed:', ventaError.message);
    return jsonError(500, 'lookup_failed', 'No pudimos consultar el documento');
  }
  if (!venta) {
    return jsonError(404, 'not_found', 'Documento no encontrado');
  }

  const factura = await fetchFactura(admin, venta.id as string);
  if (!factura) {
    return jsonError(404, 'not_found', 'Documento no encontrado');
  }

  const token = request.nextUrl.searchParams.get('token');
  const tokenMatches =
    Boolean(token) &&
    UUID_PATTERN.test(token!) &&
    factura.download_token === token;
  const tokenExpired =
    Boolean(factura.download_token_expires_at) &&
    new Date(factura.download_token_expires_at!).getTime() < Date.now();

  const authorized = tokenMatches && !tokenExpired;

  if (!authorized) {
    let userId: string | null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }

    const ownsOrder = Boolean(userId) && venta.user_id === userId;
    if (!ownsOrder) {
      if (tokenMatches && tokenExpired) {
        return jsonError(410, 'link_expired', 'Este enlace de descarga expiró');
      }
      if (!userId) {
        return jsonError(401, 'unauthorized', 'Inicia sesión para descargar tu documento');
      }
      return jsonError(403, 'forbidden', 'No tienes acceso a este documento');
    }
  }

  if (!factura.sii_xml) {
    return jsonError(
      409,
      'xml_pending',
      factura.estado_sii === 'rechazado'
        ? 'El documento fue rechazado. Escríbenos para regularizarlo.'
        : 'El documento tributario aún se está preparando',
    );
  }

  return new Response(factura.sii_xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="documento-${buyOrder}.xml"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
