import { LazyTerritorioHomeView } from '@/lib/navigation/lazy-views';

export const metadata = {
  title: 'Mi Territorio — Registro Apícola de Chiloé',
  description: 'Tu panel en el Registro Territorial Apícola de Chiloé. Gestiona tu inscripción, predios, trashumancia y alertas fitosanitarias.',
};

export default function TerritorioPage() {
  return <LazyTerritorioHomeView />;
}
