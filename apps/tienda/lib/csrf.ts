import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]);

export function validateCsrf(request: NextRequest): NextResponse | null {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'Origin no permitido' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  const isFormOrJson = contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

  if (origin && isFormOrJson) {
    return null;
  }

  if (!origin && isFormOrJson) {
    const secFetchDest = request.headers.get('sec-fetch-dest');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    if (secFetchDest === 'empty' && secFetchMode === 'cors') {
      return null;
    }
    if (secFetchDest === 'empty') {
      return null;
    }
  }

  return null;
}

export function requireCsrfHeader(request: Request): NextResponse | null {
  const customHeader = request.headers.get('x-requested-with');
  if (customHeader === 'XMLHttpRequest') {
    return null;
  }
  return NextResponse.json({ error: 'Petición inválida (falta header CSRF)' }, { status: 403 });
}
