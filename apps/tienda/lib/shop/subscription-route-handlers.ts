import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  fetchAgentSubscription,
  patchUserSubscription,
  type SubscriptionManageAction,
} from '@/lib/shop/subscription-api';
import { fetchSubscriptionDashboard } from '@/lib/shop/subscription-dashboard';

export const SubscriptionPatchSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel']),
  resume_at: z.string().datetime().optional(),
});

export const SubscriptionSubscribeSchema = z.object({
  plan_id: z.string().uuid(),
});

export function subscriptionCheckoutGoneResponse(options?: { agent?: boolean }) {
  const message = options?.agent
    ? 'Crear o cambiar reposición requiere pago delegado vía Núcleo POST /api/subscriptions/checkout/init con planId y returnUrl'
    : 'Las reposiciones requieren pago vía Núcleo /api/subscriptions/checkout';

  return NextResponse.json(
    {
      error: 'Use subscription checkout',
      message,
    },
    { status: 410 },
  );
}

export async function handleSubscriptionGetFull(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse> {
  const dashboard = await fetchSubscriptionDashboard(supabase, userId);
  return NextResponse.json(dashboard);
}

export async function handleSubscriptionGetAgent(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse> {
  const subscription = await fetchAgentSubscription(supabase, userId);
  return NextResponse.json({ subscription });
}

export async function handleSubscriptionPatch(
  supabase: SupabaseClient,
  userId: string,
  body: unknown,
): Promise<NextResponse> {
  const parsed = SubscriptionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { action, resume_at: resumeAt } = parsed.data;
  const result = await patchUserSubscription(
    supabase,
    userId,
    action as SubscriptionManageAction,
    resumeAt,
  );

  if (!result.ok) {
    const status = result.code === 'not_found' ? 404 : 500;
    return NextResponse.json({ error: result.message }, { status });
  }

  return NextResponse.json({ success: true, status: result.status });
}