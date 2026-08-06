/**
 * Hidromiel — instrumentos de cálculo puros.
 *
 * Todo es opcional y de uso libre: ninguna función se aplica automáticamente
 * al lote. Las constantes de estequiometría siguen la química real del CO₂:
 *   · 1 volumen CO₂ = 1.98 g de CO₂ disuelto por litro de bebida
 *   · 1 g de hexosa fermentada ≈ 0.4885 g de CO₂ (C6H12O6 → 2 C2H5OH + 2 CO₂)
 *   · la miel ≈ 82% de azúcares fermentables
 * Dosis de referencia: para 3 vol a 18 °C (residual ≈ 1.0 vol) se necesitan
 * ~9.9 g de miel por litro — NO los 40–50 g/L que circulan como "regla",
 * que corresponden a ~8–10 vol y son zona de botella bomba.
 */

export const EXTRACTO_MIEL = 0.82;
export const CO2_GRAMA_POR_VOLUMEN = 1.98;
export const CO2_GRAMA_POR_GRAMA_AZUCAR = 0.4885;
export const MAX_VOL_FLIP_TOP = 3.0;
export const MAX_VOL_CHAMPAGNE = 4.5;
export const MAX_VOL_SEGURO = 6.0;

/** Solo sugerencias de UI — nunca validaciones. El usuario escribe lo que quiera. */
export const ESTADOS_SUGERIDOS = [
  'fermentando',
  'embotellado',
  'carbonatando',
  'listo',
  'degustado',
  'descartada',
] as const;

export const TIPOS_MEDICION_SUGERIDOS = [
  'densidad',
  'temperatura',
  'presión',
  'pH',
  'Brix',
  'azúcar residual',
] as const;

export const UNIDADES_SUGERIDAS = ['kg', 'g', 'L', 'ml', '°C', 'bar', 'vol', 'pH'] as const;

export const INGREDIENTES_SUGERIDOS = ['Miel', 'Agua'] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function finito(value: number): boolean {
  return Number.isFinite(value);
}

/** Grados de alcohol por volumen (ABV %) a partir de gravedad inicial/final. */
export function calcularABV(densidadInicial: number, densidadFinal: number): number | null {
  if (!finito(densidadInicial) || !finito(densidadFinal)) return null;
  if (densidadInicial < 0.98 || densidadInicial > 1.2) return null;
  if (densidadFinal < 0.98 || densidadFinal > 1.2) return null;
  if (densidadFinal > densidadInicial) return null;
  return round2((densidadInicial - densidadFinal) * 131.25);
}

/** Tabla de CO₂ residual (volúmenes) a presión atmosférica según temperatura
 * de embotellado (aproximación Zahm, valores estándar de cervecería). */
const CO2_RESIDUAL_TABLA: ReadonlyArray<readonly [tempC: number, vol: number]> = [
  [4, 1.7],
  [7, 1.55],
  [10, 1.4],
  [13, 1.25],
  [16, 1.1],
  [18, 1.0],
  [20, 0.9],
  [22, 0.82],
  [25, 0.75],
];

/** CO₂ ya disuelto en un mosto totalmente fermentado a la temperatura dada. */
export function calcularCO2Residual(tempC: number): number | null {
  if (!finito(tempC)) return null;
  const t = Math.min(CO2_RESIDUAL_TABLA[CO2_RESIDUAL_TABLA.length - 1][0], Math.max(CO2_RESIDUAL_TABLA[0][0], tempC));
  for (let i = 0; i < CO2_RESIDUAL_TABLA.length - 1; i++) {
    const [t0, v0] = CO2_RESIDUAL_TABLA[i];
    const [t1, v1] = CO2_RESIDUAL_TABLA[i + 1];
    if (t >= t0 && t <= t1) {
      return round2(v0 + ((t - t0) / (t1 - t0)) * (v1 - v0));
    }
  }
  return CO2_RESIDUAL_TABLA[CO2_RESIDUAL_TABLA.length - 1][1];
}

export type ZonaSeguridad = 'flip-top' | 'champagne' | 'peligro';

export interface ResultadoPriming {
  gramosMiel: number;
  gramosPorLitro: number;
  co2ResidualVol: number;
  co2NuevoVol: number;
  zona: ZonaSeguridad;
}

