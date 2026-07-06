#!/usr/bin/env node
/**
 * Alinea proyectos Vercel en cuenta guillermoc2710-8540 (canónica OYZ).
 * Uso: vercel login  →  node scripts/setup-vercel-guillermoc.mjs
 */
import {
  vercelFetch,
  resolveProductionTeamId,
  discoverProjects,
  buildSettings,
  PRODUCTION_TEAM_SLUG,
} from './lib/vercel-auth.mjs';

console.log('\n=== Setup Vercel guillermoc (OYZ) ===\n');

const teamId = await resolveProductionTeamId();
console.log(`Team: ${PRODUCTION_TEAM_SLUG}${teamId ? ` (${teamId})` : ' (personal)'}`);

const projects = await discoverProjects(teamId);
const keys = Object.keys(projects);
if (keys.length === 0) {
  console.error('No se encontraron proyectos. ¿vercel login con guillermoc2710@gmail.com?');
  process.exit(1);
}

for (const [key, proj] of Object.entries(projects)) {
  console.log(`[${key}] ${proj.name} (${proj.id})`);
  try {
    const updated = await vercelFetch(`/v9/projects/${proj.id}`, {
      method: 'PATCH',
      teamId: teamId ?? undefined,
      body: {
        rootDirectory: proj.rootDirectory,
        nodeVersion: '24.x',
        ...buildSettings(proj.filter),
      },
    });
    console.log(`  ✓ rootDirectory → ${updated.rootDirectory}`);
    console.log(`  ✓ outputDirectory → ${updated.outputDirectory ?? '(vacío)'}`);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
  }
}

const tienda = projects.tienda;
if (tienda) {
  const deps = await vercelFetch(
    `/v6/deployments?projectId=${tienda.id}&target=production&limit=1`,
    { teamId: teamId ?? undefined },
  );
  const latest = deps.deployments?.[0];
  if (latest?.uid) {
    const redeploy = await vercelFetch('/v13/deployments', {
      method: 'POST',
      teamId: teamId ?? undefined,
      body: {
        deploymentId: latest.uid,
        name: tienda.name,
        project: tienda.id,
        target: 'production',
      },
    });
    console.log(`\n✓ Redeploy tienda: ${redeploy.url ?? redeploy.id}`);
  }
}

console.log('\nVerifica: curl -sI https://tienda-eta-lime.vercel.app/ | grep x-matched-path\n');