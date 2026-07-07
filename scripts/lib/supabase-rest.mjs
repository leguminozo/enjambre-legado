/**
 * Consultas mínimas vía PostgREST (service_role) para scripts ops.
 */
export async function supabaseSelect({ url, serviceKey, table, filters = {}, select = '*' }) {
  const params = new URLSearchParams();
  params.set('select', select);
  for (const [col, val] of Object.entries(filters)) {
    params.set(col, val);
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact',
    },
    signal: AbortSignal.timeout(15000),
  });

  let data = [];
  try {
    data = await res.json();
  } catch {
    data = [];
  }

  const range = res.headers.get('content-range');
  const total = range?.includes('/') ? Number(range.split('/')[1]) : data.length;

  return { ok: res.ok, status: res.status, data: Array.isArray(data) ? data : [], total, error: !res.ok ? data : null };
}