import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Experiencia y Degustación · Punto de Encuentro',
  description:
    'Cata sensorial de mieles del bosque nativo, proveniencia viva y beneficios exclusivos en nuestro punto de encuentro.',
  openGraph: {
    title: 'Experiencia y Degustación · Punto de Encuentro',
    description:
      'Cata sensorial de mieles del bosque nativo, proveniencia viva y beneficios exclusivos en nuestro punto de encuentro.',
    siteName: 'La Obrera y el Zángano',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experiencia y Degustación · Punto de Encuentro',
    description:
      'Cata sensorial de mieles del bosque nativo, proveniencia viva y beneficios exclusivos en nuestro punto de encuentro.',
  },
};

export default function PuntoDeVentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
