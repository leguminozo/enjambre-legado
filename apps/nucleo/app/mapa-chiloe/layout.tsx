import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mapa Apícola de Chiloé — Zonas de Pecoreo y Densidad Territorial',
  description:
    'Visualizador comunitario del archipiélago de Chiloé. Zonas de pecoreo protegidas, floraciones nativas y alertas de distancia sanitaria.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/mapa-chiloe',
  },
  openGraph: {
    title: 'Mapa Apícola de Chiloé — Zonas de Pecoreo y Densidad Territorial',
    description:
      'Visualizador comunitario del archipiélago de Chiloé. Zonas de pecoreo protegidas, floraciones nativas y alertas de distancia sanitaria.',
    url: 'https://www.registroapicolachiloe.me/mapa-chiloe',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mapa Apícola de Chiloé — Zonas de Pecoreo y Densidad Territorial',
    description:
      'Visualizador comunitario del archipiélago de Chiloé. Zonas de pecoreo protegidas, floraciones nativas y alertas de distancia sanitaria.',
  },
};

export default function MapaChiloeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
