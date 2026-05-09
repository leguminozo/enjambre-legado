import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { MiLegadoClient } from '@/components/shop/mi-legado-client';

export default async function PerfilPage() {
  const supabase = await createClient();
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 3. Fetch Tier & Ciclos from our optimized view
  const { data: tier } = await supabase
    .from('user_tier_view')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 4. Fetch linked hive (if subscriber)
  const { data: subConfig } = await supabase
    .from('suscriptor_config')
    .select('*, colmenas(*)')
    .eq('user_id', user.id)
    .single();

  const hiveData = subConfig?.colmenas ? {
    name: subConfig.colmenas.name,
    estado: subConfig.colmenas.estado,
    peso_kg: subConfig.colmenas.peso_kg
  } : null;

  const tierData = tier ? {
    tier: tier.tier,
    ciclos_historicos: tier.ciclos_historicos
  } : null;

  return (
    <MiLegadoClient 
      user={profile} 
      tierData={tierData} 
      hiveData={hiveData} 
    />
  );
}
