/**
 * degustacion-config.ts — Configuración Canónica de Cata & Degustación Phygital
 *
 * Centraliza todos los textos, variantes de mesa, mieles monoflorales,
 * 8 ejes sensoriales canónicos, descriptores de rating y enlaces de productos.
 *
 * EDITABLE DIRECTAMENTE EN CÓDIGO o DESDE NÚCLEO (/etiquetas/qr).
 */

export interface VariedadMesaConfig {
  id: string;
  name: string;
  note: string;
  iconName: 'Droplet' | 'Nut' | 'Flower2' | 'Sparkle' | 'Compass';
  fortificante: 'ninguno' | 'avellana_chilena' | 'polen_floral' | 'cacao_crudo';
  keywords: string[];
  productSlug: string;
}

export interface MielGeograficaConfig {
  key: string;
  nombre: string;
  nombreCientifico: string;
  macroZona: string;
  tagline: string;
  perfilResumido: string;
  floracionSlug: string;
}

export interface DegustacionTextosConfig {
  // Encabezados
  badgeFeria: string;
  tituloSeleccion: string;
  subtituloSeleccion: string;

  // Pabellones
  pabellonCasaLabel: string;
  pabellonCasaSubtitle: string;
  pabellonCasaDesc: string;
  pabellonGeografiasLabel: string;
  pabellonGeografiasSubtitle: string;
  pabellonGeografiasDesc: string;

  // Paso 2: Red Sensorial
  paso2Badge: string;
  paso2Titulo: string;
  paso2Subtitulo: string;

  // Paso 3: Notas & Reseña
  paso3Badge: string;
  paso3Titulo: string;
  paso3Subtitulo: string;
  ratingLabel: string;
  comentarioLabel: string;
  comentarioPlaceholder: string;

  // Paso 4: Éxito & Salida
  exitoTitulo: string;
  exitoBadgeSello: string;
  exitoBadgePuntos: string;
  salidaDiferidaTitulo: string;
  salidaGeografiasTitulo: string;
  salidaDiferidaDesc: string;
  salidaDiferidaBoton: string;
}

export const DEGUSTACION_RATING_MAX = 10;

export interface DegustacionConfig {
  valorInicialEje: number;
  ejesSensorialesCanonicos: readonly string[];
  textos: DegustacionTextosConfig;
  variedadesMesa: VariedadMesaConfig[];
  mielesGeograficas: MielGeograficaConfig[];
  descriptoresRating: Record<number, string>;
}

