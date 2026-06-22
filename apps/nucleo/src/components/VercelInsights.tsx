'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

/**
 * Solo monta analytics si el proyecto tiene Web Analytics habilitado en Vercel.
 * Evita 404 en /{id}/script.js cuando la feature no está activa.
 */
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