export interface PrimingInput {
  volumenL: number;
  co2TargetVol: number;
  tempC: number;
  /** Fracción de azúcares fermentables de la miel (default 0.82). */
  fermentabilidadMiel?: number;
}

/** Gramos de miel de adición para alcanzar la carbonatación deseada. */
export function calcularPrimingMiel(input: PrimingInput): ResultadoPriming | null {
  const { volumenL, co2TargetVol, tempC } = input;
  const fermentabilidad = input.fermentabilidadMiel ?? EXTRACTO_MIEL;
  if (!finito(volumenL) || !finito(co2TargetVol) || !finito(tempC) || !finito(fermentabilidad)) {
    return null;
  }
  if (volumenL <= 0 || co2TargetVol <= 0 || co2TargetVol > MAX_VOL_SEGURO) return null;
  if (fermentabilidad <= 0 || fermentabilidad > 1) return null;

  const co2ResidualVol = calcularCO2Residual(tempC);
  if (co2ResidualVol === null) return null;

  const co2NuevoVol = Math.max(0, co2TargetVol - co2ResidualVol);
  const gramosPorLitro = (co2NuevoVol * CO2_GRAMA_POR_VOLUMEN) / (CO2_GRAMA_POR_GRAMA_AZUCAR * fermentabilidad);
  const zona: ZonaSeguridad =
    co2TargetVol <= MAX_VOL_FLIP_TOP ? 'flip-top' : co2TargetVol <= MAX_VOL_CHAMPAGNE ? 'champagne' : 'peligro';

  return {
    gramosMiel: round2(gramosPorLitro * volumenL),
    gramosPorLitro: round2(gramosPorLitro),
    co2ResidualVol,
    co2NuevoVol: round2(co2NuevoVol),
    zona,
  };
}

/** Gravedad inicial estimada (SG) para miel + agua, antes de medir. */
export function calcularOGEstimada(mielKg: number, volumenL: number): number | null {
  if (!finito(mielKg) || !finito(volumenL)) return null;
  if (mielKg <= 0 || volumenL <= 0) return null;
  const azucarKg = mielKg * EXTRACTO_MIEL;
  const pesoTotal = azucarKg + volumenL; // 1 L de agua ≈ 1 kg
  if (pesoTotal <= 0) return null;
  const plato = (azucarKg / pesoTotal) * 100;
  // Conversión °P → SG (fórmula ASBC)
  const sg = 1 + plato / (258.6 - (plato / 258.2) * 227.1);
  return Math.round(sg * 10000) / 10000;
}

export interface CostoBotellaInput {
  mielKg: number;
  costoMielKg: number;
  costoEnvases: number;
  nBotellas: number;
}

/** Costo unitario por botella en CLP (insumos + envases / botellas). */
export function calcularCostoPorBotella(input: CostoBotellaInput): number | null {
  const { mielKg, costoMielKg, costoEnvases, nBotellas } = input;
  if (!finito(mielKg) || !finito(costoMielKg) || !finito(costoEnvases) || !finito(nBotellas)) {
    return null;
  }
  if (mielKg < 0 || costoMielKg < 0 || costoEnvases < 0 || nBotellas <= 0) return null;
  return Math.round((mielKg * costoMielKg + costoEnvases) / nBotellas);
}

export interface IngredienteParaMiel {
  nombre: string;
  cantidad: number | null;
  unidad: string | null;
}

/** Miel total (kg) derivada de la receta: suma conservadora de ingredientes que
 * mencionan "miel" y se expresan en kg (o sin unidad). Devuelve null sin evidencia. */
export function mielKgDesdeIngredientes(ingredientes: IngredienteParaMiel[]): number | null {
  let total = 0;
  let encontrado = false;
  for (const i of ingredientes) {
    if (i.cantidad == null) continue;
    if (!i.nombre.toLowerCase().includes('miel')) continue;
    const unidad = (i.unidad ?? '').trim().toLowerCase();
    if (unidad !== '' && unidad !== 'kg' && unidad !== 'k') continue;
    total += i.cantidad;
    encontrado = true;
  }
  return encontrado ? Math.round(total * 1000) / 1000 : null;
}
