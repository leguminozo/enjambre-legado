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

export const CATEGORIAS_SENSORIALES = [
  'miel',
  'miel_fortificada',
  'fortificaciones',
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
  fortificaciones: 'Fortificaciones & Materias Primas Puras',
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
  fortificaciones: [
    { par: 'suave/intenso', izq: 'Sutil & Crudo', der: 'Intenso & Tostado' },
    { par: 'molienda', izq: 'Molienda Fina / Sedosa', der: 'Granulado / Rústico' },
    { par: 'untuosidad', izq: 'Seco & Harinoso', der: 'Untuoso & Oleoso' },
  ],
  hidromiel: [
    { par: 'seco/dulce', izq: 'Seco', der: 'Dulce' },
    { par: 'tranquilo/espumoso', izq: 'Tranquilo', der: 'Espumoso' },
    { par: 'tanico/ligero', izq: 'Ligero & Floral', der: 'Estructurado & Tánico' },
  ],
  extracto: [
    { par: 'astringente/suave', izq: 'Astringente', der: 'Balsámico Suave' },
    { par: 'pungente/calmo', izq: 'Pungente Intenso', der: 'Resinoso Calmo' },
    { par: 'fluido/denso', izq: 'Líquido Tintura', der: 'Resina Densa' },
  ],
  cosmetica: [
    { par: 'ligera/untuosa', izq: 'Rápida Absorción', der: 'Película Nutritiva' },
    { par: 'mate/luminoso', izq: 'Acabado Sedoso', der: 'Brillo Hidratante' },
    { par: 'oclusiva/ligera', izq: 'Fluido Ligero', der: 'Cera Protectora' },
  ],
  infusion: [
    { par: 'floral/terroso', izq: 'Floral Fresco', der: 'Corteza & Raíz' },
    { par: 'delicada/robusta', izq: 'Infusión Diáfana', der: 'Cuerpo Profundo' },
    { par: 'astringente/sedosa', izq: 'Límpida & Ágil', der: 'Textura Sedosa' },
  ],
};

export const PARES_SEMANTICOS = PARES_SEMANTICOS_POR_CATEGORIA.miel;

// ── 8 Ejes Canónicos de la Constelación Sensorial de Cata por Categoría ─────────

export const EJES_SENSORIALES_POR_CATEGORIA: Record<
  TipoSensorial,
  readonly [string, string, string, string, string, string, string, string]
> = {
  miel: [
    'Madurez Enzimática',
    'Complejidad Botánica',
    'Dulzor Natural',
    'Textura & Cristal',
    'Tensión Ácida',
    'Densidad Mineral',
    'Persistencia Floral',
    'Vector Territorial',
  ],
  miel_fortificada: [
    'Aporte Nutritivo',
    'Complejidad Botánica',
    'Dulzor Miel',
    'Textura Inclusión',
    'Contraste Tostado',
    'Densidad Activa',
    'Sinergia Funcional',
    'Vector Territorial',
  ],
  fortificaciones: [
    'Tostado & Calidez',
    'Untuosidad & Grasa Noble',
    'Granulometría & Molienda',
    'Densidad Nutritiva',
    'Amargor Noble / Tanino',
    'Crocancia & Textura',
    'Persistencia en Boca',
    'Vector Territorial',
  ],
  hidromiel: [
    'Efervescencia',
    'Complejidad Fermentativa',
    'Balance Seco/Dulce',
    'Estructura Tánica',
    'Acidez Viva',
    'Carácter Melífero',
    'Alcohol Integrado',
    'Vector Territorial',
  ],
  extracto: [
    'Concentración Activa',
    'Pungencia Noble',
    'Balsámico Suave',
    'Densidad Resinosa',
    'Potencia Bioactiva',
    'Persistencia en Boca',
    'Pureza de Origen',
    'Vector Territorial',
  ],
  cosmetica: [
    'Pureza Botánica',
    'Absorción Dérmica',
    'Poder Emoliente',
    'Aroma Noble',
    'Barrera Protectora',
    'Sedosidad',
    'Calma Cutánea',
    'Vector Territorial',
  ],
  infusion: [
    'Frescor Volátil',
    'Complejidad Herbal',
    'Claridad de Taza',
    'Cuerpo & Astringencia',
    'Notas Florales',
    'Tensión Cítrica',
    'Calidez / Retrogusto',
    'Vector Territorial',
  ],
};

