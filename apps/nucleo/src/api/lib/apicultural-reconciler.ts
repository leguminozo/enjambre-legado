// Conciliador de invariantes biológicos y físicos Langstroth.
// Realiza el parseo determinista ontológico sobre texto normalizado
// y fusiona con extracciones de LLM (Groq Llama 3.3) garantizando coherencia física.

import {
  normalizeApiculturalText,
  parseSpanishWordNumber,
} from './apicultural-normalizer';
import type {
  InspeccionOntologica,
  EstadoReinaExtendido,
  TipoRealera,
  TemperamentoColmena,
  NivelPoblacion,
  CuadroOntologia,
} from './apicultural-ontology';
import type { FaseBitacora, CuerpoCuadro, TipoCuadro } from '@/lib/bitacora-types';

/** Capacidad estándar de una cámara o alza Langstroth. */
export const CAPACIDAD_LANGSTROTH_ESTANDAR = 10;

/** Extrae la cantidad numérica de una coincidencia de texto. */
function extraerCantidad(matchStr: string): number {
  if (!matchStr) return 1;
  const num = parseInt(matchStr, 10);
  if (!Number.isNaN(num)) return num;
  return parseSpanishWordNumber(matchStr) ?? 1;
}

/**
 * Parser ontológico determinista: extrae todas las entidades apícolas
 * sin requerir conexión a internet ni LLM (0ms latency, 100% predecible).
 */
