import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Invalida el layout o paths específicos de la Tienda.
 * Invocado por Núcleo tras mutaciones de stock, precio, catálogo, ventas y checkout.
 * Auth: Bearer SUPABASE_SERVICE_ROLE_KEY | INTERNAL_API_SECRET | CMS_REVALIDATE_SECRET
 */

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: NextRequest) {
  const allowedSecrets = [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    process.env.INTERNAL_API_SECRET?.trim(),
    process.env.CMS_REVALIDATE_SECRET?.trim(),
  ].filter((s): s is string => Boolean(s && s.length > 0));

  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerSecret = req.headers.get('x-revalidate-secret')?.trim() ?? '';

  let bodySecret = '';
  let path = '/';
  let type: 'layout' | 'page' = 'layout';

  try {
    const body = (await req.json()) as { secret?: string; path?: string; type?: string };
    if (typeof body?.secret === 'string') bodySecret = body.secret.trim();
    if (typeof body?.path === 'string' && body.path.startsWith('/')) path = body.path;
    if (body?.type === 'page' || body?.type === 'layout') type = body.type;
  } catch {
    /* empty or non-json body is fine */
  }

  const provided = bearer || headerSecret || bodySecret;
  const isDev = process.env.NODE_ENV === 'development';

  if (allowedSecrets.length > 0) {
    const isAuthorized = allowedSecrets.some((secret) => timingSafeEqualString(provided, secret));
    if (!isAuthorized) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  } else if (!isDev) {
    return NextResponse.json(
      { ok: false, error: 'No revalidation secret configured' },
      { status: 503 },
    );
  }

  if (type === 'layout') {
    revalidatePath(path, 'layout');
  } else {
    revalidatePath(path);
  }

  // Si se revalida layout raíz, asegurar también la home y catálogo
  if (path === '/' && type === 'layout') {
    revalidatePath('/');
    revalidatePath('/catalogo');
  }

  revalidateTag('products', 'default');
  revalidateTag('taxonomies', 'default');
  revalidateTag('site_content', 'default');
  revalidateTag('store_chrome', 'default');
  revalidateTag('header_menu', 'default');
  revalidateTag('ecosystem_metrics', 'default');

  return NextResponse.json({
    ok: true,
    revalidated: true,
    path,
    type,
    at: new Date().toISOString(),
  });
}
