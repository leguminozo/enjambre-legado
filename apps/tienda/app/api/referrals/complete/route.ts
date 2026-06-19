import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  referrerId: z.string().uuid(),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid referrer id' }, { status: 400 });
  }

  const { referrerId } = parsed.data;

  const { data, error } = await supabase.rpc('complete_referral_signup', {
    p_referrer_id: referrerId,
    p_new_user_id: user.id,
  });

  if (error) {
    console.error('[referrals/complete] rpc error:', error.message);
    return NextResponse.json({ error: 'No se pudo registrar el referido' }, { status: 500 });
  }

  const result = data as { error?: string; status?: number; success?: boolean } | null;
  if (result?.error) {
    const status = typeof result.status === 'number' ? result.status : 400;
    if (status === 409 || result.success) {
      return NextResponse.json({ ok: true, alreadyCompleted: true }, { status: 200 });
    }
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, ...(typeof data === 'object' && data ? data : {}) }, { status: 200 });
}