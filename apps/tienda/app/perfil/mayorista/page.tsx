import { assertStoreRouteAccess } from '@/lib/shop/assert-route-access';
import { createClient } from '@/utils/supabase/server';
import { MayoristaPortalClient } from '@/components/perfil/mayorista-portal-client';

export const metadata = {
  title: 'Portal Aliado Mayorista | La Obrera y el Zángano',
  description: 'Portal de pedidos institucionales B2B y catálogo para aliados autorizados.',
};

export default async function MayoristaPerfilPage() {
  await assertStoreRouteAccess('/perfil/mayorista');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfil = null;
  if (user) {
    const { data } = await supabase
      .from('revendedor_profile')
      .select('razon_social, rut, tipo_negocio, estado, direccion, region')
      .eq('user_id', user.id)
      .maybeSingle();
    perfil = data;
  }

  return (
    <MayoristaPortalClient
      userEmail={user?.email}
      perfil={perfil}
    />
  );
}