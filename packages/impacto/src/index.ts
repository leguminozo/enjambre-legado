/**
 * Metodología de impacto regenerativo — O&Z / Chiloé.
 *
 * Principio: coeficientes **explícitos, versionados y conservadores**.
 * No pretenden precisión de LCA certificada; permiten verificar el cálculo
 * y no esconder “magia” en dashboards.
 *
 * Versión: bump cuando cambie un coeficiente o la fórmula IRR.
 */

export const IMPACTO_METODOLOGIA_VERSION = '2026.08.1';

export const IMPACTO_METODOLOGIA_ACTUALIZADO = '2026-08-05';

/** Territorio de referencia de los coeficientes. */
export const IMPACTO_TERRITORIO = 'Chiloé, Chile — bosque nativo templado lluvioso';

/**
 * Coeficientes centrales.
 * Unidades y límites de uso documentados en cada campo.
 */
export const IMPACTO_COEFICIENTES = {
  /**
   * tCO₂e secuestradas estimadas por individuo plantado (árbol nativo, orden de magnitud).
   * Se usa al registrar plantaciones en `arboles_plantados.co2_ton`.
   * Conservador frente a valores de marketing forestal comercial.
   */
  co2_ton_por_arbol: 0.05,

  /**
   * tCO₂e emitidas estimadas por árbol en establecimiento (vivero, transporte, plantación).
   * Solo para el cociente IRR simplificado (no es inventario de emisiones real).
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

export type ImpactoFuente = {
  id: string;
  titulo: string;
  nota: string;
  url?: string;
};

export const IMPACTO_FUENTES: ImpactoFuente[] = [
  {
    id: 'ipcc-afolu',
    titulo: 'IPCC — AFOLU / biomasa leñosa (órdenes de magnitud)',
    nota: 'Referencia global de secuestro en biomasa; no es un factor site-specific de Chiloé.',
    url: 'https://www.ipcc.ch/',
  },
  {
    id: 'bosque-chiloe',
    titulo: 'Bosque nativo templado — Chiloé',
    nota: 'Contexto ecológico local (ulmo, tepú, coigüe, etc.). Los coeficientes se mantienen deliberadamente bajos hasta disponer de mediciones propias publicadas.',
  },
  {
    id: 'miel-vs-azucar',
    titulo: 'Sustitución miel cruda vs azúcar refinada',
    nota: 'Estimación comercial de CO₂ evitado por kg; no sustituye un ACV de producto certificado.',
  },
];

export type ImpactoLimite = {
  id: string;
  texto: string;
};

export const IMPACTO_LIMITES: ImpactoLimite[] = [
  {
    id: 'no-lca',
    texto: 'No es un Análisis de Ciclo de Vida (ACV/LCA) verificado por tercera parte.',
  },
  {
    id: 'orden-magnitud',
    texto: 'Los factores son órdenes de magnitud para transparencia y gestión, no para trading de carbono.',
  },
  {
    id: 'irr-simple',
    texto: 'El IRR aquí es un cociente interno (secuestrado / emitido estimado), no la tasa financiera IRR.',
  },
  {
    id: 'datos-propios',
    texto: 'Cuando exista medición en predio o laboratorio, se actualizará la versión y se documentará el cambio.',
  },
];

/** tCO₂e secuestradas para N árboles. */
export function co2TonFromArboles(cantidad: number): number {
  const n = Math.max(0, Math.floor(Number(cantidad) || 0));
  return parseFloat((n * IMPACTO_COEFICIENTES.co2_ton_por_arbol).toFixed(2));
}

/**
 * IRR simplificado = secuestrado / emitido_estimado.
 * Si no hay base de emisión, retorna null.
 */
export function computeIrrSimplificado(
  co2SecuestradoTon: number,
  nArboles: number,
): number | null {
  const emitido =
    Math.max(0, nArboles) * IMPACTO_COEFICIENTES.co2_emitido_ton_por_arbol;
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
  formulas: {
    co2_ton_plantacion: string;
    irr_simplificado: string;
    co2_frasco_500g: string;
  };
  fuentes: ImpactoFuente[];
  limites: ImpactoLimite[];
};

export const IMPACTO_FORMULAS = {
  co2_ton_plantacion: `co2_ton = cantidad_árboles × ${IMPACTO_COEFICIENTES.co2_ton_por_arbol}`,
  irr_simplificado: `IRR = co2_secuestrado_ton / (n_árboles × ${IMPACTO_COEFICIENTES.co2_emitido_ton_por_arbol})`,
  co2_frasco_500g: `co2_evitado_kg ≈ n_frascos × ${IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g}`,
} as const;

export function getMetodologiaPublica(): ImpactoMetodologiaPublica {
  return {
    version: IMPACTO_METODOLOGIA_VERSION,
    actualizado: IMPACTO_METODOLOGIA_ACTUALIZADO,
    territorio: IMPACTO_TERRITORIO,
    coeficientes: IMPACTO_COEFICIENTES,
    formulas: IMPACTO_FORMULAS,
    fuentes: IMPACTO_FUENTES,
    limites: IMPACTO_LIMITES,
  };
}

export type ImpactoOpenBook = {
  metodologia_version: string;
  arboles_plantados: number;
  co2_secuestrado_ton: number;
  irr_simplificado: number | null;
  zonas: number;
  especies: number;
  nota: string;
};

export function buildOpenBookFromArboles(
  rows: Array<{ cantidad?: number | null; co2_ton?: number | null; sector?: string | null; especie?: string | null }>,
): ImpactoOpenBook {
  const arboles = rows.reduce((s, r) => s + (Number(r.cantidad) || 0), 0);
  const co2 = rows.reduce((s, r) => s + (Number(r.co2_ton) || 0), 0);
  const zonas = new Set(rows.map((r) => r.sector).filter(Boolean)).size;
  const especies = new Set(rows.map((r) => r.especie).filter(Boolean)).size;
  return {
    metodologia_version: IMPACTO_METODOLOGIA_VERSION,
    arboles_plantados: arboles,
    co2_secuestrado_ton: parseFloat(co2.toFixed(2)),
    irr_simplificado: computeIrrSimplificado(co2, arboles),
    zonas,
    especies,
    nota: 'Agregado anónimo de plantaciones registradas. Sin GPS de predios ni datos personales.',
  };
}
