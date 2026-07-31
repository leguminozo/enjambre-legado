import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

function collectOrigin(envKey: string): string | null {
  const raw = process.env[envKey]?.trim();
  if (!raw) return null;
  try { return new URL(raw).origin; } catch { return null; }
}

const CANONICAL_TIENDA_ORIGINS = [
  'https://tienda-eta-lime.vercel.app',
  'https://obrerayzangano.cl',
  'https://www.obrerayzangano.cl',
];

const CANONICAL_CAMPO_ORIGINS = [
  'https://campo-olive.vercel.app',
];

/** Orígenes permitidos en iframes del Editor de Tienda (frame-src). */
function frameSrcDirective(): string {
  const origins = new Set<string>([
    "'self'",
    "https://www.youtube.com",
    "https://*.youtube.com",
    "https://*.vercel.app",
    "https://obrerayzangano.com",
    "https://www.obrerayzangano.com",
    "https://obrerayzangano.cl",
    "https://www.obrerayzangano.cl",
    "https://obrerayzangano.online",
    "https://www.obrerayzangano.online",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ]);

  for (const key of ["NEXT_PUBLIC_URL_TIENDA", "NEXT_PUBLIC_TIENDA_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore invalid */
    }
  }

  return `frame-src ${Array.from(origins).join(" ")}`;
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://api.open-meteo.com https://*.vercel.app ${CANONICAL_TIENDA_ORIGINS.join(' ')} ${CANONICAL_CAMPO_ORIGINS.join(' ')} ${[collectOrigin('NEXT_PUBLIC_URL_TIENDA'), collectOrigin('NEXT_PUBLIC_TIENDA_URL'), collectOrigin('NEXT_PUBLIC_URL_CAMPO'), collectOrigin('NEXT_PUBLIC_CAMPO_URL')].filter(Boolean).join(' ')}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      frameSrcDirective(),
      "upgrade-insecure-requests",
    ]
      .join("; ")
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@tanstack/react-query"],
  },
  turbopack: {},
  transpilePackages: [
    "@enjambre/ui",
    "@enjambre/auth",
    "@enjambre/contable",
    "@enjambre/banco-chile",
    "@enjambre/sumup",
    "@enjambre/shop-chrome",
    "@enjambre/sale-qr",
    "@enjambre/calendar",
    "@enjambre/fiscal",
    "@enjambre/pricing",
    "@enjambre/logistica",
    "@enjambre/resenas",
    "@enjambre/wallet",
  ],
  serverExternalPackages: ["gsap", "meyda", "sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(nextConfig);
