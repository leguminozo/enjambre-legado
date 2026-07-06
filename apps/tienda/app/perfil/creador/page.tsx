import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';
import { assertStoreRouteAccess } from '@/lib/shop/assert-route-access';

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

export default async function CreadorPerfilPage() {
  await assertStoreRouteAccess('/perfil/creador');
  return <CreadorPortalClient />;
}