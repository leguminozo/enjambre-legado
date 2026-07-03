#!/usr/bin/env node
/**
 * Pre-flight para usar el ecosistema en realidad.
 * No imprime valores de secretos — solo presencia/ausencia.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const APPS = [
  {
    name: 'nucleo',
    path: 'apps/nucleo/.env.local',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'INTERNAL_API_SECRET',
    ],
    recommended: [
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      'NEXT_PUBLIC_NUCLEO_API_URL',
      'NEXT_PUBLIC_URL_TIENDA',
      'NEXT_PUBLIC_URL_CAMPO',
    ],
  },
  {
    name: 'tienda',
    path: 'apps/tienda/.env.local',
    required: ['NEXT_PUBLIC_SUPABASE_URL'],
    recommended: ['NEXT_PUBLIC_SITE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    name: 'campo',
    path: 'apps/campo/.env.local',
    required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_NUCLEO_API_URL'],
    recommended: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'],
  },
];

function parseEnvFile(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return { full, vars: {} };
  const vars = {};
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    vars[key] = val;
  }
  return { full, vars };
}

let failed = false;

console.log('\n=== Go-live env check ===\n');

for (const app of APPS) {
  const { full, vars } = parseEnvFile(app.path);
  console.log(`[${app.name}] ${full}`);
  for (const key of app.required) {
    const ok = Boolean(vars[key]?.length);
    if (!ok) {
      failed = true;
      console.log(`  ✗ REQUIRED missing: ${key}`);
    } else {
      console.log(`  ✓ ${key}`);
    }
  }
  for (const key of app.recommended) {
    const ok = Boolean(vars[key]?.length);
    console.log(`  ${ok ? '○' : '·'} recommended ${key}${ok ? '' : ' (missing)'}`);
  }
  console.log('');
}

const secretsFile = resolve(root, '.env.secrets.local');
if (existsSync(secretsFile)) {
  const { vars: secretVars } = parseEnvFile('.env.secrets.local');
  if (!secretVars.SUPABASE_SERVICE_ROLE_KEY?.length) {
    console.log('⚠ .env.secrets.local sin SUPABASE_SERVICE_ROLE_KEY — checkout local bloqueado');
    console.log('  Supabase → hdhamxiblwwskvvqbcfo → Settings → API → service_role\n');
  } else {
    console.log('✓ .env.secrets.local tiene SUPABASE_SERVICE_ROLE_KEY — pnpm go-live:bootstrap\n');
  }
} else {
  console.log('Tip: crea .env.secrets.local en la raíz con SUPABASE_SERVICE_ROLE_KEY=...\n');
}

const nucleoVars = parseEnvFile('apps/nucleo/.env.local').vars;
const tiendaVars = parseEnvFile('apps/tienda/.env.local').vars;
const tiendaSite = tiendaVars.NEXT_PUBLIC_SITE_URL;
const nucleoTienda = nucleoVars.NEXT_PUBLIC_URL_TIENDA;
if (tiendaSite && nucleoTienda && tiendaSite !== nucleoTienda) {
  console.log('⚠ URL mismatch local:');
  console.log(`  tienda NEXT_PUBLIC_SITE_URL=${tiendaSite}`);
  console.log(`  nucleo NEXT_PUBLIC_URL_TIENDA=${nucleoTienda}`);
  console.log('  CSRF tienda→núcleo fallará hasta alinearlas (pnpm go-live:bootstrap)\n');
  failed = true;
}

process.exit(failed ? 1 : 0);