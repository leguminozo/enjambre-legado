// Domain types for núcleo ecosystem views (colmenas, productos, calendario, etc.)

export interface VarroaRecord { date: string; level: number; method: string; }
export interface PesoRecord { date: string; kg: number; note?: string; }
export interface ReinaRecord { generation: string; since: string; origin: string; status: 'activa' | 'inactiva' | 'ausente'; }
export interface InspeccionRecord {
  date: string; inspector: string; marcos_cria: number; marcos_miel: number;
  varroa: number; poblacion: 'alta' | 'media' | 'baja'; reina: boolean;
  enjambrazon_riesgo: 'bajo' | 'medio' | 'alto'; notes: string; foto?: string;
}
export interface CostoColmena {
  horas_anuales: number; costo_hora: number; amortizacion_cajon: number;
  insumos_anuales: number; produccion_kg: number;
}

export interface Colmena {
  id: string; name: string; location: string; lat: number; lng: number;
  health: 'optimal' | 'attention' | 'risk';
  queen: string; reinaHistory: ReinaRecord[];
  lastInspection: string; inspecciones: InspeccionRecord[];
  production: number;
  pesoHistory: PesoRecord[];
  varroaHistory: VarroaRecord[];
  floracion: string;
  treatments: string[];
  notes: string;
  costos: CostoColmena;
  blockchainHash: string;
  loteActivo: string;
  alzas: number;
  nucleosCandidatos: boolean;
}

export interface Product {
  id: string; name: string; description: string; price: number; format: string;
  impactTrees: number; emoji: string; stock: number; category: string;
  trazabilidad_qr?: boolean; slug?: string; video_url?: string; fotos?: string[];
  categoria?: string; visible?: boolean; descripcion_regenerativa?: string;
  precio?: number; formato?: string; origen_apicola?: string;
}

export interface CalendarioTask {
  id: string; week: number; month: string; category: 'inspeccion' | 'cosecha' | 'tratamiento' | 'reforestacion' | 'transhumancia' | 'cera';
  title: string; colmena?: string; priority: 'alta' | 'media' | 'baja';
  done: boolean; notes?: string;
}

export interface ArbolPlantado {
  id: string; especie: string; cantidad: number; fecha: string;
  sector: string; coordenadas: { lat: number; lng: number };
  co2_ton: number; lotesMiel: string[]; foto?: string; status: 'joven' | 'creciendo' | 'adulto';
}

export function healthFromEstado(estado: string | null | undefined): Colmena['health'] {
  if (estado === 'optima') return 'optimal';
  if (estado === 'atencion') return 'attention';
  return 'risk';
}

export function estadoFromHealth(health: Colmena['health']): string {
  if (health === 'optimal') return 'optima';
  if (health === 'attention') return 'atencion';
  return 'riesgo';
}

export function guardianLevel(totalSpent: number): string {
  if (totalSpent >= 200_000) return 'Guardián Platino';
  if (totalSpent >= 100_000) return 'Guardián Oro';
  if (totalSpent >= 50_000) return 'Guardián Plata';
  return 'Guardián Bronce';
}