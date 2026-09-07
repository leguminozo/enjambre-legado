/**
 * Módulo de Impacto Regenerativo Biocultural
 * 
 * Modela la física de transformación néctar-miel y la capacidad de carga
 * ecosistémica de Apis mellifera en los bosques templados lluviosos de Chiloé.
 */

export interface RegenerativeMetrics {
  gramos: number;
  /** Superficie de bosque templado maduro en pie custodiado (m²) */
  bosqueCustodiadoM2: number;
  /** Cantidad de flores nativas de dosel/subdosel fecundadas */
  floresFecundadas: number;
  /** Distancia acumulada de vuelos de pecoreo (km) */
  distanciaVueloKm: number;
  /** Número de vuelos de pecoreo requeridos */
  vuelosPecoreo: number;
  /** Semillas viables adicionales aportadas al banco de suelo */
  semillasViables: number;
  /** Fracción de copa de árbol centenario emergente (Ulmo) impactada */
  fraccionDoselCentenario: number;
  /** Equivalente en árboles completos de subdosel/estrato medio */
  arbolesSubdoselEquivalentes: number;
  /** Stock de carbono biológico protegido en pie (kg CO2e) */
  co2StockResguardadoKg: number;
  /** Fijación neta anual de carbono en la superficie custodiada (kg CO2e) */
  co2FijacionAnualKg: number;
}

export interface RegenerativeParameters {
  /** Rendimiento anual neto de recolección sustentable por colmena en kg (default: 20) */
  rendimientoSostenibleKg?: number;
  /** Superficie vital de bosque asignada por colmena en m² (default: 5.000 m² = 0.5 ha) */
  areaVitalColmenaM2?: number;
  /** Concentración media de azúcares en néctar nativo (default: 0.30) */
  concentracionNectar?: number;
  /** Fracción de azúcares en miel madura (default: 0.82) */
  azucaresMiel?: number;
  /** Volumen promedio de néctar secretado por flor individual en mg (default: 1.2) */
  nectarPorFlorMg?: number;
  /** Capacidad de carga del buche melario en mg (default: 40) */
  cargaBucheMg?: number;
  /** Radio promedio de forrajeo en km (default: 1.2) */
  radioForrajeoKm?: number;
}

/**
 * Calcula las métricas biofísicas y territoriales de regeneración para una masa de miel dada en gramos.
 * 
 * @param gramos Masa de miel en gramos (ej. 15 para un sachet)
 * @param params Parámetros biofísicos y territoriales opcionales
 */
export function calculateRegenerativeImpact(
  gramos: number,
  params: RegenerativeParameters = {}
): RegenerativeMetrics {
  const g = Math.max(0, gramos);
  const kg = g / 1000;

  const R_sost = params.rendimientoSostenibleKg ?? 20;
  const A_vital = params.areaVitalColmenaM2 ?? 5000;
  const C_n = params.concentracionNectar ?? 0.30;
  const S_m = params.azucaresMiel ?? 0.82;
  const v_flor_mg = params.nectarPorFlorMg ?? 1.2;
  const q_buche_mg = params.cargaBucheMg ?? 40;
  const r_forrajeo = params.radioForrajeoKm ?? 1.2;

  // 1. Masa de néctar fresco requerida (kg)
  const masaNectarKg = kg * (S_m / C_n);

  // 2. Superficie de bosque maduro custodiado (m²)
  const bosqueCustodiadoM2 = Number(((kg / R_sost) * A_vital).toFixed(2));

  // 3. Número de flores nativas fecundadas
  const nectarPorFlorKg = v_flor_mg / 1_000_000;
  const floresFecundadas = Math.round(masaNectarKg / nectarPorFlorKg);

  // 4. Vuelos de pecoreo y distancia aérea
  const cargaBucheKg = q_buche_mg / 1_000_000;
  const vuelosPecoreo = Math.round(masaNectarKg / cargaBucheKg);
  const distanciaVueloKm = Math.round(vuelosPecoreo * (2 * r_forrajeo));

  // 5. Semillas viables (tasa alogamia +40%, 1 semilla/flor)
  const semillasViables = Math.round(floresFecundadas * 0.40);

  // 6. Equivalencia de dosel
  // Ulmo centenario maduro: ~100.000 flores/temporada
  const fraccionDoselCentenario = Number((floresFecundadas / 100_000).toFixed(2));
  // Árbol subdosel (Tiaca/Arrayán/Canelo): ~15.000 flores/árbol
  const arbolesSubdoselEquivalentes = Number((floresFecundadas / 15_000).toFixed(1));

  // 7. Carbono
  // Stock protegido: ~40 kg CO2e / m²
  const co2StockResguardadoKg = Number((bosqueCustodiadoM2 * 40).toFixed(1));
  // Fijación anual neta: ~0.06 kg CO2e / m² / año
  const co2FijacionAnualKg = Number((bosqueCustodiadoM2 * 0.06).toFixed(3));

  return {
    gramos: g,
    bosqueCustodiadoM2,
    floresFecundadas,
    distanciaVueloKm,
    vuelosPecoreo,
    semillasViables,
    fraccionDoselCentenario,
    arbolesSubdoselEquivalentes,
    co2StockResguardadoKg,
    co2FijacionAnualKg,
  };
}
