/**
 * Metodología de impacto regenerativo — O&Z / Chiloé.
 *
 * Principio: coeficientes **explícitos, versionados y conservadores**.
 * No pretenden precisión de LCA certificada; permiten verificar el cálculo
 * y no esconder “magia” en dashboards.
 *
 * Versión: bump cuando cambie un coeficiente o la fórmula IRR.
 */

export const IMPACTO_METODOLOGIA_VERSION = '2026.10.1';

export const IMPACTO_METODOLOGIA_ACTUALIZADO = '2026-10-04';

/** Territorio de referencia de los coeficientes. */
export const IMPACTO_TERRITORIO = 'Chiloé, Chile — bosque nativo templado lluvioso';

/**
 * Coeficientes centrales.
 * Unidades y límites de uso documentados en cada campo.
 */
export const IMPACTO_COEFICIENTES = {
  /**
   * tCO₂e secuestradas estimadas base por individuo plantado (árbol nativo, orden de magnitud genérico).
   * Conservado para compatibilidad histórica en llamadas sin estadio alométrico.
   */
  co2_ton_por_arbol: 0.05,

  /**
   * tCO₂e emitidas estimadas por árbol en establecimiento (vivero, transporte, plantación).
   * Solo para el cociente IRR simplificado histórico (no es inventario de emisiones real).
   */
  co2_emitido_ton_por_arbol: 0.005,

  /**
   * kg CO₂e evitados por kg de miel cruda vs. azúcar refinada (orden de magnitud comercial).
   * Usar solo en estimaciones de frasco/carrito cuando no hay `productos.co2_evitado_kg`.
   */
  co2_evitado_kg_por_kg_miel: 2.4,

  /**
   * kg CO₂e evitados por frasco “típico” 500 g si no hay dato de producto.
   * = 0.5 kg × co2_evitado_kg_por_kg_miel
   */
  co2_evitado_kg_por_frasco_500g: 1.2,
} as const;

export type EspecieAlometria = {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  densidadMadera_g_cm3: number;
  estrato: 'dosel_emergente' | 'dosel_dominante' | 'estrato_medio' | 'sotobosque_humedo' | 'ribera_quebrada';
  funcionApicola: string;
  relevancia: 'nectar' | 'polen' | 'mixta' | 'propoleo';
  mesesFloracion: string;
  tasaCapturaAnualMedia_kg_arbol: number;
  stockAdultoMedio_tco2: number;
};

