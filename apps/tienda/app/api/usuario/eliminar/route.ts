import { NextRequest, NextResponse } from 'next/server';
import { deleteAccountInstantly } from '@/app/actions/account-privacy';
import { createClient } from '@/utils/supabase/server';
import { guardMutation } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const csrfBlock = guardMutation(req);
    if (csrfBlock) return csrfBlock;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let confirm = '';
    try {
      const body = (await req.json()) as { confirm?: unknown };
      confirm = typeof body.confirm === 'string' ? body.confirm : '';
    } catch {
      // Body ausente o no JSON
    }

    if (confirm.trim() !== 'ELIMINAR') {
      return NextResponse.json(
        { error: 'Para confirmar la eliminación permanente, envía { "confirm": "ELIMINAR" }' },
        { status: 400 },
      );
    }

    await deleteAccountInstantly();

    return NextResponse.json({
      ok: true,
      message: 'Cuenta y datos personales eliminados conforme a la Ley 21.719.',
    });
  } catch (error) {
    console.error('[API /api/usuario/eliminar] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la supresión de cuenta' },
      { status: 500 },
    );
  }
}
