import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const AUTH_PATHS = [
  join(homedir(), 'Library/Application Support/com.vercel.cli/auth.json'),
  join(homedir(), '.local/share/com.vercel.cli/auth.json'),
];

export function getVercelToken() {
  for (const path of AUTH_PATHS) {
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (data.token) return data.token;
    const tokens = data.tokens ?? {};
    const first = Object.values(tokens)[0];
    if (first?.token) return first.token;
  }
  throw new Error('No Vercel CLI token — ejecuta: vercel login');
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

export const TEAM_ID = 'team_rNqDhUzfkUFiZkh6qksRYYzd';

export const PROJECTS = {
  nucleo: {
    name: 'nucleo-theta',
    id: 'prj_Zqryfjs668jil3F77QU9XEpDCad9',
    rootDirectory: 'apps/nucleo',
    filter: '@enjambre/nucleo',
    productionUrl: 'https://nucleo-theta.vercel.app',
  },
  tienda: {
    name: 'tienda',
    id: 'prj_TgR3VOe0pUlkPeoAj1r2geiLBn73',
    rootDirectory: 'apps/tienda',
    filter: '@enjambre/tienda',
    productionUrl: 'https://tienda-gabos-projects-e4e7d9ab.vercel.app',
  },
  campo: {
    name: 'campo',
    id: 'prj_hq7k1qmHe1sujXIxvRPEhSE5nxWY',
    rootDirectory: 'apps/campo',
    filter: '@enjambre/campo',
    productionUrl: 'https://campo-gabos-projects-e4e7d9ab.vercel.app',
  },
};