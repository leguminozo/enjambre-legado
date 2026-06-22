'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

/** Evita 404 de Analytics cuando la feature no está habilitada en Vercel. */
export function VercelInsights() {
  const analyticsEnabled =
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === '1' ||
    Boolean(process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID);

  return (
    <>
      <SpeedInsights />
      {analyticsEnabled ? <Analytics /> : null}
    </>
  );
}