export const ESPECIES_ALOMETRIA_CHILOE: Record<string, EspecieAlometria> = {
  ulmo: {
    id: 'ulmo',
    nombreComun: 'Ulmo',
    nombreCientifico: 'Eucryphia cordifolia',
    densidadMadera_g_cm3: 0.58,
    estrato: 'dosel_emergente',
    funcionApicola: 'Flor reina estival. Flujo masivo de néctar blanco de alta cristalización.',
    relevancia: 'nectar',
    mesesFloracion: 'Febrero – Marzo',
    tasaCapturaAnualMedia_kg_arbol: 18.5,
    stockAdultoMedio_tco2: 0.85,
  },
  tiaca: {
    id: 'tiaca',
    nombreComun: 'Tiaca',
    nombreCientifico: 'Caldcluvia paniculata',
    densidadMadera_g_cm3: 0.52,
    estrato: 'ribera_quebrada',
    funcionApicola: 'Néctar balsámico profundo y aromático de cierre estival.',
    relevancia: 'nectar',
    mesesFloracion: 'Febrero – Abril',
    tasaCapturaAnualMedia_kg_arbol: 12.0,
    stockAdultoMedio_tco2: 0.45,
  },
  meli: {
    id: 'meli',
    nombreComun: 'Melí',
    nombreCientifico: 'Amomyrtus meli',
    densidadMadera_g_cm3: 0.78,
    estrato: 'estrato_medio',
    funcionApicola: 'Mirtácea endémica aromática. Néctar suave con notas terpénicas.',
    relevancia: 'mixta',
    mesesFloracion: 'Diciembre – Enero',
    tasaCapturaAnualMedia_kg_arbol: 8.5,
    stockAdultoMedio_tco2: 0.38,
  },
  tepu: {
    id: 'tepu',
    nombreComun: 'Tepú',
    nombreCientifico: 'Tepualia stipularis',
    densidadMadera_g_cm3: 0.85,
    estrato: 'sotobosque_humedo',
    funcionApicola: 'Guardián de turberas. Aporte mineral denso y polen invernal.',
    relevancia: 'polen',
    mesesFloracion: 'Enero – Febrero',
    tasaCapturaAnualMedia_kg_arbol: 6.2,
    stockAdultoMedio_tco2: 0.28,
  },
  canelo: {
    id: 'canelo',
    nombreComun: 'Canelo',
    nombreCientifico: 'Drimys winteri',
    densidadMadera_g_cm3: 0.46,
    estrato: 'dosel_dominante',
    funcionApicola: 'Árbol sagrado de alta resiliencia. Polen proteico de primavera y resinas.',
    relevancia: 'mixta',
    mesesFloracion: 'Octubre – Diciembre',
    tasaCapturaAnualMedia_kg_arbol: 14.0,
    stockAdultoMedio_tco2: 0.52,
  },
  avellano: {
    id: 'avellano',
    nombreComun: 'Avellano',
    nombreCientifico: 'Gevuina avellana',
    densidadMadera_g_cm3: 0.50,
    estrato: 'estrato_medio',
    funcionApicola: 'Polen proteico esencial para fortalecimiento post-invernal de la cría.',
    relevancia: 'polen',
    mesesFloracion: 'Octubre – Noviembre',
    tasaCapturaAnualMedia_kg_arbol: 9.8,
    stockAdultoMedio_tco2: 0.32,
  },
  coigue: {
    id: 'coigue',
    nombreComun: 'Coigüe de Chiloé',
    nombreCientifico: 'Nothofagus nitida',
    densidadMadera_g_cm3: 0.62,
    estrato: 'dosel_emergente',
    funcionApicola: 'Estructura nodriza del dosel maduro y reserva hídrica de cuenca.',
    relevancia: 'propoleo',
    mesesFloracion: 'Noviembre – Enero',
    tasaCapturaAnualMedia_kg_arbol: 22.0,
    stockAdultoMedio_tco2: 1.20,
  },
  arrayan: {
    id: 'arrayan',
    nombreComun: 'Arrayán',
    nombreCientifico: 'Luma apiculata',
    densidadMadera_g_cm3: 0.76,
    estrato: 'sotobosque_humedo',
    funcionApicola: 'Resinas biocidas naturales y aromáticas para propóleos del bosque.',
    relevancia: 'propoleo',
    mesesFloracion: 'Diciembre – Febrero',
    tasaCapturaAnualMedia_kg_arbol: 5.5,
    stockAdultoMedio_tco2: 0.22,
  },
};

export type EstadioCrecimiento =
  | 'plantula'
  | 'joven'
  | 'creciendo'
  | 'adulto'
  | 'monumental';

export const FACTORES_ESTADIO: Record<
  EstadioCrecimiento,
  {
    label: string;
    descripcion: string;
    dapRangoCm: [number, number];
    factorStockRelativo: number;
    stockBasePorDefecto_tco2: number;
    factorTasaAnual: number;
  }
> = {
  plantula: {
    label: 'Plántula / Vivero',
    descripcion: 'Establecimiento temprano (DAP < 5 cm). Alta demanda de custodia inicial.',
    dapRangoCm: [0, 5],
    factorStockRelativo: 0.015,
    stockBasePorDefecto_tco2: 0.005,
    factorTasaAnual: 0.25,
  },
  joven: {
    label: 'Juvenil Establecido',
    descripcion: 'Enraizamiento consolidado (DAP 5–15 cm). Comienza ramificación activa.',
    dapRangoCm: [5, 15],
    factorStockRelativo: 0.1,
    stockBasePorDefecto_tco2: 0.035,
    factorTasaAnual: 0.7,
  },
  creciendo: {
    label: 'Fustal en Crecimiento',
    descripcion: 'Crecimiento vigoroso (DAP 15–30 cm). Máxima tasa relativa de fijación anual.',
    dapRangoCm: [15, 30],
    factorStockRelativo: 0.35,
    stockBasePorDefecto_tco2: 0.12,
    factorTasaAnual: 1.25,
  },
  adulto: {
    label: 'Adulto en Dosel',
    descripcion: 'Madurez plena (DAP 30–60 cm). Floración masiva y gran stock permanente.',
    dapRangoCm: [30, 60],
    factorStockRelativo: 1.0,
    stockBasePorDefecto_tco2: 0.45,
    factorTasaAnual: 1.0,
  },
  monumental: {
    label: 'Monumental / Veterano',
    descripcion: 'Árbol histórico centenario (DAP ≥ 60 cm). Reservorio biofísico de bosque primario.',
    dapRangoCm: [60, 200],
    factorStockRelativo: 2.5,
    stockBasePorDefecto_tco2: 1.25,
    factorTasaAnual: 0.65,
  },
};

