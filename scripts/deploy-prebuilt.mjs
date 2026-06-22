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

// Hobby team: el autor del commit en GitHub debe coincidir con el email de la cuenta Vercel.
const vercelEmail = process.env.VERCEL_DEPLOY_AUTHOR_EMAIL ?? 'gaboxxc@gmail.com';
const vercelName = process.env.VERCEL_DEPLOY_AUTHOR_NAME ?? 'gaboxxc-3075';
const deployCmd = [
  'vercel deploy --prebuilt --prod --yes --archive=tgz --no-wait',
  `-m githubCommitAuthorEmail=${vercelEmail}`,
  `-m githubCommitAuthorName=${vercelName}`,
].join(' ');
execSync(deployCmd, { cwd: root, stdio: 'inherit', shell: true });

console.log('\n✓ Deploy enviado (async). Revisa estado: vercel ls (en apps/<app>).');
console.log('  Si rate-limit (api-upload-free), conecta Git en Vercel + push a main.\n');

// Limpia link raíz para no interferir con otros proyectos
try {
  rmSync(resolve(root, '.vercel'), { recursive: true });
} catch {
  /* ignore */
}