export function parseApiculturalOntology(rawText: string): InspeccionOntologica {
  const norm = normalizeApiculturalText(rawText);

  // 1. Identificación de Colmena
  let colmenaIdentificador: string | undefined;
  const matchColmena = norm.match(/\b(?:colmena|la|cajon)\s*(\d+|[a-z]+)\b/i);
  if (matchColmena?.[1]) {
    colmenaIdentificador = matchColmena[1].toLowerCase();
  }

  // 2. Fase de la temporada / ciclo
  let fase: FaseBitacora | undefined;
  if (/\b(?:nucleo|traspaso)\b/.test(norm)) fase = 'traspaso';
  else if (/\balza\s*(?:\d+)?\b/.test(norm)) fase = 'alza';
  else if (/\b(?:recoleccion|mielada|cosecha)\b/.test(norm)) fase = 'cosecha';
  else if (/\binvernad[ao]?\b/.test(norm)) fase = 'invernada';
  else if (/\btemporada|primavera\b/.test(norm)) fase = 'temporada';

  // 3. Reina y Reproducción
  let estadoReina: EstadoReinaExtendido | undefined;
  let reinaVista: boolean | undefined = undefined;
  let reinaPresente: boolean | undefined = undefined;
  let posturaFrescaPresente = false;
  let zanganera = false;

  // Detección de postura fresca (huevos)
  if (/\b(?:postura fresca|huevos frescos|huevitos|postura de un dia|postura del dia)\b/.test(norm)) {
    posturaFrescaPresente = true;
    reinaPresente = true;
  }

  // Detección de zanganera
  if (/\b(?:cria zanganera|zanganera|huevos de zangano)\b/.test(norm)) {
    zanganera = true;
    estadoReina = 'SR';
    reinaPresente = false;
    reinaVista = false;
  }

  // Detección de ausencia / no vista de reina
  if (
    /\b(?:no\s+(?:vi|veo|encontre)|sin\s+ver)\s+(?:a\s+)?(?:la\s+)?reina\b/.test(norm) ||
    /\breina\s+no\s+(?:vista|aparece|encontrada)\b/.test(norm)
  ) {
    if (posturaFrescaPresente) {
      estadoReina = 'CI';
      reinaVista = false;
      reinaPresente = true;
    } else {
      estadoReina = 'NV';
      reinaVista = false;
      reinaPresente = false;
    }
  } else if (/\b(?:sin\s+reina|huerfana|reina\s+muerta|falta\s+reina)\b/.test(norm)) {
    estadoReina = 'SR';
    reinaVista = false;
    reinaPresente = false;
  } else if (
    // Detección afirmativa amplia de reina: "una reina", "reina", "con reina", "reina activa", "reina vista", "veo reina", etc.
    /\b(?:vi\s+(?:a\s+)?(?:la\s+)?reina|reina\s+(?:vista|presente|activa|marcada|viva|fecundada|nueva|ok)|veo\s+(?:a\s+)?(?:la\s+)?reina|encontre\s+(?:a\s+)?(?:la\s+)?reina|(?:un[ao]|la|con|hay)\s+reina|^reina$)\b/.test(norm) ||
    (/\breina\b/.test(norm) && !/\b(?:celda|copacelda)\s+de\s+reina\b/.test(norm))
  ) {
    estadoReina = 'RV';
    reinaVista = true;
    reinaPresente = true;
  } else if (posturaFrescaPresente) {
    estadoReina = 'CI';
    reinaVista = false;
    reinaPresente = true;
  }

  // 4. Realeras / Celdas reales
  let realerasDetectadas: { cantidad: number; tipo: TipoRealera } | undefined;
  const matchRealeras = norm.match(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis)?\s*realeras?\b/i);
  if (matchRealeras) {
    const cant = matchRealeras[1] ? extraerCantidad(matchRealeras[1]) : 1;
    let tipo: TipoRealera = 'general';
    if (/\benjambrazon|enjambrar\b/.test(norm)) tipo = 'enjambrazon';
    else if (/\bemergencia\b/.test(norm)) tipo = 'emergencia';
    else if (/\bcopacelda\b/.test(norm)) tipo = 'copacelda';
    realerasDetectadas = { cantidad: cant, tipo };
  }

  // 5. Población y Temperamento
  let nivelPoblacion: NivelPoblacion | undefined;
  let callesAbejas: number | undefined;
  let temperamento: TemperamentoColmena | undefined;

  const matchCalles = norm.match(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+calles?\s+de\s+abejas?\b/i);
  if (matchCalles?.[1]) {
    callesAbejas = extraerCantidad(matchCalles[1]);
    if (callesAbejas <= 4) nivelPoblacion = 'Baja';
    else if (callesAbejas <= 7) nivelPoblacion = 'Media';
    else nivelPoblacion = 'Alta';
  } else if (/\b(?:poblacion muy fuerte|poblacion alta|10 marcos cubiertos|muy poblada|fuerte)\b/.test(norm)) {
    nivelPoblacion = 'Alta';
  } else if (/\b(?:poblacion media|poblacion normal|normal)\b/.test(norm)) {
    nivelPoblacion = 'Media';
  } else if (/\b(?:poblacion baja|poblacion floja|floja|despoblada|poca abeja)\b/.test(norm)) {
    nivelPoblacion = 'Baja';
  }

  if (/\b(?:defensiva|agresiva|picadora)\b/.test(norm)) {
    temperamento = 'Defensiva';
  } else if (/\b(?:mansa|tranquila)\b/.test(norm)) {
    temperamento = 'Mansa';
  }

  // 6. Conteo de Cuadros y Marcos
  let marcosCriaAbierta = 0;
  let marcosCriaCerrada = 0;
  let marcosMiel = 0;
  let marcosNectar = 0;
  let marcosPolen = 0;
  let marcosCeraEstampada = 0;
  let marcosCeraLabrada = 0;
  let marcosVacios = 0;

  const desgloseCuadros: CuadroOntologia[] = [];
  const cuerpoActual: CuerpoCuadro = /\balza\b/.test(norm) ? 'alza_1' : 'camara';

  // Cría abierta: sintaxis 1 ("3 marcos de cría abierta") o sintaxis 2 ("cría abierta en 3 marcos")
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*cr[ií]a\s+abierta\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCriaAbierta += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cria_abierta' });
  }

  // Cría operculada/cerrada: sintaxis 1
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*cr[ií]a\s+operculada\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCriaCerrada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cria_cerrada' });
  }

  // Cría operculada sintaxis 2 ("operculada en 4 marcos")
  for (const m of norm.matchAll(/\b(?:cr[ií]a\s+)?operculada\s+(?:completa\s+)?(?:en\s+)?(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+marcos\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCriaCerrada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cria_cerrada' });
  }

  // Cría zanganera ("cría zanganera salteada en 3 marcos")
  for (const m of norm.matchAll(/\b(?:cr[ií]a\s+)?zanganera[^.\n]*?\ben\s+(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+marcos\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCriaCerrada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cria_cerrada', notas: 'cría zanganera' });
  }

  // Cría general (sin abierta/operculada/zanganera ya contada)
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*cr[ií]a(?!\s+(?:abierta|operculada|zanganera))\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCriaCerrada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cria_cerrada' });
  }
  const marcosCriaTotal = marcosCriaAbierta + marcosCriaCerrada;

  // Miel
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*miel\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosMiel += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'miel' });
  }

  // Néctar fresco / verde
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*n[eé]ctar\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosNectar += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'miel', notas: 'néctar fresco' });
  }

  // Polen / Pan de abeja
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*polen\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosPolen += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'polen' });
  }

  // Cera estampada
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*cera\s+estampada\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCeraEstampada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cera_estampada' });
  }

  // Cera labrada
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*(?:con|de)?\s*cera\s+labrada\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosCeraLabrada += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'cera_labrada' });
  }

  // Cuadros vacíos
  for (const m of norm.matchAll(/(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(?:marcos?|cuadros?)?\s*vac[ií]os?\b/gi)) {
    const cant = m[1] ? extraerCantidad(m[1]) : 1;
    marcosVacios += cant;
    for (let i = 0; i < cant; i++) desgloseCuadros.push({ cuerpo: cuerpoActual, tipo: 'vacio' });
  }

  // 7. Sanidad y Varroa
  let varroaDetectada: string | undefined;
  let varroaNivelEstimado: number | undefined;
  const sintomas: string[] = [];
  let tratamientoMencionado: string | undefined;
  let alertaSanitaria = false;

  if (/\b(?:sin varroa|cero varroa|no hay varroa)\b/.test(norm)) {
    varroaDetectada = '0';
    varroaNivelEstimado = 0;
  } else {
    const matchVarroaNivel = norm.match(
      /varroa\s*(?:al|en)?\s*(\d+(?:[.,]\d+)?\s*%?|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|baja|media|alta)(?:\s*(?:%|por\s+ciento))?/i,
    );
    if (matchVarroaNivel?.[1]) {
      const rawVal = matchVarroaNivel[1].trim();
      const numWord = parseSpanishWordNumber(rawVal);
      const isPercent = norm.includes('por ciento') || norm.includes('%');
      if (numWord !== null) {
        varroaNivelEstimado = numWord;
        varroaDetectada = isPercent ? `${numWord}%` : String(numWord);
        if (numWord > 2.5) alertaSanitaria = true;
      } else {
        const valNum = parseFloat(rawVal.replace(',', '.'));
        if (!Number.isNaN(valNum)) {
          varroaNivelEstimado = valNum;
          varroaDetectada = isPercent && !rawVal.includes('%') ? `${rawVal}%` : rawVal;
          if (valNum > 2.5) alertaSanitaria = true;
        } else if (rawVal === 'alta') {
          varroaNivelEstimado = 5;
          varroaDetectada = 'alta';
          alertaSanitaria = true;
        } else {
          varroaDetectada = rawVal;
        }
      }
    }
  }

  if (/\balas\s+deform(?:adas)?\b/.test(norm)) {
    sintomas.push('Alas deformadas (posible virus DWV / alta varroa)');
    alertaSanitaria = true;
  }
  if (/\bcr[ií]a\s+salteada\b/.test(norm)) {
    sintomas.push('Cría salteada');
  }

  if (/\btimol\b/.test(norm)) tratamientoMencionado = 'timol';
  else if (/\b[aá]cido\s+ox[aá]lico|ox[aá]lico\b/.test(norm)) tratamientoMencionado = 'acido oxalico';

  // 8. Invariantes Físicos Langstroth
  const totalMarcosCamara = marcosCriaTotal + marcosMiel + marcosNectar + marcosPolen + marcosCeraEstampada + marcosCeraLabrada + marcosVacios;
  const excedeCapacidadCamara = totalMarcosCamara > CAPACIDAD_LANGSTROTH_ESTANDAR;
  const alzasDetectadas = (norm.match(/\balza\b/g) || []).length;

  // 9. Acciones Sugeridas Biológicas
  const accionesSugeridas: string[] = [];
  if (realerasDetectadas && realerasDetectadas.cantidad > 0) {
    accionesSugeridas.push('Revisar enjambrazón o emergencia de reina');
  }
  if (alertaSanitaria) {
    accionesSugeridas.push('Tratar varroa orgánicamente (oxálico/timol)');
  }
  if (totalMarcosCamara >= 9 && alzasDetectadas === 0) {
    accionesSugeridas.push('Colocar alza melaria por bloqueo de espacio');
  }
  if (zanganera) {
    accionesSugeridas.push('Intervenir colmena zanganera o fusionar');
  }

  // 10. Confianza General
  let camposEncontrados = 0;
  if (colmenaIdentificador) camposEncontrados += 2;
  if (fase) camposEncontrados += 1;
  if (estadoReina) camposEncontrados += 2;
  if (nivelPoblacion) camposEncontrados += 1;
  if (marcosCriaTotal > 0) camposEncontrados += 2;
  if (marcosMiel > 0) camposEncontrados += 2;
  if (varroaDetectada) camposEncontrados += 1;
  const confianzaGeneral = Math.min(1, Math.max(0.3, camposEncontrados / 8));

  return {
    colmenaIdentificador,
    fase,
    reina: {
      estado: estadoReina,
      vista: reinaVista ?? false,
      presente: reinaPresente ?? false,
      posturaFrescaPresente,
      realerasDetectadas,
      zanganera,
    },
    poblacion: {
      nivel: nivelPoblacion,
      callesAbejas,
      temperamento,
    },
    cuadrosTotales: {
      marcosCriaTotal,
      marcosCriaAbierta,
      marcosCriaCerrada,
      marcosMiel,
      marcosNectar,
      marcosPolen,
      marcosCeraEstampada,
      marcosCeraLabrada,
      marcosVacios,
    },
    desgloseCuadros,
    sanidad: {
      varroaDetectada,
      varroaNivelEstimado,
      sintomas,
      tratamientoMencionado,
      alertaSanitaria,
    },
    invariantesFisicos: {
      totalMarcosCamara,
      excedeCapacidadCamara,
      alzasDetectadas,
    },
    accionesSugeridas,
    confianzaGeneral,
    notas: rawText.trim(),
  };
}

