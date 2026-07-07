import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function parseEnvFile(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return { full, vars: {} };
  const vars = {};
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return { full, vars };
}

export function loadSupabaseAdminConfig() {
  const secrets = parseEnvFile('.env.secrets.local').vars;
  const nucleo = parseEnvFile('apps/nucleo/.env.local').vars;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? nucleo.NEXT_PUBLIC_SUPABASE_URL ?? secrets.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    nucleo.SUPABASE_SERVICE_ROLE_KEY ??
    secrets.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}