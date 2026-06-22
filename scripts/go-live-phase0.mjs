#!/usr/bin/env node
/**
 * Fase 0 — auditoría operativa completa (no imprime secretos).
 * Uso: node scripts/go-live-phase0.mjs [--build]
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PROJECTS, TEAM_ID, vercelFetch } from './lib/vercel-auth.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const secretsFile = resolve(root, '.env.secrets.local');
const withBuild = process.argv.includes('--build');

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

function has(path) {
  return existsSync(resolve(root, path));
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
  } catch {
    return null;
  }
}

function parseEnv(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return {};
  const vars = {};
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

console.log('\n╔══════════════════════════════════════╗');
console.log('║  FASE 0 — Go-live operativo profundo  ║');
console.log('╚══════════════════════════════════════╝\n');

// ── 1. Secretos raíz ──
if (!has('.env.secrets.local')) {
  fail('secrets', 'bash scripts/init-secrets-local.sh o cp .env.secrets.local.example');
} else {
  const raw = readFileSync(secretsFile, 'utf8');
  if (!/SUPABASE_SERVICE_ROLE_KEY=eyJ/.test(raw)) {
    fail('secrets', 'SUPABASE_SERVICE_ROLE_KEY ausente — pega JWT eyJ... en .env.secrets.local');
  } else {
    pass('secrets', '.env.secrets.local con service_role');
  }
}

if (has('.env.secrets.local.example')) {
  pass('secrets-example', 'plantilla versionada');
} else {
  fail('secrets-example', 'falta .env.secrets.local.example');
}

// ── 2. Env local por app ──
try {
  execSync('node scripts/go-live-check.mjs', { cwd: root, stdio: 'pipe' });
  pass('env-local', 'go-live-check OK');
} catch {
  fail('env-local', 'pnpm go-live:bootstrap');
}

const nucleoEnv = parseEnv('apps/nucleo/.env.local');
if (nucleoEnv.INTERNAL_API_SECRET?.length >= 16) {
  pass('internal-api-secret', 'nucleo/.env.local');
} else {
  fail('internal-api-secret', 'falta INTERNAL_API_SECRET en nucleo');
}

if (nucleoEnv.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')) {
  pass('nucleo-service-role', 'presente en nucleo/.env.local');
} else {
  fail('nucleo-service-role', 'bootstrap no propagó service_role');
}

// ── 3. Git / GitHub ──
const ghUser = run('gh api user --jq .login');
if (ghUser) {
  pass('github-cli', ghUser);
} else {
  fail('github-cli', 'gh auth login');
}

const remote = run('git remote get-url origin');
if (remote?.includes('guillermoc2710-cmd/enjambre-legado')) {
  pass('git-remote', 'guillermoc2710-cmd/enjambre-legado');
} else {
  fail('git-remote', remote ?? 'sin origin');
}

const ghSecrets = run('gh secret list --repo guillermoc2710-cmd/enjambre-legado --json name');
if (ghSecrets) {
  const names = JSON.parse(ghSecrets).map((s) => s.name);
  const required = ['SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL'];
  const missing = required.filter((k) => !names.includes(k));
  if (missing.length) {
    fail('github-secrets', `faltan: ${missing.join(', ')} — pnpm go-live:github-secrets`);
  } else {
    pass('github-secrets', `${names.length} secrets`);
  }
} else {
  fail('github-secrets', 'no se pudo listar');
}

// ── 4. CI workflow ──
const ci = has('.github/workflows/ci.yml') ? readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8') : '';
if (ci.includes('secrets.SUPABASE_SERVICE_ROLE_KEY') && ci.includes('build-campo')) {
  pass('ci-workflow', 'env secrets + build 3 apps');
} else {
  fail('ci-workflow', 'revisar .github/workflows/ci.yml');
}

// ── 5. Vercel link ──
for (const [key, proj] of Object.entries(PROJECTS)) {
  const app = key === 'nucleo' ? 'nucleo' : key;
  const linkPath = `apps/${app}/.vercel/project.json`;
  if (has(linkPath)) {
    pass(`vercel-link-${key}`, proj.name);
  } else {
    fail(`vercel-link-${key}`, `cd apps/${app} && vercel link --project ${proj.name}`);
  }
}

// ── 6. Vercel env production ──
for (const [key, proj] of Object.entries(PROJECTS)) {
  const appDir = key === 'nucleo' ? 'apps/nucleo' : `apps/${key}`;
  const out = run(`cd "${appDir}" && vercel env ls production 2>&1`);
  if (out?.includes('No Environment Variables')) {
    fail(`vercel-env-${key}`, 'production vacío — pnpm go-live:vercel-env');
  } else if (out) {
    const count = (out.match(/Encrypted|Plaintext|Sensitive/g) ?? []).length;
    const min = key === 'nucleo' ? 6 : key === 'tienda' ? 5 : 4;
    if (count >= min) {
      pass(`vercel-env-${key}`, `${count} vars`);
    } else {
      fail(`vercel-env-${key}`, `solo ${count} vars (esperado ≥${min})`);
    }
  } else {
    fail(`vercel-env-${key}`, 'no se pudo consultar');
  }
}

// ── 7. Vercel API: root, git, deploy ──
const prodUrls = {};
try {
  for (const [key, proj] of Object.entries(PROJECTS)) {
    const p = await vercelFetch(`/v9/projects/${proj.id}`, { teamId: TEAM_ID });
    const rd = p.rootDirectory ?? '.';
    if (rd === proj.rootDirectory) {
      pass(`vercel-root-${key}`, rd);
    } else {
      fail(`vercel-root-${key}`, `"${rd}" → "${proj.rootDirectory}" (pnpm go-live:vercel-setup)`);
    }

    if (p.link?.type === 'github' && p.link?.repo?.includes('enjambre-legado')) {
      pass(`vercel-git-${key}`, p.link.repo);
    } else {
      warn(`vercel-git-${key}`, 'sin Git — conectar en dashboard');
    }

    const aliases = p.targets?.production?.alias ?? [];
    const short = aliases.find((a) => !a.includes('-gabos-projects-') && !a.includes('-gaboxxc-'));
    const picked = proj.productionUrl ?? (short ? `https://${short}` : null);
    prodUrls[key] = picked?.startsWith('http') ? picked : picked ? `https://${picked}` : null;

    const deps = await vercelFetch(`/v6/deployments?projectId=${proj.id}&target=production&limit=1`, {
      teamId: TEAM_ID,
    });
    const latest = deps.deployments?.[0];
    if (latest?.state === 'READY') {
      pass(`vercel-deploy-${key}`, latest.url ?? 'READY');
    } else if (latest) {
      warn(`vercel-deploy-${key}`, `último: ${latest.state ?? '?'}`);
    } else {
      warn(`vercel-deploy-${key}`, 'sin deploy production');
    }
  }
} catch (err) {
  fail('vercel-api', err.message);
}

// ── 8. Monorepo deploy config ──
if (has('vercel.json') && has('.vercelignore')) {
  pass('vercel-monorepo', 'vercel.json + .vercelignore');
} else {
  fail('vercel-monorepo', 'falta vercel.json o .vercelignore');
}

const nucleoVercel = has('apps/nucleo/vercel.json') ? readFileSync(resolve(root, 'apps/nucleo/vercel.json'), 'utf8') : '';
if (nucleoVercel.includes('crons') && nucleoVercel.includes('/api/cron/')) {
  pass('vercel-crons', 'nucleo hobby-safe');
} else {
  warn('vercel-crons', 'revisar apps/nucleo/vercel.json');
}

// ── 9. Build (opcional) ──
if (withBuild) {
  const build = run('pnpm verify:fast', { timeout: 300000 });
  if (build?.includes('successful')) {
    pass('build-verify', 'verify:fast OK');
  } else {
    fail('build-verify', 'pnpm verify:fast falló');
  }
}

// ── 10. Smoke producción ──
const nucleoUrl = prodUrls.nucleo ?? 'https://nucleo-theta.vercel.app';
const healthCode = run(`curl -sS -m 12 -o /dev/null -w "%{http_code}" ${nucleoUrl}/api/health/live`);
if (healthCode === '200') {
  pass('prod-health-nucleo', `${nucleoUrl}/api/health/live`);
} else {
  fail('prod-health-nucleo', `HTTP ${healthCode ?? 'timeout'}`);
}

for (const [key, url] of Object.entries(prodUrls)) {
  if (!url || key === 'nucleo') continue;
  const code = run(`curl -sS -m 12 -o /dev/null -w "%{http_code}" ${url}/`);
  if (code === '200') {
    pass(`prod-health-${key}`, url);
  } else if (code) {
    warn(`prod-health-${key}`, `${url} → HTTP ${code}`);
  } else {
    warn(`prod-health-${key}`, `${url} — sin respuesta`);
  }
}

// ── Resumen ──
console.log('── Resultados ──\n');
let failed = 0;
let warnings = 0;
for (const c of checks) {
  const icon = c.ok ? (c.warn ? '△' : '✓') : '✗';
  console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  if (!c.ok) failed++;
  if (c.warn) warnings++;
}

console.log(
  `\n${failed ? `${failed} bloqueante(s)` : 'Fase 0 lista'} — ${checks.length} checks` +
    (warnings ? ` (${warnings} aviso(s))` : '') +
    '\n',
);

if (failed) {
  console.log('Pipeline automático:');
  console.log('  bash scripts/go-live-phase0-apply.sh');
  console.log('');
  console.log('O paso a paso:');
  console.log('  1. bash scripts/init-secrets-local.sh');
  console.log('  2. Editar .env.secrets.local → SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  console.log('  3. pnpm go-live:bootstrap');
  console.log('  4. pnpm go-live:vercel-setup');
  console.log('  5. pnpm go-live:vercel-env');
  console.log('  6. pnpm go-live:github-secrets');
  console.log('  7. Vercel Dashboard → Git (nucleo-theta, tienda, campo):');
  console.log('     https://vercel.com/gabos-projects-e4e7d9ab/nucleo-theta/settings/git');
  console.log('     https://vercel.com/gabos-projects-e4e7d9ab/tienda/settings/git');
  console.log('     https://vercel.com/gabos-projects-e4e7d9ab/campo/settings/git');
  console.log('  8. pnpm go-live:smoke:prod\n');
}

process.exit(failed ? 1 : 0);