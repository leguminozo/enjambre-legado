/**
 * Genera PNG para manifest PWA y apple-touch-icon desde el SVG maestro.
 * Ejecutar antes de `vite build` (ver package.json).
 */
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public/icons/icon-512.svg')
const outDir = join(root, 'public/icons')

async function main() {
  if (!existsSync(svgPath)) {
    console.error('Missing', svgPath)
    process.exit(1)
  }
  mkdirSync(outDir, { recursive: true })
  const svg = readFileSync(svgPath)
  await sharp(svg).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'))
  await sharp(svg).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'))
  await sharp(svg).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
