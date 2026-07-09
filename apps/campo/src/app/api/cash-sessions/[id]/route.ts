import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await context.params;

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago, channel, created_at, items")
    .eq("cash_session_id", sessionId)
    .order("created_at", { ascending: true });

  const { data: commissions } = await supabase
    .from("commission_records")
    .select("id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, total_commission, calculated_at")
    .eq("session_id", sessionId);

  const { data: repProfile } = await supabase
    .from("rep_profiles")
    .select("display_name, commission_tier, current_streak_days")
    .eq("user_id", session.rep_id)
    .single();

  return NextResponse.json({
    data: {
      session,
      ventas: ventas ?? [],
      commissions: commissions ?? [],
      rep: repProfile ?? null,
    },
  });
}
