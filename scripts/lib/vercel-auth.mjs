import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const AUTH_PATHS = [
  join(homedir(), 'Library/Application Support/com.vercel.cli/auth.json'),
  join(homedir(), '.local/share/com.vercel.cli/auth.json'),
];

export function getVercelToken() {
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  for (const path of AUTH_PATHS) {
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (data.token) return data.token;
    const tokens = data.tokens ?? {};
    const first = Object.values(tokens)[0];
    if (first?.token) return first.token;
  }
  throw new Error('No Vercel CLI token — ejecuta: vercel login (guillermoc2710@gmail.com)');
}

export async function vercelFetch(path, { method = 'GET', body, teamId } = {}) {
  const token = getVercelToken();
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json;
}

/** Cuenta canónica Enjambre Legado / OYZ */
export const PRODUCTION_TEAM_SLUG =
  process.env.VERCEL_TEAM_SLUG ?? 'guillermoc2710-8540s-projects';

export const PRODUCTION_URLS = {
  nucleo: 'https://nucleo-theta.vercel.app',
  tienda: 'https://tienda-eta-lime.vercel.app',
  campo: 'https://campo-gilt.vercel.app',
};

/** @deprecated gabos-projects — migrado a guillermoc2710-8540 */
export const LEGACY_GABOS_TEAM_SLUG = 'gabos-projects-e4e7d9ab';

export async function resolveProductionTeamId() {
  if (process.env.VERCEL_TEAM_ID?.trim()) return process.env.VERCEL_TEAM_ID.trim();
  const { teams } = await vercelFetch('/v2/teams?limit=50');
  const match = teams?.find((t) => t.slug === PRODUCTION_TEAM_SLUG);
  return match?.id ?? null;
}

/** TEAM_ID síncrono legacy — preferir resolveProductionTeamId() */
export const TEAM_ID = process.env.VERCEL_TEAM_ID ?? null;

const PROJECT_DEFS = {
  nucleo: {
    name: 'nucleo-theta',
    rootDirectory: 'apps/nucleo',
    filter: '@enjambre/nucleo',
    productionUrl: PRODUCTION_URLS.nucleo,
  },
  tienda: {
    name: 'tienda',
    rootDirectory: 'apps/tienda',
    filter: '@enjambre/tienda',
    productionUrl: PRODUCTION_URLS.tienda,
  },
  campo: {
    name: 'campo',
    rootDirectory: 'apps/campo',
    filter: '@enjambre/campo',
    productionUrl: PRODUCTION_URLS.campo,
  },
};

export async function discoverProjects(teamId) {
  const qs = teamId ? `?teamId=${teamId}&limit=50` : '?limit=50';
  const { projects } = await vercelFetch(`/v9/projects${qs}`);
  const out = {};
  for (const [key, def] of Object.entries(PROJECT_DEFS)) {
    const envId = process.env[`VERCEL_PROJECT_ID_${key.toUpperCase()}`];
    const found =
      (envId && projects?.find((p) => p.id === envId)) ??
      projects?.find((p) => p.name === def.name) ??
      projects?.find((p) => p.name === key);
    if (found) {
      out[key] = { ...def, id: found.id };
    }
  }
  return out;
}

/** Compat: ids estáticos solo si VERCEL_PROJECT_ID_* en env */
export const PROJECTS = PROJECT_DEFS;

export function buildSettings(filter) {
  return {
    installCommand: 'cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile',
    buildCommand: `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=${filter}`,
    devCommand: null,
    outputDirectory: null,
    framework: 'nextjs',
  };
}