export const RESENA_MODOS = ['anonima', 'guardian', 'floracion'] as const;
export type ResenaModo = (typeof RESENA_MODOS)[number];

export const RESENA_ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'oculta'] as const;
export type ResenaEstado = (typeof RESENA_ESTADOS)[number];

export const ANON_COMMENT_MAX = 280;
export const GUARDIAN_COOLDOWN_DAYS = 30;
export const ANON_RATE_LIMIT_PER_DAY = 3;
export const CLAIM_TOKEN_TTL_DAYS = 7;
export const CICLOS_GUARDIAN_APROBADA = 5;
export const CICLOS_FLORACION_APROBADA = 3;

export const FAMILIAS_AROMATICAS = [
  'Floral',
  'Bosque',
  'Especiada',
  'Frutal',
  'Herbácea',
  'Ahumada',
  'Cremosa',
] as const;

export const CRISTALIZACION_OPCIONES = [
  'Líquida',
  'Cremosa',
  'Cristalizada',
  'Granulada',
] as const;

export const MOMENTO_RECOLECCION_OPCIONES = [
  'primera_extraccion',
  'segunda_extraccion',
  'tardio',
] as const;
export type MomentoRecoleccion = (typeof MOMENTO_RECOLECCION_OPCIONES)[number];

/** Etiqueta legible para el momento de recolección, para uso en UI. */
export const MOMENTO_RECOLECCION_LABELS: Record<MomentoRecoleccion, string> = {
  primera_extraccion: 'Primera extracción',
  segunda_extraccion: 'Segunda extracción',
  tardio: 'Recolección tardía',
};

export const PERFIL_CATA_MIN_SESIONES = 30;