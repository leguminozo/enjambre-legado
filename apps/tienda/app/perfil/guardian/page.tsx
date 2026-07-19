import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { GuardianClient } from '@/components/perfil/guardian-client';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { loadGuardianDashboard } from '@/lib/shop/guardian-dashboard';

export default async function GuardianPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const dashboard = await loadGuardianDashboard(supabase, user.id);
    return (
      <GuardianClient
        {...dashboard}
        ecosystemMetrics={await getEcosystemMetrics()}
      />
    );
  } catch (error) {
    console.error('[perfil/guardian] dashboard load failed:', error);
    return (
      <GuardianClient
        user={null}
        tierData={null}
        impactData={null}
        stampProgress={[]}
        referralData={null}
        orders={[]}
        ecosystemMetrics={await getEcosystemMetrics()}
      />
    );
  }
}