// Parser de transcripciones de la bitácora — patrón ReceiptParser de
// packages/contable (detect → parse → confidence), adaptado a voz apícola:
// marcadores de colmena (§3.2) + extracción de campos + confianza con umbral.
// Lógica 100% determinista y testeable (sin LLM) — el LLM/STT solo transcribe.
// Referencia: docs/BITACORA_APICOLA.md §5.2 y §8.

import type {
  CuerpoCuadro,
  FaseBitacora,
  TipoCuadro,
} from '@/lib/bitacora-types';

// ---------------------------------------------------------------------------
// Normalización y números hablados
// ---------------------------------------------------------------------------

const NUMEROS_ES: Record<string, number> = {
  una: 1, un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, dieciseis: 16, dieciséis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22,
  veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
  cuarenta: 40, cincuenta: 50,
};

/** Normaliza: minúsculas, sin acentos, espacio simple. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:¿?¡!()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "veinte" | "20" | "veinticinco" → 25 | null */
export function numeroHablado(palabra: string): number | null {
  if (/^\d+$/.test(palabra)) {
    const n = Number(palabra);
    return Number.isInteger(n) && n > 0 && n <= 100 ? n : null;
  }
  return NUMEROS_ES[palabra] ?? null;
}

// ---------------------------------------------------------------------------
// Marcadores de colmena (§3.2) — segmentación del discurso libre
// ---------------------------------------------------------------------------

export type MarcadorColmena = {
  etiqueta: string; // forma hablada: "colmena veinte", "la 15", "núcleo cinco"
  numero: number;
  start: number; // offset en el texto normalizado
  end: number;
};

const MARCADOR_RE =
  /\b(?:colmena|colmenas|nucleo|núcleo|la|el)\s+(?:numero\s+|número\s+|n°\s*)?([a-záéíóú]+|\d+)\b/g;

/** Detecta "colmena veinte", "la 15", "núcleo cinco" — tolerante a variación. */
export function detectarMarcadores(texto: string): MarcadorColmena[] {
  const normalizado = normalizeText(texto);
  const marcadores: MarcadorColmena[] = [];
  for (const match of normalizado.matchAll(MARCADOR_RE)) {
    const palabra = match[1]!;
    // "la veinte" debe referirse a una colmena, no a "la abeja"/"la reina"
    if (palabra === 'abeja' || palabra === 'abejas' || palabra === 'reina' || palabra === 'miel') continue;
    const numero = numeroHablado(palabra);
    if (numero === null) continue;
    const start = match.index ?? 0;
    marcadores.push({
      etiqueta: normalizado.slice(start, start + match[0].length).trim(),
      numero,
      start,
      end: start + match[0].length,
    });
  }
  return marcadores;
}

export type FragmentoColmena = {
  etiqueta: string;
  numero: number;
  fragmento: string;
};

/** Segmenta el discurso: todo lo dicho entre marcador y marcador pertenece a esa colmena. */
export function segmentarPorColmenas(texto: string): FragmentoColmena[] {
  const normalizado = normalizeText(texto);
  const marcadores = detectarMarcadores(normalizado);
  if (marcadores.length === 0) return [];

  const fragmentos: FragmentoColmena[] = [];
  for (let i = 0; i < marcadores.length; i++) {
    const actual = marcadores[i]!;
    const siguiente = marcadores[i + 1];
    const inicio = actual.end;
    const fin = siguiente ? siguiente.start : normalizado.length;
    const fragmento = normalizado.slice(inicio, fin).trim();
    fragmentos.push({
      etiqueta: actual.etiqueta,
      numero: actual.numero,
      fragmento,
    });
  }
  return fragmentos;
}

// ---------------------------------------------------------------------------
// Parsers de campos (patrón detect → parse de los parsers de recibos)
// ---------------------------------------------------------------------------

export type InspeccionParseResult = {
  fase?: FaseBitacora;
  reina?: 'RV' | 'NV' | 'SR';
  poblacion?: string;
  marcos_cria: number;
  marcos_miel: number;
  cuadros: { cuerpo: CuerpoCuadro; tipo: TipoCuadro; notas?: string }[];
  notas: string;
  fields_found: string[]; // alimenta la confianza
};

