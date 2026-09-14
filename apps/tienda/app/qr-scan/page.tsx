import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/cms';
import { parseQrScanSettings } from '@enjambre/shop-chrome';
import { QRScanClient } from './qr-scan-client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Escáner QR · Trazabilidad y Autenticidad · La Obrera y el Zángano',
  description:
    'Escanea el código QR de tu frasco de miel nativa para verificar su trazabilidad completa y autenticidad biocultural de origen Chiloé.',
  alternates: { canonical: `${SITE_URL}/qr-scan` },
  openGraph: {
    title: 'Escáner QR · Trazabilidad y Autenticidad · La Obrera y el Zángano',
    description:
      'Escanea el código QR de tu frasco de miel nativa para verificar su trazabilidad completa y autenticidad biocultural de origen Chiloé.',
    url: `${SITE_URL}/qr-scan`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Escáner QR · Trazabilidad y Autenticidad · La Obrera y el Zángano',
    description:
      'Verifica la autenticidad y trazabilidad de tu frasco de miel nativa de Chiloé.',
  },
};

export default async function QRScanPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const rows = await getSiteContent('qr_scan_settings', { draft });
  const settings = parseQrScanSettings(rows[0]?.content);

  return <QRScanClient settings={settings} />;
}