export const EJES_SENSORIALES_CERA: readonly [string, string, string, string, string, string, string, string] = [
  'Nutrición de Fibra',
  'Hidrorrepelencia',
  'Tiempo de Absorción',
  'Brillo Satinado',
  'Aroma a Panal',
  'Elasticidad de Capa',
  'Barrera Protectora',
  'Vector Territorial',
];

export const EJES_SENSORIALES_HIDROLATO: readonly [string, string, string, string, string, string, string, string] = [
  'Pureza de Destilación',
  'Volatilidad Aromática',
  'Frescor en Piel',
  'Calma Cutánea',
  'Notas de Bosque',
  'Penetración Dérmica',
  'Claridad Botánica',
  'Vector Territorial',
];

export const VALORES_DEFAULT_EJES: Record<string, number> = {
  // Miel
  'Madurez Enzimática': 85,
  'Complejidad Botánica': 80,
  'Dulzor Natural': 70,
  'Textura & Cristal': 85,
  'Tensión Ácida': 45,
  'Densidad Mineral': 80,
  'Persistencia Floral': 75,
  'Vector Territorial': 90,

  // Infusión
  'Frescor Volátil': 85,
  'Complejidad Herbal': 75,
  'Claridad de Taza': 80,
  'Cuerpo & Astringencia': 60,
  'Notas Florales': 70,
  'Tensión Cítrica': 50,
  'Calidez / Retrogusto': 70,

  // Hidromiel
  'Efervescencia': 65,
  'Complejidad Fermentativa': 80,
  'Balance Seco/Dulce': 60,
  'Estructura Tánica': 70,
  'Acidez Viva': 75,
  'Carácter Melífero': 85,
  'Alcohol Integrado': 70,

  // Extracto
  'Concentración Activa': 90,
  'Pungencia Noble': 75,
  'Balsámico Suave': 80,
  'Densidad Resinosa': 85,
  'Potencia Bioactiva': 90,
  'Persistencia en Boca': 85,
  'Pureza de Origen': 95,

  // Cosmética
  'Pureza Botánica': 90,
  'Absorción Dérmica': 75,
  'Poder Emoliente': 85,
  'Aroma Noble': 80,
  'Barrera Protectora': 85,
  'Sedosidad': 80,
  'Calma Cutánea': 85,

  // Fortificaciones & Materias Primas Puras (Avellana chilena, polen puro, cacao, etc.)
  'Tostado & Calidez': 85,
  'Untuosidad & Grasa Noble': 80,
  'Granulometría & Molienda': 75,
  'Densidad Nutritiva': 90,
  'Amargor Noble / Tanino': 40,
  'Crocancia & Textura': 70,

  // Cera
  'Nutrición de Fibra': 90,
  'Hidrorrepelencia': 95,
  'Tiempo de Absorción': 70,
  'Brillo Satinado': 85,
  'Aroma a Panal': 90,
  'Elasticidad de Capa': 80,

  // Hidrolato
  'Pureza de Destilación': 95,
  'Volatilidad Aromática': 85,
  'Frescor en Piel': 90,
  'Penetración Dérmica': 85,
  'Claridad Botánica': 90,
};

/**
 * Resuelve los 8 ejes del radar adaptados a la familia y naturaleza del producto.
 */
