// Parser de dictado en vivo para la bitácora de voz.
// Integra la ontología semántica apícola profunda (@/api/lib/apicultural-ontology y reconciler)
// con normalización fonética y reglas biológicas Langstroth.
// Sin dependencias UI: testeable en Node/Vitest.

import { parseApiculturalOntology } from '@/api/lib/apicultural-reconciler';
import { parseSpanishWordNumber } from '@/api/lib/apicultural-normalizer';
import type {
  CuerpoCuadro,
  FaseBitacora,
  TipoCuadro,
} from '@/lib/bitacora-types';
import type { TemperamentoColmena } from '@/api/lib/apicultural-ontology';

export interface ParsedInspeccionVoice {
  colmenaQuery?: string;
  poblacion?: 'Baja' | 'Media' | 'Alta';
  temperamento?: TemperamentoColmena;
  reinaVista?: boolean;
  reinaPresente?: boolean;
  posturaFresca?: boolean;
  realeras?: { cantidad: number; tipo: string };
  zanganera?: boolean;
  marcosCria?: number;
  marcosMiel?: number;
  marcosPolen?: number;
  marcosCeraEstampada?: number;
  marcosCeraLabrada?: number;
  marcosVacios?: number;
  varroa?: string;
  alertaSanitaria?: boolean;
  excedeCapacidadLangstroth?: boolean;
  fase?: FaseBitacora;
  cuadros?: Array<{ cuerpo: CuerpoCuadro; tipo: TipoCuadro }>;
  confianza?: number;
  notasCompletas: string;
}

/** Conversor de palabras numéricas en español a enteros (colmenas 1–100). */
export function parseSpanishNumber(word: string): number | null {
  return parseSpanishWordNumber(word);
}

/**
 * Parser de lenguaje natural profundo para inspección apícola en dictado.
 * Aplica normalización acústica, ontología Langstroth e inferencias biológicas.
 */
export function parseVoiceTranscription(text: string): ParsedInspeccionVoice {
  const trimmed = text.trim();
  const res: ParsedInspeccionVoice = { notasCompletas: trimmed };
  if (!trimmed) return res;

  // Ejecución de la ontología semántica profunda
  const onto = parseApiculturalOntology(trimmed);

  if (onto.colmenaIdentificador) res.colmenaQuery = onto.colmenaIdentificador;
  if (onto.fase) res.fase = onto.fase;

  // Población y temperamento
  if (onto.poblacion.nivel) res.poblacion = onto.poblacion.nivel;
  if (onto.poblacion.temperamento) res.temperamento = onto.poblacion.temperamento;

  // Reina y reproducción
  if (onto.reina.estado === 'RV') {
    res.reinaVista = true;
    res.reinaPresente = true;
  } else if (onto.reina.estado === 'NV') {
    res.reinaVista = false;
    res.reinaPresente = onto.reina.presente;
  } else if (onto.reina.estado === 'SR') {
    res.reinaVista = false;
    res.reinaPresente = false;
  } else if (onto.reina.estado === 'CI') {
    // Reina implícita comprobada por huevos frescos
    res.reinaVista = false;
    res.reinaPresente = true;
  }

  if (onto.reina.posturaFrescaPresente) res.posturaFresca = true;
  if (onto.reina.zanganera) res.zanganera = true;
  if (onto.reina.realerasDetectadas) res.realeras = onto.reina.realerasDetectadas;

  // Marcos y cuadros
  if (onto.cuadrosTotales.marcosCriaTotal > 0) res.marcosCria = onto.cuadrosTotales.marcosCriaTotal;
  if (onto.cuadrosTotales.marcosMiel > 0) res.marcosMiel = onto.cuadrosTotales.marcosMiel;
  if (onto.cuadrosTotales.marcosPolen > 0) res.marcosPolen = onto.cuadrosTotales.marcosPolen;
  if (onto.cuadrosTotales.marcosCeraEstampada > 0) res.marcosCeraEstampada = onto.cuadrosTotales.marcosCeraEstampada;
  if (onto.cuadrosTotales.marcosCeraLabrada > 0) res.marcosCeraLabrada = onto.cuadrosTotales.marcosCeraLabrada;
  if (onto.cuadrosTotales.marcosVacios > 0) res.marcosVacios = onto.cuadrosTotales.marcosVacios;

  if (onto.desgloseCuadros.length > 0) {
    res.cuadros = onto.desgloseCuadros.map((c) => ({
      cuerpo: c.cuerpo,
      tipo: c.tipo,
    }));
  }

  // Sanidad
  if (onto.sanidad.varroaDetectada) res.varroa = onto.sanidad.varroaDetectada;
  if (onto.sanidad.alertaSanitaria) res.alertaSanitaria = true;

  // Invariantes físicos
  if (onto.invariantesFisicos.excedeCapacidadCamara) res.excedeCapacidadLangstroth = true;

  res.confianza = onto.confianzaGeneral;

  return res;
}
