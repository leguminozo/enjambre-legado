#!/usr/bin/env node
/**
 * Herramienta de precarga e inspección territorial para archivos KMZ (Chiloé).
 * Extrae y correlaciona apiarios, titulares, fechas de inicio y comunas.
 *
 * Uso:
 *   node scripts/precargar-kmz-territorio.mjs [ruta_al_archivo.kmz]
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { parseKmzFile } from '../apps/nucleo/src/lib/kmz-territorial-parser.ts';

const defaultPath = '/Users/macbook/Downloads/Archipielago de Chiloe (Apiarios 2026).kmz';
const targetPath = process.argv[2] ? resolve(process.argv[2]) : defaultPath;

if (!existsSync(targetPath)) {
  console.error(`\n✗ Error: No se encontró el archivo en: ${targetPath}`);
  console.error('  Especifica la ruta correcta como argumento.\n');
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(` REPORTE TERRITORIAL · REGISTRO APÍCOLA DE CHILOÉ`);
console.log(` Archivo: ${targetPath}`);
console.log(`======================================================\n`);

try {
  const resumen = parseKmzFile(targetPath);

  console.log(`✓ Total Asentamientos / Apiarios: ${resumen.total_apiarios}`);
  console.log(`✓ Total Titulares Identificados: ${resumen.total_titulares}`);
  console.log(`\nDistribución Geográfica por Comuna:`);
  console.log(`------------------------------------------------------`);
  console.log(` Comuna               | Apiarios | Titulares`);
  console.log(`------------------------------------------------------`);

  const comunasSorted = Object.entries(resumen.por_comuna).sort((a, b) => b[1].apiarios - a[1].apiarios);
  for (const [comuna, stats] of comunasSorted) {
    const padComuna = comuna.padEnd(20, ' ');
    const padApiarios = String(stats.apiarios).padStart(8, ' ');
    const padTitulares = String(stats.titulares).padStart(9, ' ');
    console.log(` ${padComuna} | ${padApiarios} | ${padTitulares}`);
  }
  console.log(`------------------------------------------------------`);

  // Antigüedades destacadas
  const conAntiguedad = resumen.apiarios.filter((a) => a.antiguedad_anos != null && a.antiguedad_anos > 0);
  conAntiguedad.sort((a, b) => (b.antiguedad_anos ?? 0) - (a.antiguedad_anos ?? 0));

  console.log(`\nTrayectoria y Antigüedad Territorial Destacada:`);
  for (const top of conAntiguedad.slice(0, 5)) {
    console.log(` • ${top.titular} (${top.nombre_apiario}, ${top.comuna}): ${top.antiguedad_anos} años de trayectoria (Inicio: ${top.fecha_inicio})`);
  }

  console.log(`\n✓ Análisis completado con éxito. Datos listos para correlación censal.\n`);
} catch (err) {
  console.error('\n✗ Error al procesar KMZ:', err instanceof Error ? err.message : err);
  process.exit(1);
}
