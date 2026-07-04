#!/usr/bin/env node
/**
 * Smoke test producción — resuelve URLs desde Vercel API o env.
 */
import { PROJECTS, TEAM_ID, PRODUCTION_URLS, vercelFetch } from './lib/vercel-auth.mjs';

async function resolveProdUrl(key, fallback) {
  if (process.env[`${key.toUpperCase()}_URL`]) {
    return process.env[`${key.toUpperCase()}_URL`];
  }
  const envMap = {
    nucleo: process.env.NUCLEO_URL,
    tienda: process.env.TIENDA_URL ?? process.env.NEXT_PUBLIC_URL_TIENDA,
    campo: process.env.CAMPO_URL ?? process.env.NEXT_PUBLIC_URL_CAMPO,
  };
  if (envMap[key]) return envMap[key];
  if (PRODUCTION_URLS[key]) return PRODUCTION_URLS[key];

  try {
    const proj = PROJECTS[key];
    const p = await vercelFetch(`/v9/projects/${proj.id}`, { teamId: TEAM_ID });
    if (proj.productionUrl) return proj.productionUrl;
    const aliases = p.targets?.production?.alias ?? [];
    const short = aliases.find(
      (a) => !a.includes('-gabos-projects-') && !a.includes('-gaboxxc-') && !a.includes('-8540s-projects'),
    );
    if (short) return `https://${short.replace(/^https?:\/\//, '')}`;
  } catch {
    /* fallback */
  }
  return fallback;
}

const NUCLEO = await resolveProdUrl('nucleo', 'https://nucleo-theta.vercel.app');
const TIENDA = await resolveProdUrl('tienda', '');
const CAMPO = await resolveProdUrl('campo', '');

const targets = [
  { name: 'nucleo /api/health/live', url: `${NUCLEO}/api/health/live`, expectJson: { status: 'ok' } },
  { name: 'nucleo home', url: `${NUCLEO}/`, expectStatus: 200 },
];

if (TIENDA) {
  for (const path of ['/', '/catalogo', '/carrito', '/checkout']) {
    targets.push({ name: `tienda ${path}`, url: `${TIENDA}${path}`, expectStatus: 200 });
  }

  targets.push({
    name: 'nucleo checkout quote',
    url: `${NUCLEO}/api/checkout/quote`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TIENDA,
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
      'Falta SUPABASE_SERVICE_ROLE_KEY en Núcleo prod — pnpm go-live:vercel-env',
  });
}
if (CAMPO) targets.push({ name: 'campo home', url: `${CAMPO}/`, expectStatus: 200 });

console.log('\n=== Smoke producción ===\n');
console.log(`Núcleo: ${NUCLEO}`);
if (TIENDA) console.log(`Tienda: ${TIENDA}`);
if (CAMPO) console.log(`Campo:  ${CAMPO}`);
console.log('');

let failed = 0;
for (const t of targets) {
  try {
    const res = await fetch(t.url, {
      method: t.method ?? 'GET',
      headers: t.headers,
      body: t.body ? JSON.stringify(t.body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    let ok = res.status === (t.expectStatus ?? 200);
    let body;

    if (t.expectJson || t.expectJsonKeys) {
      body = await res.json();
    }

    if (ok && t.expectJson) {
      for (const [k, v] of Object.entries(t.expectJson)) {
        if (body[k] !== v) ok = false;
      }
    }

    if (ok && t.expectJsonKeys) {
      for (const k of t.expectJsonKeys) {
        if (body[k] === undefined) ok = false;
      }
    }

    if (!ok && body?.code === 'quote_failed') {
      const msg = (body.message ?? '').toLowerCase();
      if (msg.includes('missing supabase') || msg.includes('service_role')) {
        console.log(`✗ ${t.name} → ${res.status} (config)`);
        console.log(`    ${body.message}`);
        if (t.configHint) console.log(`    → ${t.configHint}`);
        failed++;
        continue;
      }
    }

    console.log(ok ? `✓ ${t.name} → ${res.status}` : `✗ ${t.name} → ${res.status}`);
    if (!ok && body?.message) console.log(`    ${body.message}`);
    if (!ok) failed++;
  } catch (err) {
    failed++;
    console.log(`✗ ${t.name} — ${err instanceof Error ? err.message : err}`);
  }
}

console.log(failed ? `\n${failed} fallo(s)\n` : '\nProducción OK\n');
process.exit(failed ? 1 : 0);