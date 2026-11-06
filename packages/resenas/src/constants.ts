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
    'Intensidad de Sabor',
    'Aroma a Bosque',
    'Dulzor Natural',
    'Textura & Cremosidad',
    'Toque Cítrico & Frescor',
    'Cuerpo & Densidad',
    'Duración en Boca',
    'Carácter Silvestre',
  ],
  miel_fortificada: [
    'Intensidad del Fruto/Semilla',
    'Aroma a Bosque',
    'Dulzor Equilibrado',
    'Cremosidad & Textura',
    'Toque Tostado o Crudo',
    'Cuerpo & Sustancia',
    'Armonía de Sabores',
    'Carácter Silvestre',
  ],
  fortificaciones: [
    'Tostado & Calidez',
    'Suavidad & Untuosidad',
    'Finura de la Molienda',
    'Cuerpo & Presencia',
    'Toque Amargo Noble',
    'Crocancia & Mordida',
    'Duración del Sabor',
    'Carácter de Origen',
  ],
  hidromiel: [
    'Burbuja & Chispa',
    'Carácter Fermentado',
    'Balance Seco/Dulce',
    'Cuerpo & Tanino',
    'Acidez Refrescante',
    'Aroma a Miel de Origen',
    'Suavidad del Alcohol',
    'Carácter de Origen',
  ],
  extracto: [
    'Concentración & Potencia',
    'Picoso & Calidez en Garganta',
    'Aroma Balsámico',
    'Cuerpo Resinoso',
    'Intensidad del Propóleo',
    'Duración en Boca',
    'Claridad & Limpieza',
    'Carácter de Origen',
  ],
  cosmetica: [
    'Pureza Botánica',
    'Absorción en Piel',
    'Nutrición & Suavidad',
    'Aroma a Cera & Miel',
    'Capa Protectora',
    'Tacto Sedoso',
    'Sensación de Alivio',
    'Carácter de Origen',
  ],
  infusion: [
    'Frescor Aromático',
    'Riqueza de Hierbas',
    'Claridad & Limpieza',
    'Cuerpo en Boca',
    'Notas Florales',
    'Toque Cítrico',
    'Calidez & Retrogusto',
    'Carácter Silvestre',
  ],
};

export const EJES_SENSORIALES_CERA: readonly [string, string, string, string, string, string, string, string] = [
  'Nutrición de Fibra',
  'Protección al Agua',
  'Tiempo de Absorción',
  'Brillo Satinado',
  'Aroma a Panal',
  'Elasticidad de Capa',
  'Capa Protectora',
  'Carácter de Origen',
];

export const EJES_SENSORIALES_HIDROLATO: readonly [string, string, string, string, string, string, string, string] = [
  'Pureza de Destilación',
  'Frescor Aromático',
  'Sensación en Piel',
  'Sensación de Alivio',
  'Notas de Bosque',
  'Absorción Rápida',
  'Claridad Botánica',
  'Carácter de Origen',
];

