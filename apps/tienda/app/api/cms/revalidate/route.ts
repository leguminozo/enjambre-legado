import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Invalida el layout/chrome de la tienda tras guardar CMS desde Núcleo.
 * Auth: Bearer INTERNAL_API_SECRET | CMS_REVALIDATE_SECRET
 * En development sin secret: permitido (preview local).
 */

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: NextRequest) {
  const configured =
    process.env.CMS_REVALIDATE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    '';

  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerSecret = req.headers.get('x-revalidate-secret')?.trim() ?? '';
  let bodySecret = '';
  try {
    const body = (await req.json()) as { secret?: string };
    bodySecret = typeof body?.secret === 'string' ? body.secret.trim() : '';
  } catch {
    /* empty body ok */
  }
  const provided = bearer || headerSecret || bodySecret;

  const isDev = process.env.NODE_ENV === 'development';
  if (configured) {
    if (!provided || !timingSafeEqualString(provided, configured)) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  } else if (!isDev) {
    return NextResponse.json(
      { ok: false, error: 'CMS_REVALIDATE_SECRET o INTERNAL_API_SECRET no configurado' },
      { status: 503 },
    );
  }

  // Layout carga brand + menu; revalidate layout propaga a páginas.
  // Paths editoriales/legales (CMS) se invalidan explícitos por si ISR propio no hereda layout.
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/catalogo');
  revalidatePath('/carrito');
  revalidatePath('/contacto');
  revalidatePath('/nosotros');
  revalidatePath('/galeria');
  revalidatePath('/experiencias');
  revalidatePath('/club-legado-del-bosque');
  revalidatePath('/ciencia');
  revalidatePath('/login');
  revalidatePath('/registro');
  revalidatePath('/terminos');
  revalidatePath('/privacidad');
  revalidatePath('/cookies');
  revalidatePath('/envio');
  revalidatePath('/reembolso');
  revalidatePath('/cancelacion');
  revalidatePath('/garantia');

  return NextResponse.json({
    ok: true,
    revalidated: true,
    at: new Date().toISOString(),
  });
}
