import type { NextConfig } from 'next';
import path from 'path';
import withSerwistInit from '@serwist/next';

function nucleoConnectOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const CANONICAL_NUCLEO_ORIGINS = [
  'https://nucleo-theta.vercel.app',
  'https://obrerayzangano.online',
  'https://www.obrerayzangano.online',
];

const CANONICAL_TIENDA_ORIGINS = [
  'https://tienda-eta-lime.vercel.app',
  'https://obrerayzangano.cl',
  'https://www.obrerayzangano.cl',
];

const CANONICAL_CAMPO_ORIGINS = [
  'https://campo-olive.vercel.app',
  // Dominio .store de campo — se lee de env para no hardcodear el TLD
  ...[process.env.NEXT_PUBLIC_URL_CAMPO, process.env.NEXT_PUBLIC_CAMPO_URL]
    .filter((v): v is string => typeof v === 'string' && v.startsWith('https://'))
    .map((v) => { try { return new URL(v).origin; } catch { return null; } })
    .filter((v): v is string => v !== null),
];

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' blob: data: https://*.supabase.co ${CANONICAL_TIENDA_ORIGINS.join(' ')}`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app ${CANONICAL_NUCLEO_ORIGINS.join(' ')} ${CANONICAL_TIENDA_ORIGINS.join(' ')} ${[nucleoConnectOrigin()].filter(Boolean).join(' ')}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ').replace(/\s{2,}/g, ' ').trim()
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@enjambre/auth", "@enjambre/ui"],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(nextConfig);
