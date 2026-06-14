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

  const requestOrigin = request.nextUrl.origin;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Verify Origin header if present
  if (origin) {
    if (origin === requestOrigin || ALLOWED_ORIGINS.has(origin)) {
      return null;
    }
    return NextResponse.json({ error: 'Origin no permitido' }, { status: 403 });
  }

  // Fallback to Referer validation if Origin is missing
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === requestOrigin || ALLOWED_ORIGINS.has(refererOrigin)) {
        return null;
      }
    } catch {
      // Invalid URL format in referer header
    }
    return NextResponse.json({ error: 'Referer no permitido o inválido' }, { status: 403 });
  }

  // Reject mutating requests if both Origin and Referer are missing
  return NextResponse.json({ error: 'Falta cabecera de origen (CSRF protection)' }, { status: 403 });
}

export function requireCsrfHeader(request: Request): NextResponse | null {
  const customHeader = request.headers.get('x-requested-with');
  if (customHeader === 'XMLHttpRequest') {
    return null;
  }
  return NextResponse.json({ error: 'Petición inválida (falta header CSRF)' }, { status: 403 });
}
