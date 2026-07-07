/**
 * Checks cross-app compartidos entre smoke-test.mjs y smoke-production.mjs
 */

export function tiendaCheckoutQuoteTarget(nucleo, tienda) {
  return {
    name: 'nucleo checkout quote (tienda origin)',
    url: `${nucleo}/api/checkout/quote`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: tienda,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: {
      subtotal: 10000,
      region: 'Metropolitana',
      courierCode: 'blueexpress',
    },
    expectStatus: 200,
    expectJsonKeys: ['total', 'shippingCost'],
    configHint:
      'Cotización básica requiere NEXT_PUBLIC_SUPABASE_URL en Núcleo; descuentos/puntos requieren SUPABASE_SERVICE_ROLE_KEY — pnpm go-live:vercel-env',
  };
}

export function nucleoFeriaContextTargets(nucleo, campo) {
  return [
    {
      name: 'nucleo feria-context sin auth → 401',
      url: `${nucleo}/api/rep-ventas/feria-context`,
      expectStatus: 401,
      expectJson: { code: 'unauthorized' },
    },
    {
      name: 'nucleo feria-context token inválido → 401',
      url: `${nucleo}/api/rep-ventas/feria-context`,
      headers: { Authorization: 'Bearer __smoke_invalid__' },
      expectStatus: 401,
      expectJson: { code: 'unauthorized' },
    },
    ...(campo
      ? [
          {
            name: 'nucleo feria-context CORS preflight (campo)',
            url: `${nucleo}/api/rep-ventas/feria-context`,
            method: 'OPTIONS',
            headers: {
              Origin: campo,
              'Access-Control-Request-Method': 'GET',
              'Access-Control-Request-Headers': 'authorization,content-type',
            },
            expectStatus: [200, 204],
            expectHeaderIncludes: { 'access-control-allow-origin': campo },
            configHint:
              'Falta NEXT_PUBLIC_URL_CAMPO en Núcleo prod — Campo no puede llamar BFF — pnpm go-live:vercel-env',
          },
        ]
      : []),
  ];
}

export function tiendaPerfilGuardTargets(tienda) {
  return [
    {
      name: 'tienda guard /perfil → login',
      url: `${tienda}/perfil`,
      redirect: 'manual',
      expectStatus: [307, 308, 302, 303],
      expectLocationIncludes: '/login',
    },
    {
      name: 'tienda guard /perfil/creador → login + returnTo',
      url: `${tienda}/perfil/creador`,
      redirect: 'manual',
      expectStatus: [307, 308, 302, 303],
      expectLocationIncludes: '/login',
      expectLocationIncludesAll: ['returnTo', 'creador'],
    },
    {
      name: 'tienda guard /perfil/mayorista → login',
      url: `${tienda}/perfil/mayorista`,
      redirect: 'manual',
      expectStatus: [307, 308, 302, 303],
      expectLocationIncludes: '/login',
    },
  ];
}

export async function runSmokeTarget(t, fetchOptions = {}) {
  const res = await fetch(t.url, {
    method: t.method ?? 'GET',
    headers: t.headers,
    body: t.body ? JSON.stringify(t.body) : undefined,
    redirect: t.redirect ?? 'follow',
    signal: AbortSignal.timeout(15000),
    ...fetchOptions,
  });

  const expectedStatuses = Array.isArray(t.expectStatus)
    ? t.expectStatus
    : [t.expectStatus ?? 200];
  let ok = expectedStatuses.includes(res.status);
  let body;
  let text;

  if (t.expectJson || t.expectJsonKeys) {
    try {
      body = await res.json();
    } catch {
      ok = false;
    }
  } else if (t.expectBodyIncludes) {
    text = await res.text();
  }

  if (ok && t.expectJson) {
    for (const [k, v] of Object.entries(t.expectJson)) {
      if (body?.[k] !== v) ok = false;
    }
  }

  if (ok && t.expectJsonKeys) {
    for (const k of t.expectJsonKeys) {
      if (body?.[k] === undefined) ok = false;
    }
  }

  if (ok && t.expectBodyIncludes) {
    ok = text?.includes(t.expectBodyIncludes) ?? false;
  }

  if (ok && t.expectLocationIncludes) {
    const location = res.headers.get('location') ?? '';
    ok = location.includes(t.expectLocationIncludes);
    if (ok && t.expectLocationIncludesAll) {
      ok = t.expectLocationIncludesAll.every((part) => location.includes(part));
    }
  }

  let headerConfigFailure = false;
  if (t.expectHeaderIncludes) {
    for (const [header, value] of Object.entries(t.expectHeaderIncludes)) {
      const actual = res.headers.get(header);
      if (!actual || !actual.includes(value)) {
        ok = false;
        headerConfigFailure = true;
      }
    }
  }

  const configFailure =
    headerConfigFailure ||
    (!ok &&
      body?.code === 'quote_failed' &&
      (body.message ?? '').toLowerCase().includes('missing supabase'));

  return { ok, res, body, text, configFailure };
}