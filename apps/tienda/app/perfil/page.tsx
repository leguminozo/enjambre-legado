import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { MiLegadoClient } from '@/components/shop/mi-legado-client';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

export default async function PerfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profileRes, tierRes, subConfigRes, ordersRes, claimPointsRes, ecosystemMetrics] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_tier_view').select('*').eq('user_id', user.id).single(),
    supabase.from('suscriptor_config').select('*, colmenas(*)').eq('user_id', user.id).single(),
    supabase.from('pedidos').select('*, pedido_items(*, productos(*))').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('puntos_reclamo').select('*, ciclos(*)').eq('user_id', user.id).eq('estado', 'pendiente'),
    getEcosystemMetrics(),
  ]);

  const hiveData = subConfigRes.data?.colmenas ? {
    name: subConfigRes.data.colmenas.name,
    estado: subConfigRes.data.colmenas.estado,
    peso_kg: subConfigRes.data.colmenas.peso_kg
  } : null;

  const tierData = tierRes.data ? {
    tier: tierRes.data.tier,
    ciclos_historicos: tierRes.data.ciclos_historicos
  } : null;

  return (
    <MiLegadoClient
      user={toTiendaUserProfile(profileRes.data)}
      tierData={tierData}
      hiveData={hiveData}
      orders={ordersRes.data || []}
      claimPoints={claimPointsRes.data || []}
      ecosystemMetrics={ecosystemMetrics}
    />
  );
}
