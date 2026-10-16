import { NextResponse } from 'next/server';
import { exportAccountData } from '@/app/actions/account-privacy';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await exportAccountData();
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="oyz-datos-personales-${dateStr}.json"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API /api/usuario/exportar] Error:', error);
    return NextResponse.json(
      { error: 'Error al exportar los datos personales' },
      { status: 500 },
    );
  }
}

export async function POST() {
  return GET();
}
