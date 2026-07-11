import type { NextConfig } from 'next';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

function nucleoConnectOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/** Quién puede embeber la tienda (Editor de Tienda en Núcleo). */
function frameAncestorsDirective(): string {
  const origins = new Set<string>([
    "'self'",
    'https://*.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  for (const key of ['NEXT_PUBLIC_NUCLEO_API_URL', 'NEXT_PUBLIC_URL_NUCLEO'] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore */
    }
  }

  return `frame-ancestors ${Array.from(origins).join(' ')}`;
}

const connectSrc = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://*.sentry.io',
  'https://*.vercel.app',
  'https://maps.googleapis.com',
  'https://www.flow.cl',
  'https://sandbox.flow.cl',
  nucleoConnectOrigin(),
].filter(Boolean);

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // No X-Frame-Options: SAMEORIGIN — bloquea iframe cross-origin del Editor.
  // Usamos CSP frame-ancestors (allowlist Núcleo + Vercel previews).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com https://maps.googleapis.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-src 'self' https://www.youtube.com https://*.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://webpay3gint.transbank.cl https://webpay3g.transbank.cl https://www.flow.cl https://sandbox.flow.cl",
      frameAncestorsDirective(),
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@enjambre/auth", "@enjambre/ui"],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap', 'leaflet'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/perfil/ritual',
        destination: '/perfil/reposicion',
        permanent: true,
      },
      {
        source: '/perfil/ritual/resultado',
        destination: '/perfil/reposicion/resultado',
        permanent: true,
      },
      {
        source: '/perfil/ritual/resultado/:path*',
        destination: '/perfil/reposicion/resultado/:path*',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  org: process.env.NEXT_PUBLIC_SENTRY_ORG,
  project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
});
