import { cache } from 'react';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';

export const listActiveSubscriptionPlans = cache(async (): Promise<ReplenishmentPlan[]> => {
  const supabase = createAnonServerClient();
  const { data } = await supabase
    .from('subscription_plans')
    .select('id, name, key, price_clp, frequency, description, included_items')
    .eq('active', true)
    .order('price_clp');

  return (data ?? []) as ReplenishmentPlan[];
});