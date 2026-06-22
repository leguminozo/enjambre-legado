#!/usr/bin/env node
/**
 * Alinea Root Directory + build/install en los 3 proyectos Vercel (monorepo).
 * Uso: node scripts/setup-vercel-projects.mjs
 */
import { vercelFetch, TEAM_ID, PROJECTS } from './lib/vercel-auth.mjs';

function buildSettings(filter) {
  return {
    installCommand: 'cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile',
    buildCommand: `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=${filter}`,
    devCommand: null,
    outputDirectory: null,
    framework: 'nextjs',
  };
}

console.log('\n=== Setup Vercel projects (Fase 0) ===\n');

for (const [key, proj] of Object.entries(PROJECTS)) {
  console.log(`[${key}] ${proj.name}`);
  try {
    const updated = await vercelFetch(`/v9/projects/${proj.id}`, {
      method: 'PATCH',
      teamId: TEAM_ID,
      body: {
        rootDirectory: proj.rootDirectory,
        nodeVersion: '24.x',
        ...buildSettings(proj.filter),
      },
    });
    console.log(`  ✓ rootDirectory → ${updated.rootDirectory ?? proj.rootDirectory}`);
    console.log(`  ✓ build → ${proj.filter}`);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
  }
  console.log('');
}

console.log('Siguiente: conectar Git en dashboard o `vercel git connect` por proyecto.');
console.log('Luego: pnpm go-live:vercel-env && redeploy desde Vercel.\n');