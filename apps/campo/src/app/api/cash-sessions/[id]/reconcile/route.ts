import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await context.params;
  const input = await request.json();

  const { data, error } = await supabase
    .from("cash_sessions")
    .update({
      session_status: "reconciled",
      reconciled_by: user.id,
      reconciled_at: new Date().toISOString(),
      notas: input.notas ? `${input.notas}` : undefined,
    })
    .eq("id", sessionId)
    .eq("session_status", "closed")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "La sesión debe estar cerrada antes de reconciliar" }, { status: 400 });

  return NextResponse.json({ data });
}
