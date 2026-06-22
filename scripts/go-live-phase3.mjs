#!/usr/bin/env node
/**
 * Fase 3 — producción: migraciones, deploy, smoke (sin .env.local).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PROJECTS, TEAM_ID, vercelFetch } from './lib/vercel-auth.mjs';

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

// 2. Supabase CLI / token
const hasToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
const cliOk = run('supabase projects list 2>/dev/null | head -1');
if (hasToken || cliOk) {
  pass('supabase-cli', hasToken ? 'SUPABASE_ACCESS_TOKEN' : 'supabase login OK');
} else {
  warn('supabase-cli', 'supabase login — luego: bash scripts/apply-supabase-migrations.sh');
}

// 3. Vercel env server (service_role)
for (const [key, proj] of Object.entries(PROJECTS)) {
  const appDir = key === 'nucleo' ? 'apps/nucleo' : `apps/${key}`;
  const out = run(`cd "${resolve(root, appDir)}" && vercel env ls production 2>&1`);
  const hasService = out?.includes('SUPABASE_SERVICE_ROLE_KEY');
  const count = (out?.match(/Encrypted|Plaintext|Sensitive/g) ?? []).length;
  if (hasService) pass(`vercel-server-${key}`, 'service_role presente');
  else if (count >= 4) warn(`vercel-server-${key}`, 'faltan secrets server — pnpm go-live:vercel-env');
  else fail(`vercel-server-${key}`, `${count || 0} vars`);
}

// 4. Git + deploy
const prodUrls = {};
try {
  for (const [key, proj] of Object.entries(PROJECTS)) {
    const p = await vercelFetch(`/v9/projects/${proj.id}`, { teamId: TEAM_ID });
    if (p.link?.type === 'github') pass(`vercel-git-${key}`, p.link.repo);
    else warn(`vercel-git-${key}`, 'conectar Git en dashboard');

    const deps = await vercelFetch(`/v6/deployments?projectId=${proj.id}&target=production&limit=1`, {
      teamId: TEAM_ID,
    });
    const latest = deps.deployments?.[0];
    prodUrls[key] = proj.productionUrl;

    if (latest?.state === 'READY') pass(`vercel-deploy-${key}`, latest.url);
    else if (latest?.state === 'ERROR') warn(`vercel-deploy-${key}`, `ERROR — pnpm go-live:deploy:prebuilt ${key}`);
    else if (latest?.state === 'BLOCKED') {
      const detail = await vercelFetch(`/v13/deployments/${latest.uid}`, { teamId: TEAM_ID }).catch(() => null);
      const reason = detail?.readyStateReason ?? 'BLOCKED';
      warn(
        `vercel-deploy-${key}`,
        reason.includes('must have access')
          ? `${reason} — vercel login (guillermc) + email guillermoc2710@gmail.com en Account Settings`
          : reason,
      );
    } else if (latest) warn(`vercel-deploy-${key}`, latest.state);
    else warn(`vercel-deploy-${key}`, 'sin deploy — Git connect o deploy:prebuilt');
  }
} catch (err) {
  fail('vercel-api', err.message);
}

// 5. Smoke
for (const [key, url] of Object.entries(prodUrls)) {
  if (!url) continue;
  const path = key === 'nucleo' ? '/api/health/live' : '/';
  const code = run(`curl -sS -m 12 -o /dev/null -w "%{http_code}" ${url}${path}`);
  if (code === '200') pass(`smoke-${key}`, url);
  else if (code === '401')
    warn(`smoke-${key}`, `${url} → HTTP 401 (deploy OK, protección Vercel activa)`);
  else warn(`smoke-${key}`, `${url} → HTTP ${code ?? 'timeout'}`);
}

// 6. CI
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
  console.log('  1. supabase login && bash scripts/apply-supabase-migrations.sh');
  console.log('  2. Pegar service_role en .env.secrets.local → pnpm go-live:vercel-env');
  console.log('  3. Vercel Dashboard → Git en nucleo-theta, tienda, campo');
  console.log('  4. O: pnpm go-live:deploy:prebuilt tienda && pnpm go-live:deploy:prebuilt campo');
  console.log('  5. pnpm go-live:smoke:prod\n');
}

process.exit(failed ? 1 : 0);