const FASE_PATTERNS: { re: RegExp; fase: FaseBitacora }[] = [
  { re: /\bnucleo\b|\bnúcleo\b/, fase: 'nucleo' },
  { re: /\btraspas/, fase: 'traspaso' },
  { re: /\balza\s*(?:numero\s*)?uno\b|\balza\s*1\b|\bprimera alza\b/, fase: 'alza' },
  { re: /\b(?:segunda alza|alza\s*(?:numero\s*)?dos|alza\s*2)\b/, fase: 'alza' },
  { re: /\b(?:tercera alza|alza\s*(?:numero\s*)?tres|alza\s*3)\b/, fase: 'alza' },
  { re: /\bcosecha\b/, fase: 'cosecha' },
  { re: /\binvernad/, fase: 'invernada' },
  { re: /\btemporada\b|\bprimavera\b/, fase: 'temporada' },
];

const REINA_PATTERNS: { re: RegExp; estado: 'RV' | 'NV' | 'SR' }[] = [
  { re: /\bsin reina\b/, estado: 'SR' },
  { re: /\breina (?:no )?(?:vista|presente|ahi|ahí|esta|está)\b/, estado: 'RV' },
  { re: /\breina (?:no )?vista\b/, estado: 'NV' },
  { re: /\bno veo (?:la )?reina\b|\breina no aparece\b/, estado: 'NV' },
];

const POBLACION_PATTERNS: { re: RegExp; valor: string }[] = [
  { re: /\bpoblacion (?:muy )?fuerte\b|\bfuerte\b/, valor: 'fuerte' },
  { re: /\bpoblacion (?:muy )?floja\b|\bfloja\b/, valor: 'floja' },
  { re: /\bpoblacion normal\b|\bnormal\b/, valor: 'normal' },
];

// Soporta "cuadros", "marcos", "de cría", "con cría", miel y singulares implícitos ("cuadro de miel")
const CUADRO_PATTERNS: { re: RegExp; tipo: TipoCuadro; campo: string }[] = [
  // Cría abierta específica
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)\s+cr[ií]a\s+abierta\b/gi, tipo: 'cria_abierta', campo: 'cria_abierta' },
  // Cría cerrada específica (cerrada u operculada)
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)\s+cr[ií]a\s+(?:cerrada|operculada)\b/gi, tipo: 'cria_cerrada', campo: 'cria_cerrada' },
  // Cría general ("cinco marcos de cría", "3 cuadros con cría", "4 de cría") — no debe duplicar abierta/cerrada
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)\s+cr[ií]a(?!\s+(?:abierta|cerrada|operculada))\b/gi, tipo: 'cria_cerrada', campo: 'cria_cerrada' },
  // Miel con cantidad ("cinco de miel", "2 marcos de miel", "tres cuadros con miel")
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)?\s*miel\b/gi, tipo: 'miel', campo: 'miel' },
  // Miel singular sin número ("cuadro de miel", "marco de miel", "y cuadro de miel")
  { re: /(?:^|\s)(?:y\s+)?(?:un\s+)?(?:cuadro|marco)\s+(?:con|de)\s+miel\b/gi, tipo: 'miel', campo: 'miel' },
  // Cría singular sin número ("cuadro de cría", "marco con cría")
  { re: /(?:^|\s)(?:y\s+)?(?:un\s+)?(?:cuadro|marco)\s+(?:con|de)\s+cr[ií]a(?!\s+(?:abierta|cerrada|operculada))\b/gi, tipo: 'cria_cerrada', campo: 'cria_cerrada' },
  // Cera estampada
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)?\s+cera\s+(?:estampada|fundada)\b/gi, tipo: 'cera_estampada', campo: 'cera_estampada' },
  // Cera labrada
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)?\s+cera\s+(?:labrada|trabajada)\b/gi, tipo: 'cera_labrada', campo: 'cera_labrada' },
  // Vacíos
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s+vac[ií]os?\b/gi, tipo: 'vacio', campo: 'vacio' },
  // Polen
  { re: /(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:cuadros?|marcos?)?\s*(?:con|de)?\s+polen\b/gi, tipo: 'polen', campo: 'polen' },
];

/** Cuántos cuadros indica la frase: "seis" → 6, "4" → 4, "una" → 1. */
function cantidadDe(match: string): number {
  return numeroHablado(match) ?? 1;
}

function parseFase(fragmento: string, found: string[]): FaseBitacora | undefined {
  for (const { re, fase } of FASE_PATTERNS) {
    if (re.test(fragmento)) {
      found.push('fase');
      return fase;
    }
  }
  return undefined;
}

function parseReina(fragmento: string, found: string[]): 'RV' | 'NV' | 'SR' | undefined {
  // "reina no vista" es NV; la regla RV no debe ganarle
  if (/\breina no (?:vista|aparece)\b/.test(fragmento)) {
    found.push('reina');
    return 'NV';
  }
  for (const { re, estado } of REINA_PATTERNS) {
    if (re.test(fragmento)) {
      found.push('reina');
      return estado;
    }
  }
  return undefined;
}

