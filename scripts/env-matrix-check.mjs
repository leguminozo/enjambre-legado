#!/usr/bin/env node
/**
 * Matriz de env por app: required / recommended / cross-app consistency.
 * No imprime valores de secretos.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV_MATRIX } from './lib/env-matrix-def.mjs';

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

let failed = false;
const envs = {};

console.log('=== Env matrix check (presence only) ===\n');

for (const app of ENV_MATRIX) {
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
  // anon OR publishable counts as one recommended family
  const hasAnon =
    Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()) ||
    Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  for (const k of app.recommended) {
    if (
      k === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' ||
      k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ) {
      continue;
    }
    const ok = Boolean(env[k]?.trim());
    console.log(`  ${ok ? '✅' : '⚠️ '} recommended ${k}`);
  }
  if (
    app.recommended.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') ||
    app.recommended.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  ) {
    console.log(
      `  ${hasAnon ? '✅' : '⚠️ '} recommended NEXT_PUBLIC_SUPABASE_ANON|PUBLISHABLE`,
    );
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
    console.log(
      `  ${ok ? '✅' : '❌'} revalidate secret effective match (CMS or INTERNAL)`,
    );
    if (!ok) failed = true;
  }
  if (n.NEXT_PUBLIC_URL_TIENDA && t.NEXT_PUBLIC_SITE_URL) {
    try {
      const o1 = new URL(n.NEXT_PUBLIC_URL_TIENDA).origin;
      const o2 = new URL(t.NEXT_PUBLIC_SITE_URL).origin;
      const ok = o1 === o2;
      console.log(
        `  ${ok ? '✅' : '⚠️ '} tienda origin nucleo URL_TIENDA vs tienda SITE_URL (${o1} vs ${o2})`,
      );
    } catch {
      console.log('  ⚠️  invalid URL for tienda origin check');
    }
  }
  if (n.NEXT_PUBLIC_SUPABASE_URL && t.NEXT_PUBLIC_SUPABASE_URL) {
    const ok = n.NEXT_PUBLIC_SUPABASE_URL === t.NEXT_PUBLIC_SUPABASE_URL;
    console.log(`  ${ok ? '✅' : '❌'} SUPABASE_URL nucleo↔tienda`);
    if (!ok) failed = true;
  }
}

if (n && c) {
  if (n.NEXT_PUBLIC_NUCLEO_API_URL && c.NEXT_PUBLIC_NUCLEO_API_URL) {
    const ok =
      n.NEXT_PUBLIC_NUCLEO_API_URL.replace(/\/$/, '') ===
      c.NEXT_PUBLIC_NUCLEO_API_URL.replace(/\/$/, '');
    console.log(`  ${ok ? '✅' : '⚠️ '} NUCLEO_API_URL nucleo self vs campo`);
  }
  if (n.INTERNAL_API_SECRET && c.INTERNAL_API_SECRET) {
    sameSecret(n, c, 'INTERNAL_API_SECRET', 'INTERNAL_API_SECRET nucleo↔campo');
  }
  if (n.NEXT_PUBLIC_SUPABASE_URL && c.NEXT_PUBLIC_SUPABASE_URL) {
    const ok = n.NEXT_PUBLIC_SUPABASE_URL === c.NEXT_PUBLIC_SUPABASE_URL;
    console.log(`  ${ok ? '✅' : '❌'} SUPABASE_URL nucleo↔campo`);
    if (!ok) failed = true;
  }
}

console.log('');
if (failed) {
  console.log('Result: FAIL — fix required keys / secret mismatches');
  process.exit(1);
}
console.log('Result: OK (or only warnings)');
