#!/usr/bin/env node
/**
 * Smoke test local o producción — sin imprimir secretos.
 * Uso:
 *   node scripts/smoke-test.mjs
 *   NUCLEO_URL=https://nucleo-theta.vercel.app node scripts/smoke-test.mjs
 */
const NUCLEO = process.env.NUCLEO_URL ?? 'http://localhost:3000';
const TIENDA = process.env.TIENDA_URL ?? 'http://localhost:3001';
const CAMPO = process.env.CAMPO_URL ?? 'http://localhost:3002';

const checks = [];

async function probe(name, url, expectStatus = 200) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const ok = res.status === expectStatus;
    checks.push({ name, url, status: res.status, ok, expectStatus });
    if (ok && res.headers.get('content-type')?.includes('json')) {
      const body = await res.json();
      if (name.includes('health/live') && body.status !== 'ok') {
        checks[checks.length - 1].ok = false;
        checks[checks.length - 1].detail = 'body.status !== ok';
      }
    }
  } catch (err) {
    checks.push({ name, url, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

console.log('\n=== Smoke test Enjambre Legado ===\n');
console.log(`Núcleo: ${NUCLEO}`);
console.log(`Tienda: ${TIENDA}`);
console.log(`Campo:  ${CAMPO}\n`);

await probe('nucleo health/live', `${NUCLEO}/api/health/live`);
await probe('nucleo home', `${NUCLEO}/`, 200);
await probe('tienda home', `${TIENDA}/`, 200);
await probe('campo home', `${CAMPO}/`, 200);

let failed = 0;
for (const c of checks) {
  if (c.ok) {
    console.log(`✓ ${c.name} → ${c.status ?? 'ok'}`);
  } else {
    failed++;
    const detail = c.error ?? `expected ${c.expectStatus}, got ${c.status}${c.detail ? ` (${c.detail})` : ''}`;
    console.log(`✗ ${c.name} — ${detail}`);
  }
}

console.log(failed ? `\n${failed} check(s) failed\n` : '\nAll checks passed\n');
process.exit(failed ? 1 : 0);