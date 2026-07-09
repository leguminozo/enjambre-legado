import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const empresaId = user.app_metadata?.empresa_id;
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  // Reps should only export their own sessions. Admins can export all.
  let query = supabase
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_cash, closing_cash_counted, cash_difference, session_status, rep_id")
    .gte("opened_at", from)
    .lte("opened_at", to + "T23:59:59")
    .order("opened_at", { ascending: true });

  if (user.app_metadata?.role !== 'admin') {
    query = query.eq('rep_id', user.id);
  } else if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  const { data: sessions } = await query;
  const sessionIds = (sessions ?? []).map((s: any) => s.id);

  const { data: commissions } = await supabase
    .from("commission_records")
    .select("session_id, rep_id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, total_commission, paid, created_at")
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true });

  const { data: reps } = await supabase
    .from("rep_profiles")
    .select("user_id, display_name, commission_tier");

  const repMap = new Map((reps ?? []).map((r: any) => [r.user_id, r]));

  const header = "fecha,rep,tier,efectivo_inicial,efectivo_contado,diferencia,estado,comision_base,multiplicador,loyalty,streak,comision_total,pagada\n";
  const rows = [];

  for (const s of sessions ?? []) {
    const rep = repMap.get(s.rep_id);
    const sessionComms = (commissions ?? []).filter((c: any) => c.session_id === s.id);
    const totalBase = sessionComms.reduce((sum: number, c: any) => sum + Number(c.base_commission), 0);
    const totalMultiplier = sessionComms.length > 0 ? sessionComms.reduce((sum: number, c: any) => sum + Number(c.volume_multiplier), 0) / sessionComms.length : 0;
    const totalLoyalty = sessionComms.reduce((sum: number, c: any) => sum + Number(c.loyalty_bonus), 0);
    const totalStreak = sessionComms.reduce((sum: number, c: any) => sum + Number(c.streak_bonus), 0);
    const totalComm = sessionComms.reduce((sum: number, c: any) => sum + Number(c.total_commission), 0);
    const allPaid = sessionComms.length > 0 && sessionComms.every((c: any) => c.paid);

    rows.push([
      s.opened_at.slice(0, 10),
      `"${rep?.display_name ?? 'desconocido'}"`,
      rep?.commission_tier ?? 'base',
      s.opening_cash,
      s.closing_cash_counted ?? '',
      s.cash_difference ?? '',
      s.session_status,
      totalBase,
      totalMultiplier.toFixed(2),
      totalLoyalty,
      totalStreak,
      totalComm,
      allPaid ? 'si' : 'no',
    ].join(','));
  }

  const csv = header + rows.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cierres-caja_${from}_${to}.csv"`,
    }
  });
}
