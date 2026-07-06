#!/usr/bin/env node
/**
 * Corrige el proyecto tienda en cuenta hobby (guillermoc2710-8540).
 * Causa típica del 404 global: outputDirectory heredado de apps/nucleo/.next.
 *
 * Requisito: vercel login con la cuenta que posee tienda-eta-lime.vercel.app
 *   (guillermoc2710@gmail.com / guillermoc2710-8540)
 *
 * Uso: node scripts/fix-vercel-hobby-tienda.mjs
 */
import { vercelFetch, getVercelToken } from './lib/vercel-auth.mjs';

const HOBBY_TEAM_SLUG = process.env.VERCEL_HOBBY_TEAM_SLUG ?? 'guillermoc2710-8540s-projects';
const PROJECT_NAME = process.env.VERCEL_HOBBY_TIENDA_NAME ?? 'tienda';

const TIENDA_SETTINGS = {
  rootDirectory: 'apps/tienda',
  nodeVersion: '24.x',
  framework: 'nextjs',
  installCommand: 'cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile',
  buildCommand: 'cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/tienda',
  devCommand: null,
  outputDirectory: null,
};

async function resolveTeamId() {
  if (process.env.VERCEL_HOBBY_TEAM_ID) return process.env.VERCEL_HOBBY_TEAM_ID;

  const { teams } = await vercelFetch('/v2/teams?limit=50');
  const match = teams?.find((t) => t.slug === HOBBY_TEAM_SLUG);
  if (match) return match.id;

  // Cuenta personal sin team slug
  const user = await vercelFetch('/v2/user');
  console.log(`  Cuenta CLI: ${user.user?.username ?? user.user?.email ?? '?'}`);
  return null;
}

async function findTiendaProject(teamId) {
  const qs = teamId ? `?teamId=${teamId}&limit=50` : '?limit=50';
  const { projects } = await vercelFetch(`/v9/projects${qs}`);
  const project =
    projects?.find((p) => p.name === PROJECT_NAME) ??
    projects?.find((p) => (p.alias ?? []).some((a) => a.includes('tienda-eta-lime')));
  if (!project) {
    throw new Error(
      `Proyecto "${PROJECT_NAME}" no encontrado en team ${HOBBY_TEAM_SLUG}. ¿vercel login con guillermoc?`,
    );
  }
  return project;
}

console.log('\n=== Fix Vercel hobby tienda (eta-lime 404) ===\n');

try {
  getVercelToken();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const teamId = await resolveTeamId();
console.log(`Team: ${HOBBY_TEAM_SLUG}${teamId ? ` (${teamId})` : ' (personal)'}`);

const project = await findTiendaProject(teamId);
console.log(`Proyecto: ${project.name} (${project.id})`);
console.log(`  rootDirectory actual: ${project.rootDirectory ?? '(vacío)'}`);
console.log(`  outputDirectory actual: ${project.outputDirectory ?? '(vacío)'}`);

const updated = await vercelFetch(`/v9/projects/${project.id}`, {
  method: 'PATCH',
  teamId: teamId ?? undefined,
  body: TIENDA_SETTINGS,
});

console.log('\n✓ Settings actualizados:');
console.log(`  rootDirectory → ${updated.rootDirectory}`);
console.log(`  outputDirectory → ${updated.outputDirectory ?? '(vacío)'}`);
console.log(`  buildCommand → @enjambre/tienda`);

const deps = await vercelFetch(
  `/v6/deployments?projectId=${project.id}&target=production&limit=1`,
  { teamId: teamId ?? undefined },
);
const latest = deps.deployments?.[0];
if (!latest?.uid) {
  console.log('\n△ Sin deploy production previo — haz push a main o Redeploy en dashboard.');
  process.exit(0);
}

const redeploy = await vercelFetch('/v13/deployments', {
  method: 'POST',
  teamId: teamId ?? undefined,
  body: {
    deploymentId: latest.uid,
    name: project.name,
    project: project.id,
    target: 'production',
  },
});

console.log(`\n✓ Redeploy production: ${redeploy.url ?? redeploy.id}`);
console.log('  Verifica en ~2 min: curl -sI https://tienda-eta-lime.vercel.app/ | grep x-matched-path');
console.log('  Debe mostrar: x-matched-path: /\n');