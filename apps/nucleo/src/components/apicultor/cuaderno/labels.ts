// Etiquetas y categorías de la red semántica del cuaderno de campo
// para el dominio apícola con los tokens de Enjambre (sin hex).

import type { NodoRedCuaderno, BrechaColmena } from '@/lib/bitacora-types';
import { FASE_LABEL } from '../bitacora-labels';

export const NODO_KIND_LABEL: Record<NodoRedCuaderno['kind'], string> = {
  apiario: 'Apiario',
  colmena: 'Colmena',
  hoja: 'Hoja de cuaderno',
  cuadro: 'Cuadro',
  tratamiento: 'Tratamiento',
  muestra: 'Muestra',
  varroa: 'Monitoreo varroa',
  manual: 'Nodo manual',
};

/** Color de borde (token) por categoría de nodo. */
export const NODO_KIND_TOKEN: Record<NodoRedCuaderno['kind'], string> = {
  apiario: 'primary',
  colmena: 'success',
  hoja: 'primary',
  cuadro: 'muted',
  tratamiento: 'warning',
  muestra: 'primary',
  varroa: 'warning',
  manual: 'foreground',
};

export const RELACION_LABEL: Record<string, string> = {
  contiene: 'contiene',
  registra: 'registra',
  trata: 'tratado con',
  muestrea: 'muestreado por',
  monitorea: 'monitoreo',
  deriva_de: 'deriva de',
  observa: 'observa',
  tension: 'tensión',
  analogia: 'analogía',
  otro: 'otro',
};

/** Token de color por tipo de relación (aristas derivadas + manuales). */
export const RELACION_TOKEN: Record<string, string> = {
  contiene: 'muted',
  registra: 'primary',
  trata: 'warning',
  muestrea: 'primary',
  monitorea: 'warning',
  deriva_de: 'success',
  observa: 'muted',
  tension: 'destructive',
  analogia: 'primary',
  otro: 'muted',
};

export const ESTADO_COLMENA_LABEL: Record<string, string> = {
  optima: 'Óptima',
  atencion: 'Atención',
  riesgo: 'Riesgo',
  optimal: 'Óptima',
  attention: 'Atención',
  risk: 'Riesgo',
};

export const ESTADO_COLMENA_TOKEN: Record<string, string> = {
  optima: 'success',
  atencion: 'warning',
  riesgo: 'destructive',
  optimal: 'success',
  attention: 'warning',
  risk: 'destructive',
};

export const BRECHA_HOJA_LABEL: Record<string, string> = {
  sin_varroa: 'Sin dato varroa',
  sin_cuadros: 'Sin cuadros',
  sin_notas: 'Sin notas',
  retiro_vigente: 'Retiro vigente',
};

export const BRECHA_LABEL: Record<BrechaColmena['tipo'], { label: string }> = {
  sin_hoja_14d: { label: 'Sin hoja >14 días' },
  sin_varroa_30d: { label: 'Sin monitoreo varroa >30 días' },
  retiro_vigente: { label: 'Retiro vigente' },
};

export interface HojaPlantilla {
  id: string;
  label: string;
  fase: string;
  poblacion: string;
  notas: string;
}

/** Plantillas de "Nueva hoja" — cada registro del cuaderno nace de una plantilla canónica. */
export const HOJA_PLANTILLAS: HojaPlantilla[] = [
  { id: 'visita', label: 'Visita rutinaria', fase: 'temporada', poblacion: 'Media', notas: 'Inspección general: estado de cría, reservas y sanidad.' },
  { id: 'monitoreo', label: 'Monitoreo varroa', fase: 'temporada', poblacion: 'Media', notas: 'Monitoreo de Varroa destructor: método y nivel registrado.' },
  { id: 'alzas', label: 'Progresión de alzas', fase: 'alza', poblacion: 'Alta', notas: 'Evaluación de refuerzo con alzas.' },
  { id: 'cosecha', label: 'Recolección', fase: 'cosecha', poblacion: 'Alta', notas: 'Registro de recolección y reservas.' },
  { id: 'traspaso', label: 'Traspaso', fase: 'traspaso', poblacion: 'Media', notas: 'Traspaso de núcleo a cámara de cría.' },
  { id: 'invernada', label: 'Invernada', fase: 'invernada', poblacion: 'Baja', notas: 'Preparación para invernada: reservas y reducción.' },
];

export function faseLabel(fase: string | null | undefined): string {
  if (!fase) return 'Sin fase';
  return FASE_LABEL[fase as keyof typeof FASE_LABEL] ?? fase;
}

/** Nivel de varroa → token de color (mismo semáforo que el panel legacy). */
export function varroaToken(level: number | null | undefined): string {
  const v = level ?? 0;
  if (v <= 1.5) return 'success';
  if (v <= 3) return 'warning';
  return 'destructive';
}