export function resolverEjesSensoriales(
  tipo?: string | null,
  nombreProducto?: string | null,
): readonly [string, string, string, string, string, string, string, string] {
  const normTipo = (tipo || '').toLowerCase().trim();
  const normNom = (nombreProducto || '').toLowerCase().trim();

  if (normTipo.includes('cera') || normNom.includes('cera') || normNom.includes('linaza')) {
    return EJES_SENSORIALES_CERA;
  }
  if (normTipo.includes('hidrolato') || normNom.includes('hidrolato')) {
    return EJES_SENSORIALES_HIDROLATO;
  }
  if (normTipo.includes('infusion') || normNom.includes('infusión') || normNom.includes('infusion')) {
    return EJES_SENSORIALES_POR_CATEGORIA.infusion;
  }
  if (normTipo.includes('hidromiel')) {
    return EJES_SENSORIALES_POR_CATEGORIA.hidromiel;
  }
  if (normTipo.includes('extracto') || normTipo.includes('tintura') || normNom.includes('propoleo') || normNom.includes('propóleo')) {
    return EJES_SENSORIALES_POR_CATEGORIA.extracto;
  }
  if (normTipo.includes('cosmetica') || normTipo.includes('cosmética') || normNom.includes('balsamo') || normNom.includes('bálsamo')) {
    return EJES_SENSORIALES_POR_CATEGORIA.cosmetica;
  }
  if (
    normTipo === 'fortificaciones' ||
    normTipo.includes('fortificaci') ||
    normNom.includes('avellana') ||
    normNom.includes('polen') ||
    normNom.includes('cacao') ||
    normNom.includes('semilla') ||
    normNom.includes('fruto')
  ) {
    if (normTipo === 'miel_fortificada' || (normNom.includes('miel') && normTipo.includes('fortificada'))) {
      return EJES_SENSORIALES_POR_CATEGORIA.miel_fortificada;
    }
    return EJES_SENSORIALES_POR_CATEGORIA.fortificaciones;
  }
  if (normTipo.includes('fortificada')) {
    return EJES_SENSORIALES_POR_CATEGORIA.miel_fortificada;
  }
  return EJES_SENSORIALES_POR_CATEGORIA.miel;
}

export interface PresetSensorial {
  id: string;
  label: string;
  description: string;
  ejes: readonly [string, string, string, string, string, string, string, string];
  pares_semanticos: Array<{ par: string; izq: string; der: string }>;
}

export const PRESETS_FAMILIAS_SENSORIALES: PresetSensorial[] = [
  {
    id: 'miel',
    label: 'Miel Cruda de Origen',
    description: 'Monoflorales y multiflorales del bosque nativo chilote',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.miel,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.miel,
  },
  {
    id: 'fortificaciones',
    label: 'Fortificaciones & Materias Primas Puras',
    description: 'Avellana chilena tostada y molida, polen floral puro, nibs de cacao criollo',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.fortificaciones,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.fortificaciones,
  },
  {
    id: 'miel_fortificada',
    label: 'Crema de Miel Fortificada',
    description: 'Emulsiones untables de miel con adición de superalimentos',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.miel_fortificada,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.miel_fortificada,
  },
  {
    id: 'hidromiel',
    label: 'Hidromiel & Fermentados',
    description: 'Fermentaciones salvajes, metheglin, melomel',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.hidromiel,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.hidromiel,
  },
  {
    id: 'extracto',
    label: 'Extractos & Tinturas',
    description: 'Propóleo concentrado, elixires y tónicos bioactivos',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.extracto,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.extracto,
  },
  {
    id: 'cosmetica',
    label: 'Cosmética Botánica & Ceras',
    description: 'Bálsamos labiales, ceras nobles, hidrolatos y cremas',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.cosmetica,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.cosmetica,
  },
  {
    id: 'infusion',
    label: 'Infusiones del Bosque Nativo',
    description: 'Hojas, flores y cortezas medicinales de Chiloé',
    ejes: EJES_SENSORIALES_POR_CATEGORIA.infusion,
    pares_semanticos: PARES_SEMANTICOS_POR_CATEGORIA.infusion,
  },
];