export const VALORES_DEFAULT_EJES: Record<string, number> = {
  // Miel (Nuevos Nombres Intuitivos)
  'Intensidad de Sabor': 85,
  'Aroma a Bosque': 80,
  'Dulzor Natural': 70,
  'Textura & Cremosidad': 85,
  'Toque Cítrico & Frescor': 45,
  'Cuerpo & Densidad': 80,
  'Duración en Boca': 75,
  'Carácter Silvestre': 90,

  // Miel (Históricos / Canónicos para compatibilidad absoluta)
  'Madurez Enzimática': 85,
  'Complejidad Botánica': 80,
  'Textura & Cristal': 85,
  'Tensión Ácida': 45,
  'Densidad Mineral': 80,
  'Persistencia Floral': 75,
  'Vector Territorial': 90,

  // Fortificaciones & Materias Primas Puras (Nuevos Intuitivos)
  'Tostado & Calidez': 85,
  'Suavidad & Untuosidad': 80,
  'Finura de la Molienda': 75,
  'Cuerpo & Presencia': 90,
  'Toque Amargo Noble': 40,
  'Crocancia & Mordida': 70,
  'Duración del Sabor': 80,
  'Carácter de Origen': 95,

  // Fortificaciones (Históricos)
  'Untuosidad & Grasa Noble': 80,
  'Granulometría & Molienda': 75,
  'Densidad Nutritiva': 90,
  'Amargor Noble / Tanino': 40,
  'Crocancia & Textura': 70,
  'Persistencia en Boca': 80,

  // Miel Fortificada (Nuevos Intuitivos)
  'Intensidad del Fruto/Semilla': 85,
  'Dulzor Equilibrado': 70,
  'Cremosidad & Textura': 85,
  'Toque Tostado o Crudo': 75,
  'Cuerpo & Sustancia': 85,
  'Armonía de Sabores': 90,

  // Miel Fortificada (Históricos)
  'Aporte Nutritivo': 85,
  'Dulzor Miel': 70,
  'Textura Inclusión': 85,
  'Contraste Tostado': 75,
  'Densidad Activa': 85,
  'Sinergia Funcional': 90,

  // Hidromiel (Nuevos e Históricos)
  'Burbuja & Chispa': 65,
  'Carácter Fermentado': 80,
  'Cuerpo & Tanino': 70,
  'Acidez Refrescante': 75,
  'Aroma a Miel de Origen': 85,
  'Suavidad del Alcohol': 70,
  'Efervescencia': 65,
  'Complejidad Fermentativa': 80,
  'Balance Seco/Dulce': 60,
  'Estructura Tánica': 70,
  'Acidez Viva': 75,
  'Carácter Melífero': 85,
  'Alcohol Integrado': 70,

  // Extracto (Nuevos e Históricos)
  'Concentración & Potencia': 90,
  'Picoso & Calidez en Garganta': 75,
  'Aroma Balsámico': 80,
  'Cuerpo Resinoso': 85,
  'Intensidad del Propóleo': 90,
  'Claridad & Limpieza': 95,
  'Concentración Activa': 90,
  'Pungencia Noble': 75,
  'Balsámico Suave': 80,
  'Densidad Resinosa': 85,
  'Potencia Bioactiva': 90,
  'Pureza de Origen': 95,

  // Cosmética (Nuevos e Históricos)
  'Pureza Botánica': 90,
  'Absorción en Piel': 75,
  'Nutrición & Suavidad': 85,
  'Aroma a Cera & Miel': 80,
  'Aroma Noble': 80,
  'Capa Protectora': 85,
  'Barrera Protectora': 85,
  'Tacto Sedoso': 80,
  'Sedosidad': 80,
  'Sensación de Alivio': 85,
  'Calma Cutánea': 85,
  'Absorción Dérmica': 75,
  'Poder Emoliente': 85,

  // Infusión (Nuevos e Históricos)
  'Frescor Aromático': 85,
  'Riqueza de Hierbas': 75,
  'Cuerpo en Boca': 60,
  'Toque Cítrico': 50,
  'Calidez & Retrogusto': 70,
  'Frescor Volátil': 85,
  'Complejidad Herbal': 75,
  'Claridad de Taza': 80,
  'Cuerpo & Astringencia': 60,
  'Notas Florales': 70,
  'Tensión Cítrica': 50,
  'Calidez / Retrogusto': 70,

  // Cera
  'Nutrición de Fibra': 90,
  'Protección al Agua': 95,
  'Hidrorrepelencia': 95,
  'Tiempo de Absorción': 70,
  'Brillo Satinado': 85,
  'Aroma a Panal': 90,
  'Elasticidad de Capa': 80,

  // Hidrolato
  'Pureza de Destilación': 95,
  'Sensación en Piel': 90,
  'Frescor en Piel': 90,
  'Absorción Rápida': 85,
  'Penetración Dérmica': 85,
  'Claridad Botánica': 90,
  'Volatilidad Aromática': 85,
  'Notas de Bosque': 80,
};

export interface GuiaEjeSensorial {
  preguntaGuia: string;
  extremoIzq: string;
  extremoDer: string;
}

