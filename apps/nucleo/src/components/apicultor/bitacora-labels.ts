import type { CuerpoCuadro, FaseBitacora, TipoCuadro, TipoOrigen } from '@/lib/bitacora-types';

/** Etiquetas de la bitácora apícola (docs/BITACORA_APICOLA.md §1). */
export const FASE_LABEL: Record<FaseBitacora, string> = {
  nucleo: 'Núcleo — estado basal',
  traspaso: 'Traspaso a cámara de cría',
  alza: 'Progresión de alzas',
  cosecha: 'Cosecha',
  invernada: 'Entrada a invernada',
  temporada: 'Nueva temporada',
};

export const ORIGEN_LABEL: Record<TipoOrigen, string> = {
  nucleo: 'Núcleo (propio o comprado)',
  division: 'División de colmena madre',
  enjambre: 'Enjambre capturado',
  compra: 'Compra',
  traspaso: 'Traspaso',
  otro: 'Otro',
};

export const CUERPO_LABEL: Record<CuerpoCuadro, string> = {
  nucleo: 'Núcleo',
  camara: 'Cámara de cría',
  alza_1: 'Alza 1',
  alza_2: 'Alza 2',
  alza_3: 'Alza 3',
};

export const TIPO_CUADRO_LABEL: Record<TipoCuadro, string> = {
  cria_abierta: 'Cría abierta',
  cria_cerrada: 'Cría cerrada',
  miel: 'Miel',
  cera_labrada: 'Cera labrada',
  cera_estampada: 'Cera estampada',
  vacio: 'Vacío',
  polen: 'Polen',
};
