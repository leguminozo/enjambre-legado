import { cache } from 'react';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';

export type PlanSurface = 'tienda_despensa' | 'tienda_club' | 'all';

export const listActiveSubscriptionPlans = cache(
  async (surface: PlanSurface = 'all'): Promise<ReplenishmentPlan[]> => {
    const supabase = createAnonServerClient();
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('price_clp');

    const raw = (data ?? []) as Array<Record<string, unknown>>;

    if (surface === 'all') {
      return raw as unknown as ReplenishmentPlan[];
    }

    const filtered = raw.filter((p) => {
      const channels = Array.isArray(p.channels) ? (p.channels as string[]) : [];
      const cat = typeof p.category === 'string' ? p.category : '';
      const key = typeof p.key === 'string' ? p.key : '';

      // Si tiene canales explícitos configurados
      if (channels.length > 0) {
        return channels.includes(surface);
      }

      // Fallback para registros sin canal explícito
      if (surface === 'tienda_despensa') {
        if (cat === 'territorial' || key.includes('trazabilidad') || key.includes('apiario')) {
          return false;
        }
        if (cat === 'reposicion' || ['monthly', 'quarterly', 'annual'].includes(key)) {
          return true;
        }
        return cat !== 'cosecha' && !key.startsWith('club_');
      }

      if (surface === 'tienda_club') {
        if (cat === 'territorial' || key.includes('trazabilidad') || key.includes('apiario')) {
          return false;
        }
        return cat === 'cosecha' || key.startsWith('club_') || key === 'multifloral';
      }

      return true;
    });

    return filtered as unknown as ReplenishmentPlan[];
  }
);