#!/usr/bin/env node
/**
 * Matriz de env por app: required / recommended / cross-app consistency.
 * No imprime valores de secretos.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return null;
  const out = {};
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const MATRIX = [
  {
    name: 'nucleo',
    path: 'apps/nucleo/.env.local',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'INTERNAL_API_SECRET',
      'NEXT_PUBLIC_URL_TIENDA',
    ],
    recommended: [
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      'NEXT_PUBLIC_NUCLEO_API_URL',
      'NEXT_PUBLIC_URL_CAMPO',
      'CMS_REVALIDATE_SECRET',
      'PAYMENT_PROVIDER',
    ],
  },
  {
    name: 'tienda',
    path: 'apps/tienda/.env.local',
    required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_NUCLEO_API_URL'],
    recommended: [
      'NEXT_PUBLIC_SITE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'INTERNAL_API_SECRET',
      'CMS_REVALIDATE_SECRET',
    ],
  },
  {
    name: 'campo',
    path: 'apps/campo/.env.local',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_NUCLEO_API_URL',
      'NEXT_PUBLIC_URL_TIENDA',
    ],
    recommended: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'INTERNAL_API_SECRET'],
  },
];

let failed = false;
const envs = {};

console.log('=== Env matrix check (presence only) ===\n');

for (const app of MATRIX) {
  const env = loadEnv(app.path);
  envs[app.name] = env;
  if (!env) {
    console.log(`❌ ${app.name}: missing ${app.path}`);
    failed = true;
    continue;
  }
  console.log(`▸ ${app.name} (${app.path})`);
  for (const k of app.required) {
    const ok = Boolean(env[k]?.trim());
    console.log(`  ${ok ? '✅' : '❌'} required  ${k}`);
    if (!ok) failed = true;
  }
  for (const k of app.recommended) {
    const ok = Boolean(env[k]?.trim());
    console.log(`  ${ok ? '✅' : '⚠️ '} recommended ${k}`);
  }
  console.log('');
}

// Cross-app consistency
console.log('=== Cross-app ===\n');
const n = envs.nucleo;
const t = envs.tienda;
const c = envs.campo;

function sameSecret(a, b, key, label) {
  if (!a?.[key] || !b?.[key]) {
    console.log(`  ⚠️  skip ${label}: missing in one app`);
    return;
  }
  const ok = a[key] === b[key];
  console.log(`  ${ok ? '✅' : '❌'} ${label} match`);
  if (!ok) failed = true;
}

if (n && t) {
  sameSecret(n, t, 'INTERNAL_API_SECRET', 'INTERNAL_API_SECRET nucleo↔tienda');
  if (n.CMS_REVALIDATE_SECRET || t.CMS_REVALIDATE_SECRET) {
    const ns = n.CMS_REVALIDATE_SECRET || n.INTERNAL_API_SECRET;
    const ts = t.CMS_REVALIDATE_SECRET || t.INTERNAL_API_SECRET;
    const ok = Boolean(ns && ts && ns === ts);
    console.log(`  ${ok ? '✅' : '❌'} revalidate secret effective match (CMS or INTERNAL)`);
    if (!ok) failed = true;
  }
  if (n.NEXT_PUBLIC_URL_TIENDA && t.NEXT_PUBLIC_SITE_URL) {
    try {
      const o1 = new URL(n.NEXT_PUBLIC_URL_TIENDA).origin;
      const o2 = new URL(t.NEXT_PUBLIC_SITE_URL).origin;
      const ok = o1 === o2;
      console.log(`  ${ok ? '✅' : '⚠️ '} tienda origin nucleo URL_TIENDA vs tienda SITE_URL (${o1} vs ${o2})`);
    } catch {
      console.log('  ⚠️  invalid URL for tienda origin check');
    }
  }
}

if (n && c) {
  if (n.NEXT_PUBLIC_NUCLEO_API_URL && c.NEXT_PUBLIC_NUCLEO_API_URL) {
    const ok = n.NEXT_PUBLIC_NUCLEO_API_URL.replace(/\/$/, '') === c.NEXT_PUBLIC_NUCLEO_API_URL.replace(/\/$/, '');
    console.log(`  ${ok ? '✅' : '⚠️ '} NUCLEO_API_URL nucleo self vs campo`);
  }
}

console.log('');
if (failed) {
  console.log('Result: FAIL — fix required keys / secret mismatches');
  process.exit(1);
}
console.log('Result: OK (or only warnings)');
