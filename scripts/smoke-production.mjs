#!/usr/bin/env node
/**
 * Smoke test producción — resuelve URLs desde Vercel API o env.
 */
import { PROJECTS, TEAM_ID, PRODUCTION_URLS, vercelFetch } from './lib/vercel-auth.mjs';
import {
  nucleoFeriaContextTargets,
  runSmokeTarget,
  tiendaCheckoutQuoteTarget,
  tiendaPerfilGuardTargets,
} from './lib/ecosystem-smoke.mjs';

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
  ...nucleoFeriaContextTargets(NUCLEO, CAMPO || null),
];

if (TIENDA) {
  for (const path of ['/', '/catalogo', '/carrito', '/checkout']) {
    targets.push({ name: `tienda ${path}`, url: `${TIENDA}${path}`, expectStatus: 200 });
  }

  targets.push({
    name: 'tienda claim route (invalid token)',
    url: `${TIENDA}/claim/__smoke_invalid__`,
    expectStatus: [200, 404],
    expectBodyIncludes: '404',
  });

  targets.push(tiendaCheckoutQuoteTarget(NUCLEO, TIENDA));
  targets.push(...tiendaPerfilGuardTargets(TIENDA));
}

if (CAMPO) targets.push({ name: 'campo home', url: `${CAMPO}/`, expectStatus: 200 });

console.log('\n=== Smoke producción (E2 cross-app) ===\n');
console.log(`Núcleo: ${NUCLEO}`);
if (TIENDA) console.log(`Tienda: ${TIENDA}`);
if (CAMPO) console.log(`Campo:  ${CAMPO}`);
console.log('');

let failed = 0;
for (const t of targets) {
  try {
    const { ok, res, body, configFailure } = await runSmokeTarget(t);

    if (configFailure) {
      console.log(`✗ ${t.name} → ${res.status} (config)`);
      if (body?.message) console.log(`    ${body.message}`);
      if (t.configHint) console.log(`    → ${t.configHint}`);
      failed++;
      continue;
    }

    console.log(ok ? `✓ ${t.name} → ${res.status}` : `✗ ${t.name} → ${res.status}`);
    if (!ok && body?.message) console.log(`    ${body.message}`);
    if (!ok) failed++;
  } catch (err) {
    failed++;
    console.log(`✗ ${t.name} — ${err instanceof Error ? err.message : err}`);
  }
}

console.log(failed ? `\n${failed} fallo(s)\n` : '\nProducción OK (E2)\n');
process.exit(failed ? 1 : 0);