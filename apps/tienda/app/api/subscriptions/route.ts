import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/api-guard';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, next_selection, pause_scheduled_until, subscription_plans(name, key, price_clp, frequency)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const [deliveries, plans] = await Promise.all([
    supabase
      .from('subscription_deliveries')
      .select('id, period_number, scheduled_for, items, status, tracking_url')
      .eq('subscription_id', subscription?.id ?? '')
      .order('period_number', { ascending: false })
      .limit(6),
    supabase
      .from('subscription_plans')
      .select('id, name, key, price_clp, frequency, description, included_items')
      .eq('active', true)
      .order('price_clp'),
  ]);

  return NextResponse.json({
    subscription: subscription ?? null,
    deliveries: deliveries.data ?? [],
    plans: plans.data ?? [],
  });
}

const SubscribeSchema = await import('zod').then((z) =>
  z.object({
    plan_id: z.string().uuid(),
  }),
);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 },
    );
  }

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

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.success },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: 'Use subscription checkout',
      message: 'Las suscripciones requieren pago vía /api/subscriptions/checkout en Núcleo',
    },
    { status: 410 },
  );
}
