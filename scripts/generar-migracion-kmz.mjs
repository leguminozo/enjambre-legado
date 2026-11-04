import { parseKmzFile } from '../apps/nucleo/src/lib/kmz-territorial-parser.ts';
import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const kmzPath = '/Users/macbook/Downloads/Archipielago de Chiloe (Apiarios 2026).kmz';

function generateDeterministicUuid(key) {
  const hash = crypto.createHash('sha1').update('enjambre-territorial-kmz:' + key).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

console.log('Parsea KMZ...');
const parsed = parseKmzFile(kmzPath);
console.log(`Apiarios: ${parsed.total_apiarios}, Titulares: ${parsed.total_titulares}`);

// Agrupar apiarios por titular para deducir la comuna principal del actor
const titularesMap = new Map();
for (const a of parsed.apiarios) {
  if (!titularesMap.has(a.titular)) {
    titularesMap.set(a.titular, []);
  }
  titularesMap.get(a.titular).push(a);
}

// Generar SQL
const lines = [];
lines.push('-- Migration: Precarga Catastro Territorial KMZ Chiloé 2026');
lines.push('-- Inserta 78 titulares históricos (user_id IS NULL) y 141 apiarios georreferenciados.');
lines.push('-- Idempotente: UUIDs deterministas v5 y ON CONFLICT DO NOTHING.');
lines.push('');

// 1. Actores
lines.push('-- =============================================================================');
lines.push('-- 1. ACTORES TERRITORIALES (PRE-CARGADOS SIN RECLAMAR)');
lines.push('-- =============================================================================');
lines.push('');

for (const [titular, apiarios] of titularesMap) {
  const actorUuid = generateDeterministicUuid(`actor:${titular}`);
  
  // Deducir comuna más frecuente de sus apiarios
  const comunaCounts = {};
  for (const ap of apiarios) {
    comunaCounts[ap.comuna] = (comunaCounts[ap.comuna] || 0) + 1;
  }
  const comunaPrincipal = Object.entries(comunaCounts).sort((a, b) => b[1] - a[1])[0][0];

  lines.push(`INSERT INTO public.actores_registro (`);
  lines.push(`  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones`);
  lines.push(`) VALUES (`);
  lines.push(`  ${escapeSql(actorUuid)},`);
  lines.push(`  NULL,`);
  lines.push(`  'api_residente',`);
  lines.push(`  ${escapeSql(titular)},`);
  lines.push(`  ${escapeSql(comunaPrincipal)},`);
  lines.push(`  'Los Lagos',`);
  lines.push(`  'activo',`);
  lines.push(`  'base',`);
  lines.push(`  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,`);
  lines.push(`  false,`);
  lines.push(`  false,`);
  lines.push(`  false,`);
  lines.push(`  false,`);
  lines.push(`  ${escapeSql(`Catastro territorial SAG Chiloé 2026 · ${apiarios.length} apiarios identificados`)}`);
  lines.push(`) ON CONFLICT (id) DO NOTHING;`);
  lines.push('');
}

// 2. Apiarios
lines.push('-- =============================================================================');
lines.push('-- 2. APIARIOS REGISTRADOS GEORREFERENCIADOS');
lines.push('-- =============================================================================');
lines.push('');

for (let i = 0; i < parsed.apiarios.length; i++) {
  const ap = parsed.apiarios[i];
  const apiarioUuid = generateDeterministicUuid(`apiario:${ap.id}`);
  const actorUuid = generateDeterministicUuid(`actor:${ap.titular}`);
  const zona = `${ap.comuna} / Sector rural`;
  
  let obs = `Catastro SAG KMZ 2026`;
  if (ap.fecha_inicio) obs += ` · Inicio: ${ap.fecha_inicio}`;
  if (ap.antiguedad_anos != null) obs += ` · Antigüedad: ${ap.antiguedad_anos} años`;
  obs += ` · Colmenas estimadas por confirmar en censo`;

  lines.push(`INSERT INTO public.apiarios_registro (`);
  lines.push(`  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones`);
  lines.push(`) VALUES (`);
  lines.push(`  ${escapeSql(apiarioUuid)},`);
  lines.push(`  ${escapeSql(actorUuid)},`);
  lines.push(`  ${escapeSql(ap.nombre_apiario)},`);
  lines.push(`  ${escapeSql(ap.comuna)},`);
  lines.push(`  ${escapeSql(zona)},`);
  lines.push(`  ${ap.lat},`);
  lines.push(`  ${ap.lng},`);
  lines.push(`  10,`); // default provisional para satisfacer CHECK (n_colmenas > 0)
  lines.push(`  'produccion',`);
  lines.push(`  true,`);
  lines.push(`  ${escapeSql(obs)}`);
  lines.push(`) ON CONFLICT (id) DO NOTHING;`);
  lines.push('');
}

const targetFile = resolve(__dirname, '../packages/database/supabase/migrations/20261103223000_precargar_catastro_kmz_chiloe.sql');
writeFileSync(targetFile, lines.join('\n'), 'utf8');
console.log(`✓ Migración generada exitosamente en:\n  ${targetFile}`);
