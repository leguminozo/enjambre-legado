// Parser de dictado en vivo para la bitácora de voz.
// Reutiliza el parser determinista compartido (@/api/lib/bitacora-parsers:
// números hablados 1–50, cuadros con cría/miel/cera, fase, reina, población)
// y lo adapta al contrato del formulario de inspección (HojaForm).
// Sin dependencias UI: testeable en node.

import {
  detectarMarcadores,
  parseFragmento,
} from '@/api/lib/bitacora-parsers';
import type {
  CuerpoCuadro,
  FaseBitacora,
  TipoCuadro,
} from '@/lib/bitacora-types';

export interface ParsedInspeccionVoice {
  colmenaQuery?: string;
  poblacion?: 'Baja' | 'Media' | 'Alta';
  reinaVista?: boolean;
  marcosCria?: number;
  marcosMiel?: number;
  varroa?: string;
  fase?: FaseBitacora;
  cuadros?: Array<{ cuerpo: CuerpoCuadro; tipo: TipoCuadro }>;
  notasCompletas: string;
}

/** Conversor de palabras numéricas en español a enteros (colmenas 1–50). */
export function parseSpanishNumber(word: string): number | null {
  const clean = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const map: Record<string, number> = {
    cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
    trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
    dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiuna: 21,
    veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
    veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
    treinta: 30, 'treinta y uno': 31, 'treinta y dos': 32, 'treinta y tres': 33,
    'treinta y cuatro': 34, 'treinta y cinco': 35, cuarenta: 40, cincuenta: 50,
  };
  if (clean in map) return map[clean]!;
  const num = parseInt(clean, 10);
  return Number.isNaN(num) ? null : num;
}

/** Parser de lenguaje natural para inspección apícola en dictado. */
export function parseVoiceTranscription(text: string): ParsedInspeccionVoice {
  const trimmed = text.trim();
  const res: ParsedInspeccionVoice = { notasCompletas: trimmed };
  if (!trimmed) return res;

  const lower = trimmed.toLowerCase();

  // Campos estructurados del parser compartido (cuadros, fase, reina, población).
  const resultado = parseFragmento(trimmed);
  if (resultado.fase) res.fase = resultado.fase;
  if (resultado.poblacion === 'fuerte') res.poblacion = 'Alta';
  else if (resultado.poblacion === 'normal') res.poblacion = 'Media';
  else if (resultado.poblacion === 'floja') res.poblacion = 'Baja';
  // Compatibilidad con el vocabulario del modal anterior.
  if (!res.poblacion) {
    if (/poblaci[oó]n alta|mucha abeja/.test(lower)) res.poblacion = 'Alta';
    else if (/poblaci[oó]n baja|poca abeja/.test(lower)) res.poblacion = 'Baja';
    else if (/poblaci[oó]n media|poblaci[oó]n normal/.test(lower)) res.poblacion = 'Media';
  }
  if (resultado.reina === 'RV') res.reinaVista = true;
  else if (resultado.reina === 'NV' || resultado.reina === 'SR') res.reinaVista = false;
  if (resultado.marcos_cria > 0) res.marcosCria = resultado.marcos_cria;
  if (resultado.marcos_miel > 0) res.marcosMiel = resultado.marcos_miel;
  if (resultado.cuadros.length > 0) {
    res.cuadros = resultado.cuadros.map((cuadro) => ({
      cuerpo: cuadro.cuerpo,
      tipo: cuadro.tipo,
    }));
  }

  // Varroa / sanidad (el parser compartido no la cubre).
  if (/sin varroa|cero varroa|no hay varroa|\bsana\b|\bsano\b/.test(lower)) {
    res.varroa = '0';
  } else {
    const matchVarroa = lower.match(/varroa\s*(baja|media|alta|\d+)/i);
    if (matchVarroa?.[1]) res.varroa = matchVarroa[1];
  }

  // Colmena: marcadores compartidos (números hablados hasta 50).
  const marcadores = detectarMarcadores(trimmed);
  if (marcadores.length > 0) {
    res.colmenaQuery = String(marcadores[0]!.numero);
  } else {
    const matchColmena = lower.match(/colmena\s*(\d+|[a-záéíóúñ]+)/i);
    if (matchColmena?.[1]) res.colmenaQuery = matchColmena[1].toLowerCase();
  }

  return res;
}
