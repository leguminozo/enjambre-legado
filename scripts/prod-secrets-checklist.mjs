#!/usr/bin/env node
/**
 * Checklist de secrets / headers en prod (nucleo + tienda).
 * - Sin VERCEL_TOKEN: valida headers públicos + lista de keys requeridas.
 * - Con VERCEL_TOKEN + VERCEL_TEAM_ID opcional: intenta `vercel env ls` si CLI existe.
 *
 * No imprime valores de secretos.
 */
import { execSync } from 'node:child_process';

const NUCLEO = process.env.CHECK_NUCLEO_URL || 'https://nucleo-theta.vercel.app';
const TIENDA = process.env.CHECK_TIENDA_URL || 'https://tienda-eta-lime.vercel.app';

const REQUIRED = {
  nucleo: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_API_SECRET',
    'NEXT_PUBLIC_URL_TIENDA',
    'NEXT_PUBLIC_NUCLEO_API_URL',
    'SII_CLAVE_ENCRYPTION_KEY',
    'CRON_SECRET',
    'PAYMENT_PROVIDER + (FLOW_* o TRANSBANK_*)',
  ],
  tienda: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_NUCLEO_API_URL',
    'NEXT_PUBLIC_SITE_URL',
    'INTERNAL_API_SECRET|CMS_REVALIDATE_SECRET',
  ],
  campo: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_NUCLEO_API_URL',
    'NEXT_PUBLIC_URL_TIENDA',
    'INTERNAL_API_SECRET',
  ],
};

async function head(url) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  const headers = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return { status: res.status, headers };
}

function checkCsp(name, headers, expectations) {
  const csp = headers['content-security-policy'] || '';
  const xfo = headers['x-frame-options'] || '';
  console.log(`\n▸ ${name}`);
  console.log(`  HTTP ${expectations.url} → status check via HEAD`);
  for (const [label, ok] of expectations.checks(csp, xfo)) {
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
  }
  if (!csp) console.log('  ⚠️  sin Content-Security-Policy');
}

let failed = false;

console.log('=== Prod secrets / headers checklist (nucleo + tienda) ===\n');
console.log(`Nucleo: ${NUCLEO}`);
console.log(`Tienda: ${TIENDA}`);

console.log('\n--- Keys que DEBEN existir en Vercel (manual o vercel env ls) ---\n');
for (const [app, keys] of Object.entries(REQUIRED)) {
  console.log(`${app}:`);
  for (const k of keys) console.log(`  □ ${k}`);
}

try {
  const n = await head(NUCLEO + '/');
  const t = await head(TIENDA + '/');

  checkCsp('nucleo CSP', n.headers, {
    url: NUCLEO,
    checks: (csp) => [
      ['frame-src presente (iframe editor)', /frame-src/i.test(csp)],
      ['frame-src permite vercel/tienda', /frame-src[^;]*vercel|tienda|obrerayzangano/i.test(csp)],
    ],
  });
  if (!/frame-src/i.test(n.headers['content-security-policy'] || '')) failed = true;

  checkCsp('tienda CSP', t.headers, {
    url: TIENDA,
    checks: (csp, xfo) => [
      ['frame-ancestors permite embeber desde nucleo', /frame-ancestors/i.test(csp)],
      [
        'sin X-Frame-Options SAMEORIGIN (rompe preview CMS)',
        !/sameorigin/i.test(xfo),
      ],
      ['frame-ancestors incluye vercel o self', /frame-ancestors[^;]*vercel|self/i.test(csp)],
    ],
  });
  const tCsp = t.headers['content-security-policy'] || '';
  const tXfo = t.headers['x-frame-options'] || '';
  if (!/frame-ancestors/i.test(tCsp)) failed = true;
  if (/sameorigin/i.test(tXfo)) failed = true;

  console.log('\n--- Consistencia operativa ---\n');
  console.log('  □ INTERNAL_API_SECRET igual en nucleo y tienda (Vercel)');
  console.log('  □ CMS_REVALIDATE_SECRET igual o ausente en ambos (fallback INTERNAL)');
  console.log('  □ NEXT_PUBLIC_URL_TIENDA (nucleo) = origen real de la tienda');
  console.log('  □ NEXT_PUBLIC_NUCLEO_API_URL (tienda) = origen real del nucleo');
  console.log('  □ Buckets Supabase: cms + productos; RLS admin upload');
} catch (e) {
  console.error('\n❌ No se pudo HEAD prod:', e instanceof Error ? e.message : e);
  failed = true;
}

// Optional Vercel CLI
if (process.env.VERCEL_TOKEN) {
  console.log('\n--- vercel env (token detectado) ---\n');
  try {
    const out = execSync('vercel env ls production 2>&1 | head -40', {
      encoding: 'utf8',
      env: process.env,
      timeout: 30_000,
    });
    console.log(out);
  } catch {
    console.log('  ⚠️  vercel CLI no disponible o no linkeado en este cwd');
  }
} else {
  console.log('\n(tip) export VERCEL_TOKEN=… y link del proyecto para listar env reales\n');
}

console.log(failed ? '\nResult: FAIL (headers CSP/frame)' : '\nResult: OK headers; completar □ secrets en Vercel a mano');
process.exit(failed ? 1 : 0);
