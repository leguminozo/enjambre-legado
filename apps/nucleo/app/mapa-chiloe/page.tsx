import type { Metadata } from 'next';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { MapaChiloeClient } from './MapaChiloeClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Mapa Apícola Territorial · Chiloé',
  description:
    'Zonas comunales de pecoreo protegido, resguardo soberano Ley 21.489 y monitoreo de cuencas melíferas en el archipiélago de Chiloé.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/mapa-chiloe',
  },
  openGraph: {
    title: 'Mapa Apícola Territorial · Chiloé',
    description:
      'Zonas comunales de pecoreo protegido, resguardo soberano Ley 21.489 y monitoreo de cuencas melíferas en el archipiélago de Chiloé.',
    url: 'https://www.registroapicolachiloe.me/mapa-chiloe',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mapa Apícola Territorial · Chiloé',
    description:
      'Zonas comunales de pecoreo protegido, resguardo soberano Ley 21.489 y monitoreo de cuencas melíferas en el archipiélago de Chiloé.',
  },
};

export default async function MapaChiloePage() {
  const cms = await getTerritorioCmsContent();
  return <MapaChiloeClient headerContent={cms.header} />;
}
