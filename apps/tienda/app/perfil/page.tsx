import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { MiLegadoClient } from '@/components/shop/mi-legado-client';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { loadPerfilDashboard } from '@/lib/shop/perfil-dashboard';

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const dashboard = await loadPerfilDashboard(supabase, user.id);
    return <MiLegadoClient {...dashboard} />;
  } catch (error) {
    console.error('[perfil] dashboard load failed:', error);
    return (
      <MiLegadoClient
        user={null}
        tierData={null}
        hiveData={null}
        orders={[]}
        claimPoints={[]}
        ecosystemMetrics={await getEcosystemMetrics()}
      />
    );
  }
}