import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SubscriptionDelivery,
  SubscriptionPlan,
  UserSubscription,
} from '@/app/actions/perfil-experiences';
import { deliveryAddressFromMetadata } from '@/lib/shop/replenishment';
import { fetchSubscriptionApiBundle } from '@/lib/shop/subscription-api';

export type SubscriptionDashboard = {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  deliveries: SubscriptionDelivery[];
};

type RawSubscriptionRow = {
  id: string;
  status: string;
  current_period_end: string;
  metadata?: unknown;
  subscription_plans: SubscriptionPlan | SubscriptionPlan[] | null;
};

function normalizePlanJoin(
  planJoin: SubscriptionPlan | SubscriptionPlan[] | null | undefined,
): SubscriptionPlan | null {
  if (!planJoin) return null;
  return Array.isArray(planJoin) ? (planJoin[0] ?? null) : planJoin;
}

export function mapSubscriptionDashboardBundle(bundle: {
  subscription: RawSubscriptionRow | null;
  deliveries: SubscriptionDelivery[];
  plans: SubscriptionPlan[];
}): SubscriptionDashboard {
  const rawSub = bundle.subscription;

  return {
    subscription: rawSub
      ? {
          id: rawSub.id,
          status: rawSub.status,
          current_period_end: rawSub.current_period_end,
          delivery_address: deliveryAddressFromMetadata(rawSub.metadata),
          subscription_plans: normalizePlanJoin(rawSub.subscription_plans),
        }
      : null,
    plans: bundle.plans,
    deliveries: bundle.deliveries,
  };
}

export async function fetchSubscriptionDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionDashboard> {
  const bundle = await fetchSubscriptionApiBundle(supabase, userId);
  return mapSubscriptionDashboardBundle({
    subscription: bundle.subscription as RawSubscriptionRow | null,
    deliveries: bundle.deliveries as SubscriptionDelivery[],
    plans: bundle.plans as SubscriptionPlan[],
  });
}