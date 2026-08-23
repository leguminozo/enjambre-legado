import { type NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resolveProfileRole } from '@/lib/shop/resolve-profile-role';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { buildOpenBookFromArboles, getMetodologiaPublica } from '@enjambre/impacto';

/**
 * Impacto (open-book + metodología) — NO público.
 * GET: sesión obligatoria; lee el snapshot publicado (impacto_publico, RLS
 * doble candado: publicado=true + authenticated). Nunca toca datos vivos.
 * POST: staff admin; ÚNICO punto que agrega arboles_plantados y congela el
 * snapshot (acto deliberado de publicación).
 */

function isStaff(role: string): boolean {
  return isNucleoStaffRole(role);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ code: 'auth_required', message: 'Sesión requerida' }, { status: 401 });
  }

  const loose = supabase as unknown as SupabaseClient;
  const { data, error } = await loose
    .from('impacto_publico')
    .select('*')
    .eq('publicado', true)
    .order('generado_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ code: 'query_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      metodologia: getMetodologiaPublica(),
      openBook: data ?? null,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ code: 'auth_required', message: 'Sesión requerida' }, { status: 401 });
  }

  const role = await resolveProfileRole(supabase, user, { forceDb: true });
  if (!isStaff(role)) {
    return NextResponse.json({ code: 'forbidden', message: 'Solo staff' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ code: 'admin_unavailable' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('arboles_plantados')
    .select('cantidad, co2_ton, sector, especie')
    .limit(5000);
  if (error) {
    return NextResponse.json({ code: 'query_failed', message: error.message }, { status: 500 });
  }

  const book = buildOpenBookFromArboles(data ?? []);
  const { data: fila, error: insErr } = await admin
    .from('impacto_publico')
    .insert({
      arboles_plantados: book.arboles_plantados,
      co2_secuestrado_ton: book.co2_secuestrado_ton,
      irr_simplificado: book.irr_simplificado,
      zonas: book.zonas,
      especies: book.especies,
      nota: book.nota,
      metodologia_version: book.metodologia_version,
      publicado: true,
    })
    .select()
    .single();
  if (insErr) {
    return NextResponse.json({ code: 'snapshot_insert_failed', message: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ data: fila }, { status: 201 });
}