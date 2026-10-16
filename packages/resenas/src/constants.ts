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

export const CATEGORIAS_SENSORIALES = [
  'miel',
  'miel_fortificada',
  'hidromiel',
  'extracto',
  'cosmetica',
  'infusion',
] as const;
export type TipoSensorial = (typeof CATEGORIAS_SENSORIALES)[number];
export type CategoriaSensorial = TipoSensorial;

export const CATEGORIAS_SENSORIALES_LABELS: Record<TipoSensorial, string> = {
  miel: 'Miel Pura de Origen',
  miel_fortificada: 'Crema de Miel Fortificada',
  hidromiel: 'Hidromiel & Fermentados',
  extracto: 'Extractos & Tónicos Apícolas',
  cosmetica: 'Cosmética Botánica & Ceras',
  infusion: 'Infusiones del Bosque Nativo',
};

export const FORTIFICANTES_CANONICOS = [
  'polen_floral',
  'avellana_chilena',
  'cacao_crudo',
  'panal_virgen',
  'ninguno',
] as const;
export type FortificanteCanonico = (typeof FORTIFICANTES_CANONICOS)[number];

export const FORTIFICANTES_LABELS: Record<FortificanteCanonico, string> = {
  polen_floral: 'Polen Floral',
  avellana_chilena: 'Avellana Chilena Tostada y Molida',
  cacao_crudo: 'Nibs de Cacao Crudo (Santander, Colombia)',
  panal_virgen: 'Miel Virgen con Trocito de Panal',
  ninguno: 'Sin fortificación (Pura)',
};

export const HIDROMIEL_ESTILOS = [
  'seco',
  'semiseco',
  'dulce',
  'metheglin',
  'melomel',
] as const;
export type HidromielEstilo = (typeof HIDROMIEL_ESTILOS)[number];

export const HIDROMIEL_EFERVESCENCIA = [
  'tranquila',
  'petillant',
  'espumosa',
] as const;
export type HidromielEfervescencia = (typeof HIDROMIEL_EFERVESCENCIA)[number];

export const FORTIFICADA_TEXTURAS = [
  'sedosa_homogenea',
  'granulado_fino',
  'nibs_crujientes',
  'tostado_marcado',
] as const;
export type FortificadaTextura = (typeof FORTIFICADA_TEXTURAS)[number];

export const EXTRACTO_SENSACIONES = [
  'calida',
  'balsamica',
  'astringente_fuerte',
] as const;
export type ExtractoSensacion = (typeof EXTRACTO_SENSACIONES)[number];

export const COSMETICA_ABSORCIONES = [
  'inmediata',
  'sedosa_nutritiva',
  'oclusiva_protectora',
] as const;
export type CosmeticaAbsorcion = (typeof COSMETICA_ABSORCIONES)[number];

export const PARES_SEMANTICOS_POR_CATEGORIA: Record<
  TipoSensorial,
  Array<{ par: string; izq: string; der: string }>
> = {
  miel: [
    { par: 'suave/intenso', izq: 'Suave', der: 'Intenso' },
    { par: 'dulce/acido', izq: 'Dulce', der: 'Ácido' },
    { par: 'liquida/cremosa', izq: 'Líquida', der: 'Cremosa' },
  ],
  miel_fortificada: [
    { par: 'suave/intenso', izq: 'Suave', der: 'Intenso' },
    { par: 'dulce/contraste', izq: 'Dulzor Miel', der: 'Contraste Tostado' },
    { par: 'sedosa/crujiente', izq: 'Sedosa Homogénea', der: 'Inclusión Crujiente' },
  ],
  hidromiel: [
    { par: 'seco/dulce', izq: 'Seco', der: 'Dulce' },
    { par: 'tranquilo/espumoso', izq: 'Tranquilo', der: 'Espumoso' },
    { par: 'tanico/ligero', izq: 'Ligero & Floral', der: 'Estructurado & Tánico' },
  ],
  extracto: [
    { par: 'astringente/suave', izq: 'Astringente', der: 'Balsámico Suave' },
    { par: 'pungente/calmo', izq: 'Pungente Intenso', der: 'Resinoso Calmo' },
  ],
  cosmetica: [
    { par: 'ligera/untuosa', izq: 'Rápida Absorción', der: 'Película Nutritiva' },
    { par: 'mate/luminoso', izq: 'Acabado Sedoso', der: 'Brillo Hidratante' },
  ],
  infusion: [
    { par: 'floral/terroso', izq: 'Floral Fresco', der: 'Corteza & Raíz' },
    { par: 'delicada/robusta', izq: 'Infusión Diáfana', der: 'Cuerpo Profundo' },
  ],
};

export const PARES_SEMANTICOS = PARES_SEMANTICOS_POR_CATEGORIA.miel;