export type RegimenInventario = 'preservacion' | 'reforestacion';

export const CAMPANA_CENSO_DEFAULT = '2026-2027';

export interface MetaCensoCampana {
  campana: string;
  arbolesObjetivo: number;
  superficieEstimadaHa: number;
  apiarioReferencia: string;
  sectorReferencia: string;
  descripcion: string;
}

export const META_CENSO_2026_2027: MetaCensoCampana = {
  campana: '2026-2027',
  arbolesObjetivo: 3000,
  superficieEstimadaHa: 18.5,
  apiarioReferencia: 'Apiario Principal Pureo',
  sectorReferencia: 'Pureo Rural km 8560, Chiloé',
  descripcion:
    'Censo biofísico árbol a árbol del bosque nativo templado lluvioso circundante al Apiario Principal Pureo (radio de pecoreo de 2.5 km).',
};

export function normalizarClaveEspecie(nombre?: string | null): string {
  if (!nombre) return '';
  const clean = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (clean.includes('ulmo')) return 'ulmo';
  if (clean.includes('tiaca')) return 'tiaca';
  if (clean.includes('meli')) return 'meli';
  if (clean.includes('tepu')) return 'tepu';
  if (clean.includes('canelo')) return 'canelo';
  if (clean.includes('avellano')) return 'avellano';
  if (clean.includes('coigue')) return 'coigue';
  if (clean.includes('arrayan')) return 'arrayan';
  return clean;
}

export function normalizarEstadio(status?: string | null): EstadioCrecimiento {
  if (!status) return 'joven';
  const s = status.toLowerCase().trim();
  if (s === 'plantula' || s === 'vivero') return 'plantula';
  if (s === 'joven') return 'joven';
  if (s === 'creciendo' || s === 'fustal') return 'creciendo';
  if (s === 'adulto' || s === 'dosel') return 'adulto';
  if (s === 'monumental' || s === 'veterano') return 'monumental';
  return 'joven';
}

export interface ResultadoCalculoAlometria {
  stockCo2Ton: number;
  capturaAnualKg: number;
  factorEspecieUsado: number;
  estadioNormalizado: EstadioCrecimiento;
  regimen: RegimenInventario;
  especieResuelta: EspecieAlometria | null;
}

/**
 * Calcula el stock de CO2 retenido y la tasa anual estimada de fijación según especie y estadio.
 */
export function calcularBiomasaYCO2(params: {
  especie: string;
  cantidad: number;
  estadio?: string | null;
  dapCm?: number | null;
  regimen?: RegimenInventario | null;
}): ResultadoCalculoAlometria {
  const n = Math.max(0, Math.floor(Number(params.cantidad) || 0));
  const key = normalizarClaveEspecie(params.especie);
  const esp = ESPECIES_ALOMETRIA_CHILOE[key] ?? null;

  // Resolver estadio: si viene dapCm numérico explícito, tiene prioridad
  let estadio: EstadioCrecimiento = normalizarEstadio(params.estadio);
  if (typeof params.dapCm === 'number' && Number.isFinite(params.dapCm) && params.dapCm > 0) {
    const d = params.dapCm;
    if (d < 5) estadio = 'plantula';
    else if (d < 15) estadio = 'joven';
    else if (d < 30) estadio = 'creciendo';
    else if (d < 60) estadio = 'adulto';
    else estadio = 'monumental';
  }

  const factorEstadio = FACTORES_ESTADIO[estadio];
  const regimen: RegimenInventario = params.regimen === 'reforestacion' ? 'reforestacion' : 'preservacion';

  // Stock base en toneladas de CO2e
  const baseStockUnitario = esp
    ? esp.stockAdultoMedio_tco2 * factorEstadio.factorStockRelativo
    : factorEstadio.stockBasePorDefecto_tco2;

  const stockTotalTon = parseFloat((n * baseStockUnitario).toFixed(3));

  // Tasa anual de captura activa en kg CO2/año
  const tasaAnualBase = esp
    ? esp.tasaCapturaAnualMedia_kg_arbol * factorEstadio.factorTasaAnual
    : 10 * factorEstadio.factorTasaAnual;

  const capturaAnualTotalKg = parseFloat((n * tasaAnualBase).toFixed(2));

  return {
    stockCo2Ton: stockTotalTon,
    capturaAnualKg: capturaAnualTotalKg,
    factorEspecieUsado: esp ? esp.densidadMadera_g_cm3 : 0.55,
    estadioNormalizado: estadio,
    regimen,
    especieResuelta: esp,
  };
}

