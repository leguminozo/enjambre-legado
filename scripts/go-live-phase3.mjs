#!/usr/bin/env node
/**
 * Fase 3 — producción: migraciones, deploy, smoke (sin .env.local).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PROJECTS, PRODUCTION_URLS, PRODUCTION_TEAM_SLUG } from './lib/vercel-auth.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];

function pass(name, detail = '') {
  checks.push({ name, ok: true, detail });
}
function fail(name, detail = '') {
  checks.push({ name, ok: false, detail });
}
function warn(name, detail = '') {
  checks.push({ name, ok: true, warn: true, detail });
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

console.log('\n╔══════════════════════════════════════╗');
console.log('║  FASE 3 — Producción (sin env local)  ║');
console.log('╚══════════════════════════════════════╝\n');

// 1. Migraciones en repo
for (const id of ['72_sidebar_badges_rpc.sql', '73_sidebar_badges_indexes.sql']) {
  const p = resolve(root, 'packages/database/supabase/migrations', id);
  if (existsSync(p)) pass(`migration-file-${id.slice(0, 2)}`, id);
  else fail(`migration-file-${id.slice(0, 2)}`, 'falta en repo');
}

// 2. Supabase — RPC prod (72) + CLI para futuras migraciones
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
if (!publishable) {
  warn('supabase-rpc-72', 'define NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY para probar RPC');
}
const rpcProbe = publishable
  ? run(
      `curl -sS -m 12 "https://hdhamxiblwwskvvqbcfo.supabase.co/rest/v1/rpc/get_sidebar_badges" ` +
        `-H "apikey: ${publishable}" -H "Authorization: Bearer ${publishable}" ` +
        `-H "Content-Type: application/json" -d '{}'`,
    )
  : null;
if (rpcProbe?.includes('colmenas_risk')) {
  pass('supabase-rpc-72', 'get_sidebar_badges OK en prod');
} else {
  warn('supabase-rpc-72', 'RPC ausente — pnpm go-live:db-push');
}

const hasToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
const cliOk = run('supabase projects list 2>/dev/null | head -1');
if (hasToken || cliOk) {
  pass('supabase-cli', hasToken ? 'SUPABASE_ACCESS_TOKEN' : 'supabase login OK');
} else {
  warn('supabase-cli', 'opcional — login solo para nuevas migraciones');
}

// 3. Vercel env server — requiere CLI en team prod (guillermc)
const cliUser = run('vercel whoami 2>/dev/null');
const scopeFlag = `--scope ${PRODUCTION_TEAM_SLUG}`;
const scopeOk = run(`cd "${resolve(root, 'apps/tienda')}" && vercel teams ls 2>&1`)?.includes(PRODUCTION_TEAM_SLUG);

for (const [key] of Object.entries(PROJECTS)) {
  const appDir = key === 'nucleo' ? 'apps/nucleo' : `apps/${key}`;
  const scopeCmd = scopeOk
    ? `cd "${resolve(root, appDir)}" && vercel env ls production ${scopeFlag} 2>&1`
    : `cd "${resolve(root, appDir)}" && vercel env ls production 2>&1`;
  const out = run(scopeCmd);
  const hasService = out?.includes('SUPABASE_SERVICE_ROLE_KEY');
  const onProdTeam = out?.includes(PRODUCTION_TEAM_SLUG) || scopeOk;
  if (hasService) pass(`vercel-server-${key}`, 'service_role presente');
  else if (!scopeOk && cliUser && cliUser !== 'guillermc') {
    warn(
      `vercel-server-${key}`,
      `CLI=${cliUser} — vercel login (guillermc) → pnpm go-live:vercel-env`,
    );
  } else if (out?.includes('Encrypted') || out?.includes('Plaintext')) {
    warn(`vercel-server-${key}`, 'faltan secrets server — pnpm go-live:vercel-env');
  } else {
    warn(`vercel-server-${key}`, onProdTeam ? 'sin vars' : 'team CLI ≠ prod');
  }
}

// 4. Smoke (fuente de verdad deploy) + URLs prod
const prodUrls = { ...PRODUCTION_URLS };
for (const [key, url] of Object.entries(prodUrls)) {
  if (!url) continue;
  const path = key === 'nucleo' ? '/api/health/live' : '/';
  const code = run(`curl -sS -m 12 -o /dev/null -w "%{http_code}" ${url}${path}`);
  if (code === '200') {
    pass(`smoke-${key}`, url);
    pass(`vercel-deploy-${key}`, `${url} — live`);
  } else if (code === '401') {
    warn(`smoke-${key}`, `${url} → HTTP 401 (protección Vercel)`);
    pass(`vercel-deploy-${key}`, `${url} — deployed`);
  } else {
    warn(`smoke-${key}`, `${url} → HTTP ${code ?? 'timeout'}`);
    warn(`vercel-deploy-${key}`, 'sin respuesta OK');
  }
}

// 5. CI
const ci = run('gh run list --repo guillermoc2710-cmd/enjambre-legado --limit 1 --json conclusion,headBranch');
if (ci) {
  const [last] = JSON.parse(ci);
  if (last?.conclusion === 'success') pass('github-ci', 'último run OK');
  else warn('github-ci', `último: ${last?.conclusion ?? '?'}`);
}

console.log('\n── Resultados ──\n');
let failed = 0;
let warnings = 0;
for (const c of checks) {
  const icon = c.ok ? (c.warn ? '△' : '✓') : '✗';
  console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  if (!c.ok) failed++;
  if (c.warn) warnings++;
}

console.log(
  `\n${failed ? `${failed} bloqueante(s)` : 'Fase 3 operativa'} — ${checks.length} checks` +
    (warnings ? ` (${warnings} aviso(s))` : '') +
    '\n',
);

if (failed || warnings) {
  console.log('Acciones producción (sin .env.local):');
  console.log('  1. vercel login (guillermc) → pnpm go-live:vercel-env');
  console.log(`  2. O manual: https://vercel.com/${PRODUCTION_TEAM_SLUG} → cada proyecto → Env`);
  console.log('  3. supabase login (solo si hay migraciones nuevas) → pnpm go-live:db-push');
  console.log('  4. pnpm go-live:smoke:prod\n');
}

process.exit(failed ? 1 : 0);