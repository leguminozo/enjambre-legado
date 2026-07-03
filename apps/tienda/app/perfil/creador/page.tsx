import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';

const CreadorPortalClient = dynamic(
  () => import('@/components/creador/creador-portal-client').then((m) => m.CreadorPortalClient),
  {
    loading: () => <ViewLoadingFallback label="Portal creador" />,
  },
);

export const metadata = {
  title: 'Embajador del Bosque | Enjambre Legado',
  description: 'Portal de comisiones por referido para creadores de contenido.',
};

export default function CreadorPerfilPage() {
  return <CreadorPortalClient />;
}