import { type NextRequest, NextResponse } from 'next/server';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';

/**
 * Puente fail-safe para webhooks de Flow en la Tienda.
 *
 * Si la pasarela Flow (o una configuración heredada) envía la notificación
 * HTTP POST a la URL de la Tienda (ej. https://obrerayzangano.cl/api/checkout/webhook/flow)
 * en vez del BFF de Núcleo, esta ruta actúa como proxy transparente hacia Núcleo,
 * evitando el error HTTP 404 y garantizando la liquidación del pago.
 */
export async function POST(request: NextRequest) {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) {
    return NextResponse.json(
      { error: 'BFF de Núcleo no disponible' },
      { status: 503 },
    );
  }

  try {
    const contentType = request.headers.get('content-type') || 'application/x-www-form-urlencoded';
    const bodyText = await request.text();

    const forwardHeaders: Record<string, string> = {
      'content-type': contentType,
    };

    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      forwardHeaders['x-forwarded-for'] = forwardedFor;
    }

    const response = await fetch(`${nucleoUrl}/api/checkout/webhook/flow`, {
      method: 'POST',
      headers: forwardHeaders,
      body: bodyText,
    });

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[tienda/webhook/flow] Error reenviando a Núcleo:', error);
    return NextResponse.json(
      { error: 'Error interno en puente de webhook Flow' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, bridge: 'tienda-flow-webhook-bridge' },
    { status: 200 },
  );
}