/**
 * Concilia la extracción determinista local con los resultados enriquecidos
 * devueltos por Groq Llama 3.3, preservando siempre la consistencia biológica.
 */
export function reconcileWithLlm(
  det: InspeccionOntologica,
  llmParsed?: Record<string, unknown> | null,
): InspeccionOntologica {
  if (!llmParsed) return det;

  const result: InspeccionOntologica = { ...det };

  // Colmena
  if (!result.colmenaIdentificador && typeof llmParsed['colmenaQuery'] === 'string') {
    result.colmenaIdentificador = (llmParsed['colmenaQuery'] as string).toLowerCase();
  }

  // Reina: si el baseline ya detectó reina vista (ej. "una reina"), prevalece.
  if (result.reina.vista === true) {
    result.reina.presente = true;
    result.reina.estado = 'RV';
  } else if (typeof llmParsed['reinaVista'] === 'boolean') {
    if (llmParsed['reinaVista'] === true) {
      result.reina.vista = true;
      result.reina.presente = true;
      result.reina.estado = 'RV';
    } else if (result.reina.posturaFrescaPresente) {
      result.reina.vista = false;
      result.reina.presente = true;
      result.reina.estado = 'CI';
    } else if (llmParsed['reinaPresente'] === false || result.reina.estado === 'SR') {
      result.reina.vista = false;
      result.reina.presente = false;
      result.reina.estado = 'SR';
    } else if (result.reina.estado === 'NV') {
      result.reina.vista = false;
      result.reina.presente = false;
    }
  }

  // Cría y miel: solo adoptar del LLM si son valores positivos (> 0)
  if (
    typeof llmParsed['marcosCria'] === 'number' &&
    (llmParsed['marcosCria'] as number) > 0 &&
    result.cuadrosTotales.marcosCriaTotal === 0
  ) {
    result.cuadrosTotales.marcosCriaTotal = llmParsed['marcosCria'] as number;
    result.cuadrosTotales.marcosCriaCerrada = llmParsed['marcosCria'] as number;
  }
  if (
    typeof llmParsed['marcosMiel'] === 'number' &&
    (llmParsed['marcosMiel'] as number) > 0 &&
    result.cuadrosTotales.marcosMiel === 0
  ) {
    result.cuadrosTotales.marcosMiel = llmParsed['marcosMiel'] as number;
  }

  // Población y temperamento
  if (!result.poblacion.nivel && typeof llmParsed['poblacion'] === 'string') {
    result.poblacion.nivel = llmParsed['poblacion'] as NivelPoblacion;
  }
  if (!result.poblacion.temperamento && typeof llmParsed['temperamento'] === 'string') {
    result.poblacion.temperamento = llmParsed['temperamento'] as TemperamentoColmena;
  }

  // Varroa
  if (!result.sanidad.varroaDetectada && llmParsed['varroa']) {
    result.sanidad.varroaDetectada = String(llmParsed['varroa']);
  }

  // Fase
  if (!result.fase && typeof llmParsed['fase'] === 'string') {
    result.fase = llmParsed['fase'] as FaseBitacora;
  }

  // Reconciliación de capacidad física
  const recalculatedTotal =
    result.cuadrosTotales.marcosCriaTotal +
    result.cuadrosTotales.marcosMiel +
    result.cuadrosTotales.marcosPolen +
    result.cuadrosTotales.marcosVacios;
  result.invariantesFisicos.totalMarcosCamara = recalculatedTotal;
  result.invariantesFisicos.excedeCapacidadCamara = recalculatedTotal > CAPACIDAD_LANGSTROTH_ESTANDAR;

  // Elevación de confianza tras corroboración mutua
  result.confianzaGeneral = Math.min(1, det.confianzaGeneral + 0.2);

  return result;
}
