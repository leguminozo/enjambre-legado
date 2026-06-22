#!/usr/bin/env node
/**
 * Build local + deploy prebuilt (evita tarball del monorepo).
 * Uso: node scripts/deploy-prebuilt.mjs nucleo|tienda|campo
 *
 * Requiere: vercel link en apps/<app> y ejecutar desde raíz del monorepo.
 * Nota: si aparece api-upload-free, conectar Git en Vercel y deploy vía push a main.
 */
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PROJECTS } from './lib/vercel-auth.mjs';

const app = process.argv[2];
if (!app || !PROJECTS[app]) {
  console.error('Uso: node scripts/deploy-prebuilt.mjs nucleo|tienda|campo');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = resolve(root, 'apps', app === 'nucleo' ? 'nucleo' : app);
const linkSrc = resolve(appDir, '.vercel/project.json');
const linkDst = resolve(root, '.vercel/project.json');

if (!existsSync(linkSrc)) {
  console.error(`Falta ${linkSrc} — cd apps/${app} && vercel link`);
  process.exit(1);
}

mkdirSync(resolve(root, '.vercel'), { recursive: true });
copyFileSync(linkSrc, linkDst);

console.log(`\n=== Prebuilt deploy: ${PROJECTS[app].name} ===\n`);

execSync('vercel pull --yes --environment=production', { cwd: appDir, stdio: 'inherit' });
copyFileSync(linkSrc, linkDst);

execSync('vercel build --prod --yes', { cwd: root, stdio: 'inherit' });
execSync('vercel deploy --prebuilt --prod --yes --archive=tgz', { cwd: root, stdio: 'inherit' });

console.log('\n✓ Deploy enviado. Si rate-limit (api-upload-free), usa Git connect + push a main.\n');

// Limpia link raíz para no interferir con otros proyectos
try {
  rmSync(resolve(root, '.vercel'), { recursive: true });
} catch {
  /* ignore */
}