import { PlanesTerritorialesView } from '@/views/PlanesTerritorialesView';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes y Servicios — Registro Territorial Apícola de Chiloé',
  description:
    'El censo y la defensa territorial son gratuitos para siempre. Planes de trazabilidad, cuaderno digital y herramientas avanzadas para apicultores de Chiloé.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/planes-territoriales',
  },
  openGraph: {
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratuitos y permanentes. Herramientas avanzadas de trazabilidad para apicultores.',
    url: 'https://www.registroapicolachiloe.me/planes-territoriales',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y Servicios · Registro Territorial Apícola de Chiloé',
    description:
      'El censo y la defensa de pecoreo son gratuitos y permanentes. Herramientas avanzadas de trazabilidad para apicultores.',
  },
};

/**
 * Página pública de planes del Registro Territorial de Chiloé.
 * Muestra el catálogo visual completo con selector Individual / Organizaciones,
 * beneficios de cada nivel y checkout directo o redirección a registro.
 */
export default async function PlanesTerritorialesPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />
      <div className="flex-1">
        <PlanesTerritorialesView variant="public" />
      </div>
      <TerritorioFooter />
    </main>
  );
}
