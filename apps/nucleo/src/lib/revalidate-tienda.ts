/**
 * Pide a la app Tienda invalidar ISR/layout tras mutaciones CMS.
 * Devuelve ok:false si no pudo invalidar (URL ausente, secret, red) —
 * el editor avisa al operador; el save de site_content no se revierte.
 */

export type RevalidateTiendaResult = {
  ok: boolean;
  reason?: 'missing_url' | 'missing_secret' | 'http_error' | 'network';
  status?: number;
};

function tiendaBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_URL_TIENDA ||
    process.env.NEXT_PUBLIC_TIENDA_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
}

function revalidateSecret(): string {
  return (
    process.env.CMS_REVALIDATE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    ''
  );
}

export async function revalidateTiendaCms(): Promise<RevalidateTiendaResult> {
  const base = tiendaBaseUrl();
  if (!base) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[revalidate-tienda] NEXT_PUBLIC_URL_TIENDA no configurada');
    }
    return { ok: false, reason: 'missing_url' };
  }

  const secret = revalidateSecret();
  const url = `${base}/api/cms/revalidate`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret
          ? {
              Authorization: `Bearer ${secret}`,
              'x-revalidate-secret': secret,
            }
          : {}),
      },
      body: JSON.stringify(secret ? { secret } : {}),
      // No cachear la petición de invalidación
      cache: 'no-store',
    });

    if (!res.ok) {
      let text = '';
      try {
        text = await res.text();
      } catch {
        // ignore
      }
      console.warn(`[revalidate-tienda] ${res.status} ${text.slice(0, 200)}`);
      return { ok: false, reason: 'http_error', status: res.status };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    console.warn('[revalidate-tienda] fetch failed', err);
    return { ok: false, reason: 'network' };
  }
}

/**
 * Invalida el layout completo de la Tienda (revalidatePath('/', 'layout')).
 * Se dispara tras mutaciones que cambian el catálogo visible: stock, precio,
 * fotos, visible, lotes públicos y ventas (stock decrementado).
 * Auth: el endpoint de la Tienda exige Bearer SUPABASE_SERVICE_ROLE_KEY.
 * Fail-open: nunca bloquea la mutación original.
 */
export async function revalidateTiendaLayout(): Promise<RevalidateTiendaResult> {
  const base = tiendaBaseUrl();
  if (!base) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[revalidate-tienda] NEXT_PUBLIC_URL_TIENDA no configurada');
    }
    return { ok: false, reason: 'missing_url' };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    console.warn('[revalidate-tienda] SUPABASE_SERVICE_ROLE_KEY no configurada');
    return { ok: false, reason: 'missing_secret' };
  }

  const url = `${base}/api/revalidate`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ path: '/', type: 'layout' }),
      // No cachear la petición de invalidación
      cache: 'no-store',
    });

    if (!res.ok) {
      let text = '';
      try {
        text = await res.text();
      } catch {
        // ignore
      }
      console.warn(`[revalidate-tienda] ${res.status} ${text.slice(0, 200)}`);
      return { ok: false, reason: 'http_error', status: res.status };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    console.warn('[revalidate-tienda] fetch failed', err);
    return { ok: false, reason: 'network' };
  }
}