export type ImpactoFuente = {
  id: string;
  titulo: string;
  nota: string;
  url?: string;
};

export const IMPACTO_FUENTES: ImpactoFuente[] = [
  {
    id: 'ipcc-afolu',
    titulo: 'IPCC — AFOLU / Biomasa y Carbono Forestal (Volumen 4, Bosques Templados Húmedos)',
    nota: 'Metodología de referencia para factores de expansión de biomasa (BEF), densidad básica de madera y relación raíz/vástago en bosque templado.',
    url: 'https://www.ipcc-nggip.iges.or.jp/',
  },
  {
    id: 'bosque-chiloe',
    titulo: 'Bosque Nativo Templado Lluvioso de Chiloé (Donoso et al. / CONAF)',
    nota: 'Parámetros ecológicos de densidad y alometría para Ulmo, Tiaca, Melí, Tepú y Canelo. Diferenciación estricta entre stock de custodia y tasa de incremento anual.',
  },
  {
    id: 'miel-vs-azucar',
    titulo: 'Sustitución de Azúcar Refinada por Miel Cruda Viva',
    nota: 'Estimación de emisiones evitadas por sustitución de endulzantes industriales; no constituye crédito de carbono compensatorio.',
  },
];

export type ImpactoLimite = {
  id: string;
  texto: string;
};

export const IMPACTO_LIMITES: ImpactoLimite[] = [
  {
    id: 'no-lca',
    texto: 'No es un Análisis de Ciclo de Vida (ACV/LCA) verificado por tercera parte ni un crédito de carbono transferible.',
  },
  {
    id: 'orden-magnitud',
    texto: 'Los factores alométricos son órdenes de magnitud conservadores para gestión biofísica y transparencia, no para trading financiero de compensaciones.',
  },
  {
    id: 'irr-simple',
    texto: 'El IRR territorial representa la ratio biofísica neta (captura/stock vs. huella de operaciones), no una tasa interna de retorno bancaria.',
  },
  {
    id: 'censo-2026-2027',
    texto: 'La línea base cuantitativa se alimenta del censo georreferenciado árbol a árbol del Apiario Principal Pureo (Campaña 2026–2027).',
  },
];

/** tCO₂e secuestradas para N árboles con soporte retrocompatible y alométrico opcional. */
export function co2TonFromArboles(
  cantidad: number,
  especie?: string | null,
  estadio?: string | null,
): number {
  const n = Math.max(0, Math.floor(Number(cantidad) || 0));
  if (n === 0) return 0;
  if (!especie && !estadio) {
    return parseFloat((n * IMPACTO_COEFICIENTES.co2_ton_por_arbol).toFixed(2));
  }
  const calc = calcularBiomasaYCO2({ especie: especie || '', cantidad: n, estadio });
  return parseFloat(calc.stockCo2Ton.toFixed(2));
}

/**
 * IRR simplificado = secuestrado / emitido_estimado.
 * Si no hay base de emisión, retorna null.
 */
