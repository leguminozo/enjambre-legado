export const RESENA_MODOS = ['anonima', 'guardian'] as const;
export type ResenaModo = (typeof RESENA_MODOS)[number];

export const RESENA_ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'oculta'] as const;
export type ResenaEstado = (typeof RESENA_ESTADOS)[number];

export const ANON_COMMENT_MAX = 280;
export const GUARDIAN_COOLDOWN_DAYS = 30;
export const ANON_RATE_LIMIT_PER_DAY = 3;
export const CLAIM_TOKEN_TTL_DAYS = 7;
export const CICLOS_GUARDIAN_APROBADA = 5;

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