function parsePoblacion(fragmento: string, found: string[]): string | undefined {
  for (const { re, valor } of POBLACION_PATTERNS) {
    if (re.test(fragmento)) {
      found.push('poblacion');
      return valor;
    }
  }
  return undefined;
}

function parseCuadros(fragmento: string, found: string[]): {
  marcos_cria: number;
  marcos_miel: number;
  cuadros: { cuerpo: CuerpoCuadro; tipo: TipoCuadro }[];
} {
  let marcos_cria = 0;
  let marcos_miel = 0;
  const cuadros: { cuerpo: CuerpoCuadro; tipo: TipoCuadro }[] = [];
  const cuerpo: CuerpoCuadro = /\balza\b/.test(fragmento) ? 'alza_1' : 'camara';

  for (const { re, tipo, campo } of CUADRO_PATTERNS) {
    for (const match of fragmento.matchAll(re)) {
      const n = match[1] ? cantidadDe(match[1]) : 1;
      if (tipo === 'cria_abierta' || tipo === 'cria_cerrada') {
        marcos_cria += n;
      } else if (tipo === 'miel') {
        marcos_miel += n;
      }
      for (let i = 0; i < n; i++) cuadros.push({ cuerpo, tipo });
      if (!found.includes(campo)) found.push(campo);
    }
  }
  return { marcos_cria, marcos_miel, cuadros };
}

/** Parseo de un fragmento de una colmena → campos estructurados. */
export function parseFragmento(fragmentoRaw: string): InspeccionParseResult {
  // La segmentación ya normaliza; el parseo directo (tests/curaduría) también
  const fragmento = normalizeText(fragmentoRaw);
  const found: string[] = [];
  const fase = parseFase(fragmento, found);
  const reina = parseReina(fragmento, found);
  const poblacion = parsePoblacion(fragmento, found);
  const { marcos_cria, marcos_miel, cuadros } = parseCuadros(fragmento, found);

  // Resto no reconocido → notas (la voz libre no se pierde)
  let notas = fragmento;
  for (const re of [
    /\b(?:colmena|nucleo|núcleo|la|el)\b/g,
    /\bcuadros?\b/g,
    /\b\d+\b/g,
    /\b(?:con|de|y|o|pero|que|un|una|los|las|seis|cuatro|dos|tres|cinco|siete|ocho|nueve|diez|muy|está|esta)\b/g,
  ]) {
    notas = notas.replace(re, ' ');
  }
  notas = notas.replace(/\s+/g, ' ').trim();

  return {
    fase,
    reina,
    poblacion,
    marcos_cria,
    marcos_miel,
    cuadros,
    notas,
    fields_found: found,
  };
}

// ---------------------------------------------------------------------------
// Confianza (concepto de parse-confidence.ts de contable) y orquestador
// ---------------------------------------------------------------------------

const PESOS: Record<string, number> = {
  fase: 0.2,
  reina: 0.25,
  poblacion: 0.1,
  cria_abierta: 0.15,
  cria_cerrada: 0.15,
  miel: 0.15,
  cera_estampada: 0.1,
  cera_labrada: 0.1,
  vacio: 0.1,
  polen: 0.1,
};

/** Puntúa el fragmento con pesos; umbral de auto-aprobación 0.85. */
export function assessConfidence(resultado: InspeccionParseResult): number {
  const score = resultado.fields_found.reduce(
    (acc, campo) => acc + (PESOS[campo] ?? 0),
    0
  );
  return Math.min(1, score);
}

export const PARSE_AUTO_EMIT_THRESHOLD = 0.85;

export type ColmenaParseOutput = {
  etiqueta: string;
  numero: number;
  fragmento: string;
  resultado: InspeccionParseResult;
  confianza: number;
};

/**
 * Orquestador: segmenta el discurso libre por marcadores de colmena y parsea
 * cada fragmento. Orden no correlativo soportado por construcción (los
 * marcadores definen la pertenencia, no la secuencia).
 */
export function parseTranscripcion(texto: string): ColmenaParseOutput[] {
  return segmentarPorColmenas(texto).map(({ etiqueta, numero, fragmento }) => {
    const resultado = parseFragmento(fragmento);
    return {
      etiqueta,
      numero,
      fragmento,
      resultado,
      confianza: assessConfidence(resultado),
    };
  });
}
