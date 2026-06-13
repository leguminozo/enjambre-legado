import { NextResponse } from 'next/server';

async function verifyFlowSignature(params: Record<string, string>): Promise<boolean> {
  const signature = params.s;
  if (!signature) return false;

  const sorted = Object.keys(params)
    .filter((k) => k !== 's')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const secret = process.env.FLOW_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    const nucleoBffUrl = process.env.NUCLEO_BFF_URL;

    if (!nucleoBffUrl) {
      console.error('Missing NUCLEO_BFF_URL environment variable');
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    const response = await fetch(`${nucleoBffUrl}/api/checkout/webhook/flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Flow sends application/x-www-form-urlencoded typically, but if we parsed it as JSON before,
      // wait, the previous code did: const raw = await request.json() as Record<string, string>;
      body: rawText,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook proxy';
    console.error('Flow webhook proxy error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const isValid = await verifyFlowSignature(params);
    if (!isValid) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
      );
    }

    const status = Number(params.status);
    const FLOW_PAID = 2;

    if (status !== FLOW_PAID) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
      );
    }

    const buyOrder = params.commerceOrder;
    const token = params.token || '';

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?token_ws=${token}&buyOrder=${buyOrder}&provider=flow`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando retorno';
    console.error('Flow return error:', message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
    );
  }
}
