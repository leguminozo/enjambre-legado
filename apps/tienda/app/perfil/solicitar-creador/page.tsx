import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { Megaphone } from 'lucide-react';
import { ViewLoadingFallback } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/server';
import { assertStoreRouteAccess } from '@/lib/shop/assert-route-access';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';

const CreadorSolicitudClient = dynamic(
  () => import('@/components/creador/creador-solicitud-client').then((m) => m.CreadorSolicitudClient),
  {
    loading: () => <ViewLoadingFallback label="Postulación de embajador" />,
  },
);

export const metadata = {
  title: 'Postula como Embajador | La Obrera y el Zángano',
  description: 'Postula al programa de referidos para creadores de contenido.',
};

export default async function SolicitarCreadorPage() {
  await assertStoreRouteAccess('/perfil/solicitar-creador');
  const t = await getTranslations('perfil.creadorSolicitud');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    initialName = typeof data?.full_name === 'string' ? data.full_name : null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PerfilPageHeader icon={<Megaphone size={20} />} title={t('title')} mission={t('mission')} />

      <section>
        <CreadorSolicitudClient initialName={initialName} />
      </section>
    </div>
  );
}
