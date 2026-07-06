import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/api-guard';
import {
  handleSubscriptionGetAgent,
  handleSubscriptionPatch,
  subscriptionCheckoutGoneResponse,
} from '@/lib/shop/subscription-route-handlers';

/** Misma lógica que /api/subscriptions — contrato para agentes delegados. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleSubscriptionGetAgent(supabase, user.id);
}

export async function PATCH(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  return handleSubscriptionPatch(supabase, user.id, body);
}

/** Alta o cambio de plan: checkout Núcleo (igual que UI humana). */
export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return subscriptionCheckoutGoneResponse({ agent: true });
}