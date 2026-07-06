#!/usr/bin/env node
/**
 * Checklist go-live — ejecuta verificaciones en orden.
 * Uso: node scripts/go-live-finalize.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  return r.status === 0;
}

function hasServiceRole() {
  const p = resolve(root, '.env.secrets.local');
  if (!existsSync(p)) return false;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      return line.slice('SUPABASE_SERVICE_ROLE_KEY='.length).trim().length > 20;
    }
  }
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

console.log('\n=== Go-live finalize ===\n');

const steps = [];
steps.push(run('node', ['scripts/go-live-check.mjs'], 'Env local') || 'warn');

if (hasServiceRole()) {
  steps.push(run('node', ['scripts/verify-remote-migrations.mjs'], 'Migraciones 83–84 remoto') || 'fail');
  if (process.env.VERCEL_TOKEN) {
    run('node', ['scripts/push-vercel-env-guillermoc.mjs'], 'Vercel env (guillermoc)');
  } else {
    console.log('\n· Saltando push Vercel env (exporta VERCEL_TOKEN de guillermoc)');
  }
} else {
  console.log('\n⚠ Bloqueado: SUPABASE_SERVICE_ROLE_KEY en .env.secrets.local');
  console.log('  Supabase → hdhamxiblwwskvvqbcfo → Settings → API → service_role');
  console.log('  Luego: pnpm go-live:db-push && VERCEL_TOKEN=... pnpm go-live:vercel-env:guillermoc');
}

const smokeOk = run('node', ['scripts/smoke-production.mjs'], 'Smoke producción');
if (!smokeOk) {
  console.log('\nSi falla checkout quote (CSRF): sube NEXT_PUBLIC_URL_TIENDA=https://tienda-eta-lime.vercel.app a núcleo.');
}

console.log('\n--- Resumen manual ---');
console.log('1. Revocar token Vercel expuesto en chat (si no lo hiciste)');
console.log('2. Dominio custom obrerayzangano.com → Vercel proyecto tienda');
console.log('3. Flow producción (no sandbox) cuando vayas a cobrar real\n');

process.exit(smokeOk ? 0 : 1);