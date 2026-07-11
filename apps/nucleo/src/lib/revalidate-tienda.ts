/**
 * Pide a la app Tienda invalidar ISR/layout tras mutaciones CMS.
 * Fire-and-forget: no bloquea la respuesta del admin.
 */

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

export async function revalidateTiendaCms(): Promise<void> {
  const base = tiendaBaseUrl();
  if (!base) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[revalidate-tienda] NEXT_PUBLIC_URL_TIENDA no configurada');
    }
    return;
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
      const text = await res.text().catch(() => '');
      console.warn(`[revalidate-tienda] ${res.status} ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn('[revalidate-tienda] fetch failed', err);
  }
}
