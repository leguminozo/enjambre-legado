#!/usr/bin/env node
/**
 * Compat-audit: falla el build si el bundle cliente usa APIs que Safari/iOS 15
 * (piso soportado: iOS 15.8, iPhone 7) no puede ejecutar y que la capa
 * LegacyBrowserPolyfills (packages/ui) NO cubre.
 *
 * Uso: node scripts/compat-audit.mjs <app-dir>   (ej: apps/nucleo)
 * Se integra en el build de cada app: next build && node ../../scripts/compat-audit.mjs .
 *
 * Regla de oro: si una API nueva aparece aquí, AGREGARLA a LegacyBrowserPolyfills
 * (con su unit test) o refactorizar; nunca silenciar el audit.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const STATIC_REL = '.next/static';

/** Sintaxis que Safari 15.8 NO puede parsear: no es polyfilleable → fallo. */
const PARSE_LEVEL = [
  {
    id: 'regex-lookbehind-literal',
    re: /\/\(\?<[=!]/,
    hint: 'lookbehind (?<=)/(?<!) en literal de regex: Safari lo soporta solo desde 16.4. Refactoriza el regex (no es polyfilleable).',
  },
  {
    id: 'import-attributes',
    re: /\bwith\s*\{\s*type\s*:/,
    hint: 'import attributes (with { type: "json" }): Safari 16.4+. Quita el atributo (no es polyfilleable).',
  },
];

/**
 * APIs de runtime NO cubiertas por LegacyBrowserPolyfills → fallo.
 * Las cubiertas por la capa de compat (packages/ui/src/components/
 * legacy-browser-polyfills.tsx) llevan covered:true y solo generan warning:
 * - ES2022: Array.at, Object.hasOwn, findLast/findLastIndex, String.replaceAll
 * - ES2023: toSorted, toReversed, toSpliced, with, isWellFormed, toWellFormed
 * - ES2024: Promise.withResolvers, Object.groupBy, Map.groupBy
 * - Global: structuredClone
 * Si agregas un polyfill nuevo, muévelo aquí a covered:true (regla de oro).
 */
const RUNTIME = [
  { id: 'AbortSignal.timeout', re: /AbortSignal\.timeout\(/, hint: 'Safari 16.0+. Reemplaza por AbortController + setTimeout.' },
  {
    id: 'AbortSignal.any',
    re: /AbortSignal\.any\(/,
    // three.js 0.184 usa el idiom protegido (feature-detection con fallback)
    allowWhen: [/"function"==typeof AbortSignal\.any\?AbortSignal\.any\(/],
    hint: 'Safari 17.4+. Si no es el idiom protegido de three.js, reemplaza por Promise.race + AbortController.',
  },
  { id: 'Array.fromAsync', re: /\bfromAsync\(/, hint: 'Safari 17.0+. Reemplaza por un helper propio.' },
  { id: 'toSorted-call', re: /[)\]0-9A-Za-z_$]\.toSorted\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills (arrays: copia + sort).' },
  { id: 'toReversed-call', re: /[)\]0-9A-Za-z_$]\.toReversed\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills.' },
  { id: 'toSpliced-call', re: /[)\]0-9A-Za-z_$]\.toSpliced\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills.' },
  { id: 'array-with-call', re: /[)\]0-9A-Za-z_$]\.with\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills.' },
  { id: 'string-isWellFormed', re: /\.isWellFormed\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills.' },
  { id: 'string-toWellFormed', re: /\.toWellFormed\(/, covered: true, hint: 'Safari 16.4+. Cubierta por LegacyBrowserPolyfills.' },
  { id: 'Object.groupBy', re: /Object\.groupBy\(/, covered: true, hint: 'Safari 17.4+. Cubierta por LegacyBrowserPolyfills (solo iterables indexados).' },
  { id: 'Map.groupBy', re: /Map\.groupBy\(/, covered: true, hint: 'Safari 17.4+. Cubierta por LegacyBrowserPolyfills (solo iterables indexados).' },
  { id: 'URL.canParse', re: /URL\.canParse\(/, hint: 'Safari 16.0+. Usa try/catch con new URL().' },
  { id: 'Promise.try', re: /Promise\.try\(/, hint: 'Safari 18.0+. Usa Promise.resolve().then().' },
  { id: 'import.meta.resolve', re: /import\.meta\.resolve/, hint: 'No existe en navegadores estándar.' },
  {
    id: 'navigator.userAgentData-acceso',
    re: /navigator\.userAgentData\./,
    hint: 'Chrome-only. El acceso NO opcional (sin ?.) lanza TypeError en Safari. Usa navigator.userAgent o matchMedia. Accesos guardados (!navigator.userAgentData, ?.) son OK.',
  },
  {
    id: 'navigator.deviceMemory-acceso',
    re: /navigator\.deviceMemory\s*\./,
    hint: 'Chrome-only (no existe en iOS). El acceso NO opcional lanza TypeError en Safari. Usa typeof navigator.deviceMemory o un guard.',
  },
];

/** Mejoras progresivas: se reportan pero no bloquean el build. */
const WARNINGS = [
  { id: 'css-color-mix', re: /color-mix\(/, hint: 'Safari 16.2+. Verifica que el token tenga fallback en CSS.' },
  { id: 'css-has', re: /:has\(/, hint: 'Safari 15.4+. Los :has() funcionales deben usar data-attributes (ver StickyBarSensor); los cosméticos, documentarse.' },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry.includes('~') || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) walk(full, out);
      else if (full.endsWith('.js') || full.endsWith('.css')) out.push(full);
    } catch {
      // Ignore transient files
    }
  }
  return out;
}

function scan(appDir) {
  const staticDir = resolve(appDir, STATIC_REL);
  let files;
  try {
    files = walk(staticDir);
  } catch (err) {
    console.error(`[compat-audit] No se encontró ${staticDir}. Corre el audit DESPUÉS de next build.`);
    process.exit(2);
  }

  const violations = [];
  const warnings = [];

  for (const file of files) {
    const isCss = file.endsWith('.css');
    let data;
    try {
      data = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = file.replace(resolve(appDir) + '/', '');

    for (const rule of PARSE_LEVEL) {
      const m = data.match(rule.re);
      if (m) violations.push({ rule: rule.id, file: rel, hint: rule.hint });
    }
    for (const rule of RUNTIME) {
      const m = data.match(rule.re);
      if (!m) continue;
      const allowed = rule.allowWhen?.some((re) => re.test(data));
      if (allowed) {
        warnings.push({ rule: rule.id, file: rel, hint: `${rule.hint} [occurrencia cubierta por idiom protegido revisado]` });
      } else if (rule.covered) {
        warnings.push({ rule: rule.id, file: rel, hint: `${rule.hint} [cubierta por LegacyBrowserPolyfills]` });
      } else {
        violations.push({ rule: rule.id, file: rel, hint: rule.hint });
      }
    }
    if (isCss) {
      const hasDvh = /100dvh/.test(data);
      const hasVhFallback = /100vh/.test(data);
      if (hasDvh && !hasVhFallback) {
        warnings.push({
          rule: 'css-dvh-sin-vh',
          file: rel,
          hint: 'El archivo usa 100dvh y no contiene ningún 100vh. Patrón canónico: min-h-(--vh-full) (token con @supports en packages/ui/src/tokens.css).',
        });
      }
      for (const rule of WARNINGS) {
        const m = data.match(rule.re);
        if (m) warnings.push({ rule: rule.id, file: rel, hint: rule.hint });
      }
    }
  }

  const uniq = (arr) => [...new Map(arr.map((v) => [v.rule + '|' + v.file, v])).values()];

  for (const w of uniq(warnings)) {
    console.warn(`⚠ [compat-audit] ${w.rule} en ${w.file} — ${w.hint}`);
  }
  for (const v of uniq(violations)) {
    console.error(`✗ [compat-audit] ${v.rule} en ${v.file} — ${v.hint}`);
  }

  if (violations.length > 0) {
    console.error(`\n[compat-audit] ${uniq(violations).length} violación(es) de compatibilidad Safari 15. Build BLOQUEADO.`);
    process.exit(1);
  }
  console.log(`\n[compat-audit] OK — ${files.length} archivo(s) escaneados, sin violaciones de compatibilidad.`);
}

const appDir = process.argv[2] ?? '.';
scan(appDir);
