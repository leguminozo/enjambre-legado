import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    .select('id, status, subscription_plans(name, frequency, price_clp), current_period_end, pause_scheduled_until')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({ subscription });
}

export async function PATCH(request: NextRequest) {
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

  const patch = body as Record<string, unknown>;
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 404 },
    );
  }

  if (patch.action === 'pause') {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        pause_scheduled_until: patch.resume_at as string ?? null,
        status: 'paused',
      })
      .eq('id', subscription.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to pause' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: 'paused' });
  }

  if (patch.action === 'cancel') {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', subscription.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: 'canceled' });
  }

  if (patch.action === 'resume') {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active', pause_scheduled_until: null })
      .eq('id', subscription.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to resume' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: 'active' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
