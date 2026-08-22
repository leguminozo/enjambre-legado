import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metodología de Impacto Biocultural — Registro Apícola de Chiloé',
  description:
    'Fórmulas abiertas, secuestro de carbono, regeneración del bosque nativo y cálculo de impacto verificable en el archipiélago.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/impacto',
  },
  openGraph: {
    title: 'Metodología de Impacto Biocultural · Chiloé',
    description:
      'Transparencia abierta, métricas de regeneración y límites científicos del impacto apícola en bosque nativo.',
    url: 'https://www.registroapicolachiloe.me/impacto',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metodología de Impacto Biocultural · Chiloé',
    description:
      'Transparencia abierta, métricas de regeneración y límites científicos del impacto apícola en bosque nativo.',
  },
};

export default function ImpactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