export const DEGUSTACION_CONFIG_DEFAULT: DegustacionConfig = {
  // La red siempre comienza en nota 1.0 (calibración activa y limpia)
  valorInicialEje: 1.0,

  // Los 8 vértices canónicos de la constelación sensorial
  ejesSensorialesCanonicos: [
    'Intensidad de Sabor',
    'Aroma a Bosque',
    'Dulzor Natural',
    'Textura & Cremosidad',
    'Toque Cítrico & Frescor',
    'Cuerpo & Densidad',
    'Duración en Boca',
    'Carácter Silvestre',
  ],

  textos: {
    badgeFeria: 'Estación de Degustación en Vivo',
    tituloSeleccion: '¿Qué variante estás degustando?',
    subtituloSeleccion:
      'Toca la creación que tienes en tu paladar para calibrar sus notas sensoriales y dejar tu reseña.',
    pabellonCasaLabel: 'Creaciones en Mesa',
    pabellonCasaSubtitle: 'Bosque Nativo · Chiloé',
    pabellonCasaDesc:
      'Selecciona la variante que acabas de probar. Tu evaluación se suma directamente a la ficha oficial de esa creación.',
    pabellonGeografiasLabel: 'Mieles de Chile',
    pabellonGeografiasSubtitle: 'Atlas Botánico',
    pabellonGeografiasDesc:
      'Mieles monoflorales en copa técnica. Su evaluación alimenta directamente la Biblioteca de Floraciones pública de Chile.',
    paso2Badge: 'Paso 2 de 3 · Tu Experiencia en Paladar',
    paso2Titulo: 'Mapa de Sabores & Sensaciones',
    paso2Subtitulo:
      'Ajusta cada nota del 1.0 al 10.0 según lo que sientes en tu boca. Tu red sensorial se dibuja en tiempo real.',
    paso3Badge: 'Paso 3 de 3',
    paso3Titulo: 'Notas de Sabor y Reseña',
    paso3Subtitulo: 'Selecciona los matices que logras percibir en esta muestra.',
    ratingLabel: 'Evaluación Global (Escala de Excelencia Territorial 1 a 10 Estrellas)',
    comentarioLabel: 'Tu reseña oficial (Opcional)',
    comentarioPlaceholder:
      'Describe los matices que sentiste al probar esta miel. Tu comentario aportará a la caracterización sensorial comunitaria...',
    exitoTitulo: 'Tu Pasaporte Sensorial',
    exitoBadgeSello: 'Cata Verificada en {punto}',
    exitoBadgePuntos: '+{puntos} Puntos del Bosque',
    salidaDiferidaTitulo: 'Lleva esta experiencia a tu casa',
    salidaGeografiasTitulo: 'Despensa Austral de Chiloé',
    salidaDiferidaDesc:
      'La cata se disfruta sin prisa ni transacciones en mesa. Puedes revisar nuestras creaciones de temporada con despacho en frío a domicilio en 48 a 72 horas desde Chiloé.',
    salidaDiferidaBoton: 'Explorar Catálogo Oficial (Salida Diferida)',
  },

  variedadesMesa: [
    {
      id: 'crema-pura',
      name: 'Crema de Miel Batida en Frío',
      note: 'Batido mecánico lento en frío · Textura sedosa de bosque nativo',
      iconName: 'Droplet',
      fortificante: 'ninguno',
      keywords: ['crema de miel', 'batida', 'crema', 'pura'],
      productSlug: 'crema-de-miel',
    },
    {
      id: 'crema-avellanas',
      name: 'Crema de Miel con Avellana Chilena',
      note: 'Avellana nativa tostada y molida de bosque templado',
      iconName: 'Nut',
      fortificante: 'avellana_chilena',
      keywords: ['avellana', 'avellanas'],
      productSlug: 'crema-de-miel-con-avellanas',
    },
    {
      id: 'crema-polen',
      name: 'Crema de Miel con Polen Floral',
      note: 'Polen multifloral silvestre recolectado en el archipiélago',
      iconName: 'Flower2',
      fortificante: 'polen_floral',
      keywords: ['polen'],
      productSlug: 'crema-de-miel-con-polen',
    },
    {
      id: 'crema-cacao',
      name: 'Crema de Miel con Nibs de Cacao',
      note: 'Nibs de cacao crudo de origen · Contraste tostado y floral',
      iconName: 'Sparkle',
      fortificante: 'cacao_crudo',
      keywords: ['cacao', 'nibs'],
      productSlug: 'crema-de-miel-con-cacao',
    },
  ],

  mielesGeograficas: [
    {
      key: 'ulmo',
      nombre: 'Miel de Ulmo',
      nombreCientifico: 'Eucryphia cordifolia',
      macroZona: 'Cordillera de la Costa · Los Lagos',
      tagline: 'Aroma a jazmín silvestre, notas anisadas.',
      perfilResumido: 'Cremosa, floral intenso, acidez vibrante equilibrada.',
      floracionSlug: 'ulmo',
    },
    {
      key: 'tiaca',
      nombre: 'Miel de Tiaca',
      nombreCientifico: 'Caldcluvia paniculata',
      macroZona: 'Fiordos y Canales del Sur',
      tagline: 'Perfiles cítricos frescos y hierbas húmedas.',
      perfilResumido: 'Fluida a cristalina fina, sutil amargor noble al final.',
      floracionSlug: 'tiaca',
    },
    {
      key: 'corontillo',
      nombre: 'Miel de Corontillo',
      nombreCientifico: 'Escallonia virgata',
      macroZona: 'Riberas y Humedales Valdivianos',
      tagline: 'Aromas balsámicos profundos y resinosos.',
      perfilResumido: 'Ámbar medio, retrogusto persistente a monte nativo.',
      floracionSlug: 'corontillo',
    },
    {
      key: 'quillay',
      nombre: 'Miel de Quillay',
      nombreCientifico: 'Quillaja saponaria',
      macroZona: 'Zona Central & Valles Áridos',
      tagline: 'Caramelo tostado, madera seca y saponinas.',
      perfilResumido: 'Densa, dulzor estructurado, tono cobrizo cálido.',
      floracionSlug: 'quillay',
    },
    {
      key: 'avellano',
      nombre: 'Miel de Flor de Avellano',
      nombreCientifico: 'Gevuina avellana',
      macroZona: 'Selva Valdiviana Costera',
      tagline: 'Mantequilla tostada, frutos secos y hoja verde.',
      perfilResumido: 'Untuosa, dulzor templado, notas de fruto del bosque.',
      floracionSlug: 'avellano',
    },
    {
      key: 'tepu',
      nombre: 'Miel de Tepú',
      nombreCientifico: 'Tepualia stipularis',
      macroZona: 'Zona Sur & Austral (Chiloé)',
      tagline: 'Suelos fósiles y turbales insulares.',
      perfilResumido: 'Amaderado resinoso profundo, color cobrizo y alta mineralidad.',
      floracionSlug: 'tepu',
    },
  ],

  descriptoresRating: {
    10: 'Excepcional · Calidad Superior de Origen',
    9: 'Sobresaliente · Expresión Botánica Viva',
    8: 'Distinguida · Carácter Genuino',
    7: 'Muy Buena · Balance y Persistencia',
    6: 'Buena · Correcta y Armónica',
    5: 'Notable · Perfil Definido',
    4: 'Aceptable · Base Correcta',
    3: 'Regular · Perfil Discreto',
    2: 'Deficiente · Baja Expresión',
    1: 'Atípica · Fuera de Estándar',
  },
};