export const NODE_ALIASES: Record<string, string[]> = {
  'Intensidad de Sabor': ['Madurez Enzimática', 'Madurez Enzimatica', 'Intensidad'],
  'Aroma a Bosque': ['Complejidad Botánica', 'Complejidad Botanica', 'Aroma'],
  'Dulzor Natural': ['Dulzor', 'Dulzor Miel'],
  'Textura & Cremosidad': ['Textura & Cristal', 'Textura', 'Textura Inclusión'],
  'Toque Cítrico & Frescor': ['Tensión Ácida', 'Tension Acida', 'Acidez Viva', 'Acidez'],
  'Cuerpo & Densidad': ['Densidad Mineral', 'Densidad Metabólica', 'Densidad', 'Cuerpo'],
  'Duración en Boca': ['Persistencia Floral', 'Persistencia en Boca', 'Persistencia'],
  'Carácter Silvestre': ['Vector Territorial', 'Carácter de Origen', 'Origen'],
  'Tostado & Calidez': ['Tostado', 'Contraste Tostado'],
  'Suavidad & Untuosidad': ['Untuosidad & Grasa Noble', 'Untuosidad'],
  'Finura de la Molienda': ['Granulometría & Molienda', 'Granulometria & Molienda', 'Molienda'],
  'Cuerpo & Presencia': ['Densidad Nutritiva', 'Aporte Nutritivo'],
  'Toque Amargo Noble': ['Amargor Noble / Tanino', 'Amargor Noble'],
  'Crocancia & Mordida': ['Crocancia & Textura', 'Crocancia'],
  'Duración del Sabor': ['Persistencia en Boca', 'Persistencia'],
  'Carácter de Origen': ['Vector Territorial', 'Origen de Bosque'],
  'Intensidad del Fruto/Semilla': ['Aporte Nutritivo'],
  'Dulzor Equilibrado': ['Dulzor Miel'],
  'Cremosidad & Textura': ['Textura Inclusión'],
  'Toque Tostado o Crudo': ['Contraste Tostado'],
  'Cuerpo & Sustancia': ['Densidad Activa'],
  'Armonía de Sabores': ['Sinergia Funcional'],
};

