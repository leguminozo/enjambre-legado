import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await context.params;
  const input = await request.json();

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status")
    .eq("id", sessionId)
    .eq("rep_id", user.id)
    .single();

  if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  if (session.session_status !== "open") return NextResponse.json({ error: "La sesión ya está cerrada" }, { status: 400 });

  const { data: ventas } = await supabase
    .from("ventas")
    .select("total, metodo_pago")
    .eq("cash_session_id", sessionId);

  const cashSales = ((ventas as any[]) ?? []).reduce(
    (sum: number, v: any) => v.metodo_pago === "efectivo" ? sum + v.total : sum, 0
  );

  const breakdown: Record<string, number> = {};
  for (const v of ((ventas as any[]) ?? [])) {
    breakdown[v.metodo_pago] = (breakdown[v.metodo_pago] ?? 0) + v.total;
  }

  const { data: openSession } = await supabase
    .from("cash_sessions")
    .select("opening_cash")
    .eq("id", sessionId)
    .single();

  const expectedCash = (openSession?.opening_cash ?? 0) + cashSales;
  const difference = input.closing_cash_counted - expectedCash;

  const { data: commissionSummary } = await supabase
    .from("commission_records")
    .select("total_commission")
    .eq("session_id", sessionId);

  const totalCommission = (commissionSummary ?? []).reduce(
    (sum: number, r: { total_commission: number }) => sum + Number(r.total_commission), 0
  );

  const { data, error } = await supabase
    .from("cash_sessions")
    .update({
      closing_cash_counted: input.closing_cash_counted,
      session_status: "closed",
      closed_at: new Date().toISOString(),
      notas: input.notas ?? null,
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    data,
    summary: {
      cash_sales: cashSales,
      expected_cash: expectedCash,
      counted_cash: input.closing_cash_counted,
      difference,
      total_commission: totalCommission,
      breakdown,
    },
  });
}
