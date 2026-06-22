import { NextResponse } from 'next/server';

const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: 'Token QR requerido' }, { status: 400 });
  }

  const res = await fetch(`${NUCLEO_URL}/api/wallet/qr/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      origin: process.env.NEXT_PUBLIC_CAMPO_URL ?? 'http://localhost:3002',
    },
    body: JSON.stringify({ token: body.token }),
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}