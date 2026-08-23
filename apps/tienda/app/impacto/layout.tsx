import type { Metadata } from 'next';

// Ruta con sesión: sin SEO público (noindex).
export const metadata: Metadata = {
  title: 'Metodología de Impacto Biocultural — Obrera y Zángano',
  description:
    'Fórmulas abiertas, secuestro de carbono, regeneración del bosque nativo y cálculo de impacto verificable en el archipiélago.',
  robots: { index: false, follow: false },
};

export default function ImpactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}