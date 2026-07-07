#!/usr/bin/env node
/**
 * Smoke test local o producción — sin imprimir secretos.
 * Uso:
 *   node scripts/smoke-test.mjs
 *   NUCLEO_URL=https://nucleo-theta.vercel.app node scripts/smoke-test.mjs
 */
import {
  nucleoFeriaContextTargets,
  runSmokeTarget,
  tiendaCheckoutQuoteTarget,
  tiendaPerfilGuardTargets,
} from './lib/ecosystem-smoke.mjs';

const NUCLEO = process.env.NUCLEO_URL ?? 'http://localhost:3000';
const TIENDA = process.env.TIENDA_URL ?? 'http://localhost:3001';
const CAMPO = process.env.CAMPO_URL ?? 'http://localhost:3002';

const tiendaPageTargets = ['/', '/catalogo', '/carrito', '/checkout'].map((path) => ({
  name: `tienda ${path}`,
  url: `${TIENDA}${path}`,
  expectStatus: 200,
}));

const targets = [
  { name: 'nucleo health/live', url: `${NUCLEO}/api/health/live`, expectJson: { status: 'ok' } },
  { name: 'nucleo home', url: `${NUCLEO}/`, expectStatus: 200 },
  ...nucleoFeriaContextTargets(NUCLEO, CAMPO),
  ...tiendaPageTargets,
  { name: 'campo home', url: `${CAMPO}/`, expectStatus: 200 },
  {
    name: 'tienda claim route (invalid token)',
    url: `${TIENDA}/claim/__smoke_invalid__`,
    expectStatus: [200, 404],
    expectBodyIncludes: '404',
  },
  tiendaCheckoutQuoteTarget(NUCLEO, TIENDA),
  ...tiendaPerfilGuardTargets(TIENDA),
];

console.log('\n=== Smoke test Enjambre Legado (E2) ===\n');
console.log(`Núcleo: ${NUCLEO}`);
console.log(`Tienda: ${TIENDA}`);
console.log(`Campo:  ${CAMPO}\n`);

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

console.log(failed ? `\n${failed} check(s) failed\n` : '\nAll checks passed (E2)\n');
process.exit(failed ? 1 : 0);