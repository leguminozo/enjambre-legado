#!/usr/bin/env node
/**
 * Verifica columnas/RPC de migraciones 83-84 en Supabase remoto.
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.secrets.local o env.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const secretsPath = resolve(root, '.env.secrets.local');

function loadServiceRole() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  if (!existsSync(secretsPath)) return null;
  for (const line of readFileSync(secretsPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      const v = t.slice('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
      return v || null;
    }
  }
  return null;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://hdhamxiblwwskvvqbcfo.supabase.co';
const key = loadServiceRole();

if (!key) {
  console.error('\n✗ Falta SUPABASE_SERVICE_ROLE_KEY');
  console.error('  Añádela en .env.secrets.local y vuelve a ejecutar.\n');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function columnExists(table, column) {
  const res = await fetch(`${url}/rest/v1/rpc/`, { method: 'OPTIONS', headers });
  void res;
  const q = await fetch(
    `${url}/rest/v1/${table}?select=${column}&limit=0`,
    { headers: { ...headers, Prefer: 'count=exact' } },
  );
  if (q.status === 400) {
    const body = await q.text();
    if (body.includes(column) || body.includes('column')) return false;
  }
  return q.ok;
}

async function rpcExists(name) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  return res.status !== 404;
}

console.log('\n=== Verificación migraciones remoto ===\n');

const deliveryCol = await columnExists('subscription_checkout_sessions', 'delivery_address');
console.log(deliveryCol ? '✓' : '✗', '83 — subscription_checkout_sessions.delivery_address');

const renewalRpc = await rpcExists('process_ritual_renewals');
console.log(renewalRpc ? '✓' : '✗', '84 — RPC process_ritual_renewals');

if (!deliveryCol || !renewalRpc) {
  console.log('\nAplicar: pnpm go-live:db-push');
  console.log('  o SQL: packages/database/scripts/apply-replenishment-migrations-83-84.sql\n');
  process.exit(1);
}

console.log('\n✓ Migraciones 83–84 presentes en remoto.\n');