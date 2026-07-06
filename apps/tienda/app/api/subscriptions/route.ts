import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/api-guard';
import { createRouteRateLimiter } from '@/lib/ratelimit-route';
import {
  handleSubscriptionGetFull,
  handleSubscriptionPatch,
  subscriptionCheckoutGoneResponse,
  SubscriptionSubscribeSchema,
} from '@/lib/shop/subscription-route-handlers';

const checkRateLimit = createRouteRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleSubscriptionGetFull(supabase, user.id);
}

/** Alta de reposición: siempre vía checkout Núcleo (no creación directa). */
export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

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

  const parsed = SubscriptionSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  return subscriptionCheckoutGoneResponse();
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