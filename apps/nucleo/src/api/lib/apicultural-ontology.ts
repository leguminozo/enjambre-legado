// Ontología semántica apícola profunda para interpretación de terreno.
// Modela conceptos biológicos, dinámicas de colonia y reglas de inferencia.

import type { CuerpoCuadro, FaseBitacora, TipoCuadro } from '@/lib/bitacora-types';

export type EstadoReinaExtendido =
  | 'RV' // Reina Vista
  | 'NV' // Reina No Vista
  | 'SR' // Sin Reina / Huérfana
  | 'CI'; // Confirmada Implícita (huevos / postura fresca de 1-3 días presente)

export type TipoRealera = 'emergencia' | 'enjambrazon' | 'copacelda' | 'general';

export type TemperamentoColmena = 'Mansa' | 'Defensiva' | 'Agresiva';

export type NivelPoblacion = 'Baja' | 'Media' | 'Alta';

export interface CuadroOntologia {
  cuerpo: CuerpoCuadro;
  tipo: TipoCuadro;
  posicion?: number;
  notas?: string;
}

export interface InspeccionOntologica {
  colmenaIdentificador?: string;
  fase?: FaseBitacora;
  reina: {
    estado?: EstadoReinaExtendido;
    vista: boolean;
    presente: boolean; // true si se vio o si hay postura fresca
    posturaFrescaPresente?: boolean;
    realerasDetectadas?: {
      cantidad: number;
      tipo: TipoRealera;
    };
    zanganera?: boolean;
  };
  poblacion: {
    nivel?: NivelPoblacion;
    callesAbejas?: number;
    temperamento?: TemperamentoColmena;
  };
  cuadrosTotales: {
    marcosCriaTotal: number;
    marcosCriaAbierta: number;
    marcosCriaCerrada: number;
    marcosMiel: number;
    marcosNectar: number;
    marcosPolen: number;
    marcosCeraEstampada: number;
    marcosCeraLabrada: number;
    marcosVacios: number;
  };
  desgloseCuadros: CuadroOntologia[];
  sanidad: {
    varroaDetectada?: string;
    varroaNivelEstimado?: number; // 0 a 10
    sintomas?: string[];
    tratamientoMencionado?: string;
    alertaSanitaria: boolean;
  };
  invariantesFisicos: {
    totalMarcosCamara: number;
    excedeCapacidadCamara: boolean; // > 10 en Langstroth estándar
    alzasDetectadas: number;
  };
  accionesSugeridas: string[];
  confianzaGeneral: number; // 0.0 a 1.0
  notas: string;
}
