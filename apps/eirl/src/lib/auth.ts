import { NextRequest, NextResponse } from 'next/server';

const EIRL_AUTH_TOKEN = process.env.EIRL_AUTH_TOKEN;

export function requireEirlAuth(request: NextRequest): NextResponse | null {
  if (!EIRL_AUTH_TOKEN) {
    console.error('EIRL_AUTH_TOKEN not configured — blocking all API access');
    return NextResponse.json({ error: 'Servidor no configurado' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${EIRL_AUTH_TOKEN}`) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return null;
}