export const GUIA_EJES_SENSORIALES: Record<string, GuiaEjeSensorial> = {
  // Miel
  'Intensidad de Sabor': {
    preguntaGuia: '¿Qué tan pronunciado y maduro se siente el sabor al probarlo?',
    extremoIzq: 'Suave & Delicado (1.0)',
    extremoDer: 'Potente & Profundo (10.0)',
  },
  'Aroma a Bosque': {
    preguntaGuia: '¿Qué tan presente está el perfume a flores silvestres, hojas y madera nativa?',
    extremoIzq: 'Tenue & Discreto (1.0)',
    extremoDer: 'Boscoso & Envolvente (10.0)',
  },
  'Dulzor Natural': {
    preguntaGuia: '¿Qué nivel de dulzura pura percibes en la lengua?',
    extremoIzq: 'Muy Moderado (1.0)',
    extremoDer: 'Dulzor Marcado (10.0)',
  },
  'Textura & Cremosidad': {
    preguntaGuia: '¿Cómo se siente en boca? ¿Fluida y ligera o cremosa y untable?',
    extremoIzq: 'Fluida & Ligera (1.0)',
    extremoDer: 'Sedosa & Cremosa (10.0)',
  },
  'Toque Cítrico & Frescor': {
    preguntaGuia: '¿Sientes una nota chispeante o fresca que corta y equilibra el dulzor?',
    extremoIzq: 'Cero Acidez (1.0)',
    extremoDer: 'Fresco & Cítrico (10.0)',
  },
  'Cuerpo & Densidad': {
    preguntaGuia: '¿Qué tan denso, untuoso y con sustancia se siente en el paladar?',
    extremoIzq: 'Ligero en Boca (1.0)',
    extremoDer: 'Con Gran Cuerpo (10.0)',
  },
  'Duración en Boca': {
    preguntaGuia: '¿Cuánto tiempo permanece el sabor y su retrogusto después de tragar?',
    extremoIzq: 'Se Desvanece Rápido (1.0)',
    extremoDer: 'Muy Prolongado (10.0)',
  },
  'Carácter Silvestre': {
    preguntaGuia: '¿Qué tanto evoca la naturaleza pura y salvaje del bosque templado?',
    extremoIzq: 'Sabor Tradicional (1.0)',
    extremoDer: 'Pura Selva Nativa (10.0)',
  },

  // Fortificaciones & Materias Primas Puras (Avellana, Polen puro, Cacao crudo)
  'Tostado & Calidez': {
    preguntaGuia: 'El aroma y calor reconfortante del fruto seco horneado lentamente.',
    extremoIzq: 'Tostado Suave (1.0)',
    extremoDer: 'Tostado Profundo (10.0)',
  },
  'Suavidad & Untuosidad': {
    preguntaGuia: 'Sensación mantecosa y suavidad natural del fruto o semilla molida.',
    extremoIzq: 'Seca o Ligera (1.0)',
    extremoDer: 'Mantecosa & Untuosa (10.0)',
  },
  'Finura de la Molienda': {
    preguntaGuia: '¿Qué tan fino o artesanal es el grano molido al contacto con la lengua?',
    extremoIzq: 'Rústica & Troceada (1.0)',
    extremoDer: 'Sedosa & Fina (10.0)',
  },
  'Cuerpo & Presencia': {
    preguntaGuia: 'Sensación de densidad nutritiva, plenitud y peso del bocado.',
    extremoIzq: 'Liviano (1.0)',
    extremoDer: 'Denso & Nutritivo (10.0)',
  },
  'Toque Amargo Noble': {
    preguntaGuia: 'Toque tostado elegante o cacao oscuro que aporta balance y carácter.',
    extremoIzq: 'Sin Amargor (1.0)',
    extremoDer: 'Amargor Elegante (10.0)',
  },
  'Crocancia & Mordida': {
    preguntaGuia: '¿Se siente el crujiente o textura agradable de trocitos al masticar?',
    extremoIzq: 'Completamente Suave (1.0)',
    extremoDer: 'Crujiente & Texturado (10.0)',
  },
  'Duración del Sabor': {
    preguntaGuia: '¿Cuánto tiempo perdura el retrogusto a fruto seco en el paladar?',
    extremoIzq: 'Breve (1.0)',
    extremoDer: 'Largo & Reconfortante (10.0)',
  },
  'Carácter de Origen': {
    preguntaGuia: 'Identidad del bosque austral y pureza de frutos recolectados.',
    extremoIzq: 'Convencional (1.0)',
    extremoDer: '100% Bosque Austral (10.0)',
  },

  // Miel Fortificada
  'Intensidad del Fruto/Semilla': {
    preguntaGuia: 'Presencia e intensidad del ingrediente noble (avellana, cacao o polen).',
    extremoIzq: 'Sutil (1.0)',
    extremoDer: 'Protagonista (10.0)',
  },
  'Dulzor Equilibrado': {
    preguntaGuia: 'Balance armónico entre la miel y el carácter del fruto o cacao.',
    extremoIzq: 'Muy Suave (1.0)',
    extremoDer: 'Dulzor Marcado (10.0)',
  },
  'Cremosidad & Textura': {
    preguntaGuia: 'Sensación untable y emulsión aterciopelada en boca.',
    extremoIzq: 'Fluida (1.0)',
    extremoDer: 'Cremosa & Untable (10.0)',
  },
  'Toque Tostado o Crudo': {
    preguntaGuia: 'Notas de horneado cálido o frescura viva del superalimento añadido.',
    extremoIzq: 'Tenue (1.0)',
    extremoDer: 'Tostado Marcado (10.0)',
  },
  'Cuerpo & Sustancia': {
    preguntaGuia: 'Densidad y plenitud del bocado en paladar.',
    extremoIzq: 'Ligero (1.0)',
    extremoDer: 'Denso & Nutritivo (10.0)',
  },
  'Armonía de Sabores': {
    preguntaGuia: 'Qué tan bien se integran la miel pura y el superalimento en una sola experiencia.',
    extremoIzq: 'Sabores Separados (1.0)',
    extremoDer: 'Fusión Perfecta (10.0)',
  },

  // Hidromiel
  'Burbuja & Chispa': {
    preguntaGuia: 'Chisporroteo y vivacidad de la fermentación natural salvaje.',
    extremoIzq: 'Tranquila / Plana (1.0)',
    extremoDer: 'Chispeante & Viva (10.0)',
  },
  'Carácter Fermentado': {
    preguntaGuia: 'Complejidad de levaduras vivas del bosque, manzana y pan horneado.',
    extremoIzq: 'Simple (1.0)',
    extremoDer: 'Muy Complejo (10.0)',
  },
  'Balance Seco/Dulce': {
    preguntaGuia: 'Equilibrio entre la frescura seca y el dulzor residual melífero.',
    extremoIzq: 'Totalmente Seca (1.0)',
    extremoDer: 'Dulce Intensa (10.0)',
  },
  'Cuerpo & Tanino': {
    preguntaGuia: 'Estructura en boca y sensación envolvente de cortejo noble.',
    extremoIzq: 'Liviana (1.0)',
    extremoDer: 'Con Gran Estructura (10.0)',
  },
  'Acidez Refrescante': {
    preguntaGuia: 'Acidez viva que limpia el paladar e invita al siguiente sorbo.',
    extremoIzq: 'Baja (1.0)',
    extremoDer: 'Vibrante & Cítrica (10.0)',
  },
  'Aroma a Miel de Origen': {
    preguntaGuia: 'Perfume reconocible de la miel virgen utilizada en la fermentación.',
    extremoIzq: 'Apenas Perceptible (1.0)',
    extremoDer: 'Pura Flor & Miel (10.0)',
  },
  'Suavidad del Alcohol': {
    preguntaGuia: 'Integración cálida y sedosa del alcohol en el paladar.',
    extremoIzq: 'Imperceptible (1.0)',
    extremoDer: 'Cálido & Presente (10.0)',
  },

  // Aliases históricos para fallback transparente
  'Madurez Enzimática': {
    preguntaGuia: '¿Qué tan pronunciado y maduro se siente el sabor al probarlo?',
    extremoIzq: 'Suave & Delicado (1.0)',
    extremoDer: 'Potente & Profundo (10.0)',
  },
  'Complejidad Botánica': {
    preguntaGuia: '¿Qué tan presente está el perfume a flores silvestres y bosque nativo?',
    extremoIzq: 'Tenue (1.0)',
    extremoDer: 'Boscoso & Envolvente (10.0)',
  },
  'Textura & Cristal': {
    preguntaGuia: '¿Cómo se siente en boca? ¿Líquida, suave, o densa y cremosa?',
    extremoIzq: 'Fluida & Ligera (1.0)',
    extremoDer: 'Sedosa & Cremosa (10.0)',
  },
  'Tensión Ácida': {
    preguntaGuia: '¿Sientes una nota fresca o chispeante que equilibra el dulzor?',
    extremoIzq: 'Cero Acidez (1.0)',
    extremoDer: 'Fresco & Cítrico (10.0)',
  },
  'Densidad Mineral': {
    preguntaGuia: '¿Qué tan denso y con sustancia se siente en el paladar?',
    extremoIzq: 'Ligero en Boca (1.0)',
    extremoDer: 'Con Gran Cuerpo (10.0)',
  },
  'Persistencia Floral': {
    preguntaGuia: '¿Cuánto tiempo permanece el recuerdo floral después de tragar?',
    extremoIzq: 'Breve (1.0)',
    extremoDer: 'Muy Prolongado (10.0)',
  },
  'Vector Territorial': {
    preguntaGuia: '¿Qué tanto evoca la naturaleza pura y el origen silvestre de Chiloé?',
    extremoIzq: 'Convencional (1.0)',
    extremoDer: 'Puro Bosque Nativo (10.0)',
  },
  'Granulometría & Molienda': {
    preguntaGuia: '¿Qué tan fino o rústico es el grano molido al contacto con la lengua?',
    extremoIzq: 'Rústica & Troceada (1.0)',
    extremoDer: 'Sedosa & Fina (10.0)',
  },
  'Untuosidad & Grasa Noble': {
    preguntaGuia: 'Sensación mantecosa y suavidad natural del fruto seco molido.',
    extremoIzq: 'Seca (1.0)',
    extremoDer: 'Mantecosa & Untuosa (10.0)',
  },
  'Densidad Nutritiva': {
    preguntaGuia: 'Sensación de plenitud y peso del bocado.',
    extremoIzq: 'Liviano (1.0)',
    extremoDer: 'Denso & Nutritivo (10.0)',
  },
  'Amargor Noble / Tanino': {
    preguntaGuia: 'Toque tostado elegante o cacao oscuro que da balance y carácter.',
    extremoIzq: 'Sin Amargor (1.0)',
    extremoDer: 'Amargor Elegante (10.0)',
  },
  'Crocancia & Textura': {
    preguntaGuia: '¿Se siente el crujiente o textura de trocitos al masticar?',
    extremoIzq: 'Suave (1.0)',
    extremoDer: 'Crujiente (10.0)',
  },
  'Persistencia en Boca': {
    preguntaGuia: '¿Cuánto tiempo perdura el retrogusto en el paladar?',
    extremoIzq: 'Breve (1.0)',
    extremoDer: 'Prolongado (10.0)',
  },
};

export function obtenerGuiaEjeSensorial(axisName: string): GuiaEjeSensorial {
  if (GUIA_EJES_SENSORIALES[axisName]) {
    return GUIA_EJES_SENSORIALES[axisName];
  }
  const lower = (axisName || '').toLowerCase().trim();
  const foundKey = Object.keys(GUIA_EJES_SENSORIALES).find((k) => {
    if (k.toLowerCase() === lower) return true;
    const aliases = NODE_ALIASES[k];
    return aliases && aliases.some((a) => a.toLowerCase() === lower);
  });
  if (foundKey && GUIA_EJES_SENSORIALES[foundKey]) {
    return GUIA_EJES_SENSORIALES[foundKey];
  }
  return {
    preguntaGuia: 'Evalúa la intensidad de esta nota según tu percepción en paladar.',
    extremoIzq: 'Sutil (1.0)',
    extremoDer: 'Intenso (10.0)',
  };
}

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
