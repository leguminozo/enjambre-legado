import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Users } from 'lucide-react';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';
import { EnjambreWelcomeClient } from '@/components/perfil/enjambre-welcome-client';
import { resolveOyzRole } from '@/lib/shop/role';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Únete al Enjambre | La Obrera y el Zángano',
};

export default async function EnjambrePage() {
  const supabase = await createClient();
  const [t, { data: { user } }] = await Promise.all([
    getTranslations('perfil.enjambre'),
    supabase.auth.getUser(),
  ]);

  // Ejecución concurrente de rol, RPC de bienvenida, beneficios y suscripción activa (I/O Concurrency)
  const [rol, { data: result }, { data: configRows }, { data: subs }] = await Promise.all([
    resolveOyzRole(user),
    supabase.rpc('unirse_al_enjambre'),
    supabase.from('beneficios_enjambre').select('clave, valor_numerico'),
    supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user?.id ?? '')
      .eq('status', 'active')
      .limit(1),
  ]);

  const status = typeof result?.status === 'string' ? result.status : 'error';
  const puntos = typeof result?.puntos === 'number' ? result.puntos : null;

  // Config central de beneficios: los MISMOS valores que aplica el checkout.
  const config: Record<string, number> = {};
  for (const row of configRows ?? []) {
    config[String(row.clave)] = Number(row.valor_numerico);
  }

  const hasClubActivo = (subs ?? []).length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PerfilPageHeader icon={<Users size={20} />} title={t('title')} mission={t('mission')} />
      <EnjambreWelcomeClient
        status={status}
        puntos={puntos}
        rol={rol}
        config={config}
        hasClubActivo={hasClubActivo}
      />
    </div>
  );
}
