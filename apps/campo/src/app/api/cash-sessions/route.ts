import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const empresaId = user.app_metadata?.empresa_id;
  const input = await request.json();

  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("rep_id", user.id)
    .eq("session_status", "open")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ code: "session_already_open", message: "Ya tienes una sesión de caja abierta" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("cash_sessions")
    .insert({
      empresa_id: empresaId,
      rep_id: user.id,
      opening_cash: input.opening_cash,
      session_status: "open",
    })
    .select("id, opened_at, opening_cash, session_status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
