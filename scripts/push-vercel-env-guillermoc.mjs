#!/usr/bin/env node
/**
 * Sube variables de .env.secrets.local a proyectos Vercel (cuenta guillermoc).
 * Uso: VERCEL_TOKEN=... node scripts/push-vercel-env-guillermoc.mjs
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import {
  vercelFetch,
  resolveProductionTeamId,
  discoverProjects,
  PRODUCTION_URLS,
} from './lib/vercel-auth.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const secretsPath = resolve(root, '.env.secrets.local');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

if (!existsSync(secretsPath)) {
  console.error(`Falta ${secretsPath}`);
  process.exit(1);
}

const env = parseEnv(readFileSync(secretsPath, 'utf8'));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://hdhamxiblwwskvvqbcfo.supabase.co';
const publishable = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const internalSecret = env.INTERNAL_API_SECRET ?? randomBytes(32).toString('hex');

if (!serviceRole) {
  console.error('✗ SUPABASE_SERVICE_ROLE_KEY vacío en .env.secrets.local');
  console.error('  Supabase Dashboard → hdhamxiblwwskvvqbcfo → Settings → API → service_role');
  process.exit(1);
}

const teamId = await resolveProductionTeamId();
const projects = await discoverProjects(teamId);
if (!Object.keys(projects).length) {
  console.error('✗ Sin proyectos Vercel. ¿VERCEL_TOKEN de guillermoc?');
  process.exit(1);
}

const urls = {
  nucleo: env.NUCLEO_PRODUCTION_URL ?? PRODUCTION_URLS.nucleo,
  tienda: env.TIENDA_PRODUCTION_URL ?? PRODUCTION_URLS.tienda,
  campo: env.CAMPO_PRODUCTION_URL ?? PRODUCTION_URLS.campo,
};

async function upsertEnv(projectId, key, value, targets) {
  for (const target of targets) {
    await vercelFetch(`/v10/projects/${projectId}/env`, {
      method: 'POST',
      teamId: teamId ?? undefined,
      body: { key, value, type: 'encrypted', target: [target] },
    }).catch(async () => {
      const list = await vercelFetch(`/v9/projects/${projectId}/env`, { teamId: teamId ?? undefined });
      const existing = list.envs?.find((e) => e.key === key && e.target?.includes(target));
      if (!existing?.id) throw new Error(`No se pudo crear ${key} (${target})`);
      await vercelFetch(`/v9/projects/${projectId}/env/${existing.id}`, {
        method: 'PATCH',
        teamId: teamId ?? undefined,
        body: { value, type: 'encrypted', target: [target] },
      });
    });
  }
}

const matrix = {
  nucleo: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: publishable,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable,
    SUPABASE_SERVICE_ROLE_KEY: serviceRole,
    INTERNAL_API_SECRET: internalSecret,
    NEXT_PUBLIC_NUCLEO_API_URL: urls.nucleo,
    NEXT_PUBLIC_URL_TIENDA: urls.tienda,
    NEXT_PUBLIC_URL_CAMPO: urls.campo,
  },
  tienda: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: publishable,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable,
    SUPABASE_SERVICE_ROLE_KEY: serviceRole,
    NEXT_PUBLIC_NUCLEO_API_URL: urls.nucleo,
    NEXT_PUBLIC_SITE_URL: urls.tienda,
    NEXT_PUBLIC_URL_TIENDA: urls.tienda,
  },
  campo: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: publishable,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable,
    NEXT_PUBLIC_NUCLEO_API_URL: urls.nucleo,
    NEXT_PUBLIC_URL_TIENDA: urls.tienda,
    NEXT_PUBLIC_URL_CAMPO: urls.campo,
  },
};

console.log('\n=== Vercel env push (guillermoc) ===\n');
for (const [key, url] of Object.entries(urls)) console.log(`${key}: ${url}`);
console.log('');

for (const [appKey, vars] of Object.entries(matrix)) {
  const proj = projects[appKey];
  if (!proj) continue;
  console.log(`[${appKey}] ${proj.name}`);
  for (const [k, v] of Object.entries(vars)) {
    if (!v) {
      console.log(`  · skip ${k} (vacío)`);
      continue;
    }
    await upsertEnv(proj.id, k, v, ['production', 'preview']);
    console.log(`  ✓ ${k}`);
  }
}

if (!env.INTERNAL_API_SECRET) {
  appendFileSync(secretsPath, `\nINTERNAL_API_SECRET=${internalSecret}\n`);
  console.log('\n✓ INTERNAL_API_SECRET guardado en .env.secrets.local');
}

console.log('\n✓ Variables sincronizadas. Redeploy desde Git o Dashboard.\n');