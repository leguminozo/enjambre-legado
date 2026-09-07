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

  let dashboard: Awaited<ReturnType<typeof loadPerfilDashboard>> | null = null;
  try {
    dashboard = await loadPerfilDashboard(supabase, user.id);
  } catch (error) {
    console.error('[perfil] dashboard load failed:', error);
  }

  if (dashboard) {
    return <MiLegadoClient {...dashboard} />;
  }

  return (
    <MiLegadoClient
      user={null}
      tierData={null}
      hiveData={null}
      orders={[]}
      claimPoints={[]}
      ecosystemMetrics={await getEcosystemMetrics()}
      stats={{ totalOrders: 0, totalSpent: 0 }}
    />
  );
}