export function computeIrrSimplificado(
  co2SecuestradoTon: number,
  nArboles: number,
  co2EmitidoRealTon?: number | null,
): number | null {
  const emitido =
    typeof co2EmitidoRealTon === 'number' && co2EmitidoRealTon > 0
      ? co2EmitidoRealTon
      : Math.max(0, nArboles) * IMPACTO_COEFICIENTES.co2_emitido_ton_por_arbol;

  if (emitido <= 0) return null;
  const irr = co2SecuestradoTon / emitido;
  if (!Number.isFinite(irr)) return null;
  return parseFloat(irr.toFixed(2));
}

/** Estimación de CO₂ evitado (kg) por frascos de 500 g si no hay dato de producto. */
export function co2EvitadoKgFrascos500g(nFrascos: number): number {
  const n = Math.max(0, Number(nFrascos) || 0);
  return parseFloat((n * IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g).toFixed(1));
}

export type ImpactoMetodologiaPublica = {
  version: string;
  actualizado: string;
  territorio: string;
  coeficientes: typeof IMPACTO_COEFICIENTES;
  especies: typeof ESPECIES_ALOMETRIA_CHILOE;
  estadios: typeof FACTORES_ESTADIO;
  metaCenso: typeof META_CENSO_2026_2027;
  formulas: {
    co2_ton_plantacion: string;
    irr_simplificado: string;
    co2_frasco_500g: string;
  };
  fuentes: ImpactoFuente[];
  limites: ImpactoLimite[];
};

export const IMPACTO_FORMULAS = {
  co2_ton_plantacion: `co2_ton = cantidad_árboles × factor_alométrico(especie, DAP, estadio)`,
  irr_simplificado: `IRR = co2_secuestrado_ton / co2_emitido_operaciones_ton`,
  co2_frasco_500g: `co2_evitado_kg ≈ n_frascos × ${IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g}`,
} as const;

export function getMetodologiaPublica(): ImpactoMetodologiaPublica {
  return {
    version: IMPACTO_METODOLOGIA_VERSION,
    actualizado: IMPACTO_METODOLOGIA_ACTUALIZADO,
    territorio: IMPACTO_TERRITORIO,
    coeficientes: IMPACTO_COEFICIENTES,
    especies: ESPECIES_ALOMETRIA_CHILOE,
    estadios: FACTORES_ESTADIO,
    metaCenso: META_CENSO_2026_2027,
    formulas: IMPACTO_FORMULAS,
    fuentes: IMPACTO_FUENTES,
    limites: IMPACTO_LIMITES,
  };
}

export type ImpactoOpenBook = {
  metodologia_version: string;
  arboles_plantados: number;
  co2_secuestrado_ton: number;
  co2_anual_kg: number;
  irr_simplificado: number | null;
  zonas: number;
  especies: number;
  campana: string;
  meta_progreso_pct: number;
  nota: string;
};

export function buildOpenBookFromArboles(
  rows: Array<{
    cantidad?: number | null;
    co2_ton?: number | null;
    co2_anual_kg?: number | null;
    sector?: string | null;
    especie?: string | null;
    campana?: string | null;
  }>,
): ImpactoOpenBook {
  const arboles = rows.reduce((s, r) => s + (Number(r.cantidad) || 0), 0);
  const co2 = rows.reduce((s, r) => s + (Number(r.co2_ton) || 0), 0);
  const co2Anual = rows.reduce((s, r) => s + (Number(r.co2_anual_kg) || 0), 0);
  const zonas = new Set(rows.map((r) => r.sector).filter(Boolean)).size;
  const especies = new Set(rows.map((r) => r.especie).filter(Boolean)).size;
  const metaProgreso = META_CENSO_2026_2027.arbolesObjetivo > 0
    ? parseFloat(((arboles / META_CENSO_2026_2027.arbolesObjetivo) * 100).toFixed(1))
    : 0;

  return {
    metodologia_version: IMPACTO_METODOLOGIA_VERSION,
    arboles_plantados: arboles,
    co2_secuestrado_ton: parseFloat(co2.toFixed(2)),
    co2_anual_kg: parseFloat(co2Anual.toFixed(1)),
    irr_simplificado: computeIrrSimplificado(co2, arboles),
    zonas,
    especies,
    campana: CAMPANA_CENSO_DEFAULT,
    meta_progreso_pct: metaProgreso,
    nota: 'Agregado de inventario biofísico y censo forestal del bosque nativo. Sin datos privados de terceros.',
  };
}
