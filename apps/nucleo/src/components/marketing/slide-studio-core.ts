// ============================================================================
// slide-studio-core.ts — Motor Canónico del Estudio Editorial RRSS
// Marca: La Obrera y el Zángano (obrerayzangano.cl) · Enjambre Legado
// Proporción: 4:5 · Resolución: 1080 × 1350 px · Tipografía: Cormorant Garamond
// ============================================================================

export type SlideLayoutType =
  | 'manifesto'   // Declaración con viñetas de estándar y nota de acento
  | 'pillars'     // Cuadrícula / lista de bloques estructurados
  | 'metrics'     // Tabla de parámetros y normas de laboratorio
  | 'botany'      // Ficha botánica, floración y regulación de biomasa
  | 'comparison'  // Dos columnas paralelas (ej. Miel Cruda vs. Crema de Miel)
  | 'stat_hero'   // Cifra monumental (< 35°C, 17.2%, 42°S) con narrativa profunda
  | 'cta'         // Portal soberano, atributos y enlace directo
  | 'essay'       // Ensayo o cita libre a sangre sin recuadro
  | 'custom';     // Composición personalizada

export type TitleScale = 'monumental' | 'soberano' | 'editorial' | 'condensado';

export interface SlideData {
  id: string;
  badge: string;              // Insignia superior (Mono con borde)
  kickerLeft: string;         // Identificador temático
  kickerRight: string;        // Anclaje temporal o geográfico
  title: string;              // Título en Cormorant Garamond
  subtitle: string;           // Subtítulo en cursiva o sans
  titleScale?: TitleScale;    // Escala del título principal
  layoutType: SlideLayoutType;

  // Stat Hero layout (Cifra monumental)
  statNumber?: string;        // ej. "< 35°C", "17.2%", "2.400 mm", "42°S", "0%"
  statLabel?: string;         // ej. "UMBRAL TÉRMICO BIOLÓGICO", "HUMEDAD CERTIFICADA"
  statNarrative?: string;     // Párrafo de argumentación

  // Manifesto layout
  manifestoHeader?: string;
  manifestoLines?: string[];
  manifestoAccentNote?: string;

  // Pillars / Blocks layout
  pillars?: Array<{ title: string; desc: string }>;

  // Metrics layout
  metrics?: Array<{ param: string; desc: string }>;

  // Botany layout
  botanyCommonName?: string;
  botanyScientificName?: string;
  botanyFamily?: string;
  botanyFlowering?: string;
  botanyBlocks?: Array<{ title: string; desc: string }>;
  botanyFooterNote?: string;

  // Comparison layout
  comparisonLeft?: { tag: string; title: string; subtitle: string; bullets: string[] };
  comparisonRight?: { tag: string; title: string; subtitle: string; bullets: string[] };
  comparisonSharedNote?: string;

  // CTA layout
  ctaUrl?: string;
  ctaSubtitle?: string;
  ctaSubCall?: string;
  ctaBullets?: string[];

  // Essay / Custom layout
  essayContent?: string[];
  customCardTitle?: string;
  customCardContent?: string;

  footerLeft: string;
}

export interface BrandIssue {
  severity: 'error' | 'warning';
  title: string;
  description: string;
  suggestion?: string;
  autoFix?: { target: string; replacement: string };
}

// ============================================================================
// LA MINA DE ORO (CORPUS DE ACTIVOS Y VERDADES ONTOLÓGICAS)
// ============================================================================

export interface GoldNugget {
  id: string;
  category: 'sentencias' | 'botanica' | 'laboratorio' | 'territorio' | 'tienda';
  title: string;
  subtitle: string;
  kickerLeft: string;
  kickerRight: string;
  badge: string;
  mainTitle: string;
  mainSubtitle: string;
  suggestedLayout: SlideLayoutType;
  content: {
    statNumber?: string;
    statLabel?: string;
    statNarrative?: string;
    items?: Array<{ title: string; desc: string }>;
    bullets?: string[];
    note?: string;
  };
}

export const MINA_DE_ORO: GoldNugget[] = [
  // ── 1. Sentencias Ontológicas y Manifiestos ─────────────────────────────
  {
    id: 'oro-memoria-quimica',
    category: 'sentencias',
    title: 'Memoria Química del Bosque',
    subtitle: 'La miel cruda como archivo biológico inmutable',
    kickerLeft: 'REGISTRO BOTÁNICO',
    kickerRight: 'PARALELO 42°S',
    badge: 'DOCUMENTO DE ORIGEN // SELVA VALDIVIANA',
    mainTitle: 'La miel cruda es la memoria química del bosque nativo.',
    mainSubtitle: 'Un archivo biológico de floración estacional y enzimas intactas.',
    suggestedLayout: 'manifesto',
    content: {
      items: [
        {
          title: 'CONCENTRADO BOTÁNICO',
          desc: 'El néctar de bosque maduro contiene polen nativo específico, glucosa y fructosa crudas, y la firma enzimática de floraciones templadas lluviosas.',
        },
        {
          title: 'FIRMA DE CUENCA',
          desc: 'Cada lote conserva la acidez, conductividad y perfil aromático de la cuenca donde las abejas establecieron su vuelo.',
        },
      ],
      note: 'Registro y constantes biológicas. ->',
    },
  },
  {
    id: 'oro-cero-pasteurizacion',
    category: 'sentencias',
    title: '0% Pasteurización Térmica',
    subtitle: 'El límite biofísico de los 35°C',
    kickerLeft: 'ESTÁNDAR FÍSICO',
    kickerRight: 'TEMPERATURA NATURAL',
    badge: 'NORMA DE EXTRACCIÓN EN FRÍO',
    mainTitle: 'El calor industrial destruye lo que la abeja tardó meses en sintetizar.',
    mainSubtitle: 'Mantenimiento riguroso por debajo de la temperatura de la colmena (< 35 °C).',
    suggestedLayout: 'stat_hero',
    content: {
      statNumber: '< 35 °C',
      statLabel: 'UMBRAL TÉRMICO BIOLÓGICO',
      statNarrative:
        'A temperaturas superiores a 40 °C, las enzimas termolábiles (diastasa, invertasa y glucosa oxidasa) sufren desnaturalización irreversible. Nuestra miel se extrae y centrifuga en frío mecánico, preservando intacto el factor antimicrobiano y la red enzimática natural.',
      note: 'Codex Alimentarius CXS 12-1981 · Ensayo de calidad enzimática.',
    },
  },
  {
    id: 'oro-remanente-estival',
    category: 'sentencias',
    title: 'Recolección del Remanente Estival',
    subtitle: 'Soberanía invernal y respeto biológico',
    kickerLeft: 'PRINCIPIO TERRITORIAL',
    kickerRight: 'CHILOÉ INSULAR',
    badge: 'RECOLECCIÓN SOBERANA',
    mainTitle: 'Solo se extrae el excedente que el bosque permite.',
    mainSubtitle: 'Respeto absoluto a la reserva biológica invernal de la colmena.',
    suggestedLayout: 'manifesto',
    content: {
      items: [
        {
          title: 'RESERVA INVERNAL SOBERANA',
          desc: 'En el régimen de 2.400 mm de lluvia de Chiloé, la colmena requiere su propia miel para termorregular durante el invierno oceánico.',
        },
        {
          title: 'CERO ALIMENTACIÓN ARTIFICIAL',
          desc: 'No se utilizan jarabes de maíz ni sustitutos de azúcar en la invernada. La salud de la abeja depende exclusivamente de su alimento biológico nativo.',
        },
      ],
      note: 'Técnica apícola adaptada a la selva templada lluviosa. ->',
    },
  },

  // ── 2. Catastro Botánico de Chiloé ───────────────────────────────────────
  {
    id: 'oro-ulmo',
    category: 'botanica',
    title: 'Ulmo (Eucryphia cordifolia)',
    subtitle: 'El cenit de la floración estival del dosel maduro',
    kickerLeft: 'FLORA NATIVA',
    kickerRight: 'Eucryphia cordifolia',
    badge: 'MONOGRAFÍA BOTÁNICA // FEBRERO - MARZO',
    mainTitle: 'Floración del Ulmo: el cenit estival del dosel.',
    mainSubtitle: 'Árbol nodriza que alcanza 40 metros de altura en la selva fría.',
    suggestedLayout: 'botany',
    content: {
      items: [
        {
          title: 'PERFIL FLORAL Y NÉCTAR',
          desc: 'Flores blancas abundantes de cuatro pétalos que secretan un néctar denso, floral aromático y de baja humedad espontánea.',
        },
        {
          title: 'TEXTURA Y CRISTALIZACIÓN',
          desc: 'Cristalización rápida en microcristales que entregan una estructura mantecosa fina, color marfil a ámbar claro.',
        },
        {
          title: 'FIJACIÓN DE CARBONO',
          desc: 'Biomasa forestal perenne de alta densidad en cuencas riparias de Chiloé.',
        },
      ],
      note: 'Monofloral certificada con recuento melisopalinológico > 45%.',
    },
  },
  {
    id: 'oro-tiaca',
    category: 'botanica',
    title: 'Tiaca (Caldcluvia paniculata)',
    subtitle: 'Floración temprana de quebrada húmeda',
    kickerLeft: 'FLORA NATIVA',
    kickerRight: 'Caldcluvia paniculata',
    badge: 'MONOGRAFÍA BOTÁNICA // DICIEMBRE - ENERO',
    mainTitle: 'Tiaca: el néctar luminoso de las quebradas húmedas.',
    mainSubtitle: 'Especie nativa del sotobosque y riveras templadas lluviosas.',
    suggestedLayout: 'botany',
    content: {
      items: [
        {
          title: 'PERFIL DE CATA SENSORIAL',
          desc: 'Notas frescas, ligeramente cítricas y balsámicas, con tonalidad ámbar clara y persistencia aromática suave.',
        },
        {
          title: 'PROTECCIÓN DE CURSOS DE AGUA',
          desc: 'Vegetación riparia que afianza los bordes de esteros y turberas contra la erosión invernal.',
        },
      ],
      note: 'Recolección limitada de inicio de temporada.',
    },
  },
  {
    id: 'oro-tepu-meli',
    category: 'botanica',
    title: 'Tepú y Melí (Estrato Medio)',
    subtitle: 'Complejidad fenólica de las turberas y mallines',
    kickerLeft: 'BOSQUE MILENARIO',
    kickerRight: 'Tepualia & Amomyrtus',
    badge: 'POLIFLORAL DE SELVA FRÍA',
    mainTitle: 'La arquitectura floral de los humedales boscosos.',
    mainSubtitle: 'Complejidad fenólica y tonalidades profundas de maderas aromáticas.',
    suggestedLayout: 'pillars',
    content: {
      items: [
        {
          title: 'TEPÚ (Tepualia stipularis)',
          desc: 'Estructura laberíntica en suelos saturados de agua; néctar de ámbar rojizo intenso con alta mineralidad.',
        },
        {
          title: 'MELÍ (Amomyrtus meli)',
          desc: 'Mirtácea aromática de hojas resinosas; aporta notas de pimienta silvestre y corteza fresca.',
        },
        {
          title: 'CONDUCTIVIDAD ELÉCTRICA',
          desc: 'Valores superiores a 0.70 mS/cm característicos de mieles de bosque profundo.',
        },
      ],
      note: 'Huella fenólica y mineral única del archipiélago.',
    },
  },

  // ── 3. Laboratorio y Parámetros Bioquímicos ─────────────────────────────
  {
    id: 'oro-tabla-laboratorio',
    category: 'laboratorio',
    title: 'Tabla de Laboratorio Completa',
    subtitle: 'Constantes analíticas según norma Codex CXS 12-1981',
    kickerLeft: 'LABORATORIO',
    kickerRight: 'NORMA CXS 12-1981',
    badge: 'PARÁMETROS QUÍMICOS AUDITABLES',
    mainTitle: 'Constantes de la miel viva.',
    mainSubtitle: 'Criterios analíticos aplicados a cada lote de recolección:',
    suggestedLayout: 'metrics',
    content: {
      items: [
        {
          title: 'TEMPERATURA NATURAL',
          desc: '< 35 °C en todo el ciclo (umbral biológico de la colmena).',
        },
        {
          title: 'HUMEDAD BIOLÓGICA',
          desc: '17.2% garantizado (por debajo del límite del 20% del Codex).',
        },
        {
          title: 'ACTIVIDAD ENZIMÁTICA',
          desc: 'Diastasa > 12 unidades Schade e invertasa activa certificada.',
        },
        {
          title: 'HIDROXIMETILFURFURAL (HMF)',
          desc: '< 8 mg/kg al envasado (límite Codex: 40 mg/kg). Cero calor.',
        },
        {
          title: 'FILTRADO MECÁNICO GRUESO',
          desc: 'Retención deliberada de partículas de cera virgen y polen nativo.',
        },
      ],
      note: 'Lote analizado con espectrometría y microscopía óptica.',
    },
  },
  {
    id: 'oro-hmf-frescura',
    category: 'laboratorio',
    title: 'HMF: La Huella del Cero Estrés Térmico',
    subtitle: 'El indicador definitivo de pureza frente al calor',
    kickerLeft: 'BIOQUÍMICA',
    kickerRight: 'HMF < 8 mg/kg',
    badge: 'CERTIFICACIÓN DE FRESCURA',
    mainTitle: 'El indicador químico que no miente.',
    mainSubtitle: 'El Hidroximetilfurfural (HMF) certifica la ausencia total de calentamiento.',
    suggestedLayout: 'stat_hero',
    content: {
      statNumber: '< 8 mg/kg',
      statLabel: 'HMF GARANTIZADO EN BODEGA',
      statNarrative:
        'El Codex Alimentarius permite hasta 40 mg/kg de HMF en mieles comerciales. Nuestros análisis registran niveles inferiores a 8 mg/kg, confirmando que el néctar jamás fue sometido a pasteurización para forzar fluidez en góndola.',
      note: 'Norma Internacional Codex Alimentarius CXS 12-1981.',
    },
  },

  // ── 4. Territorio, Clima e Historia Absoluta ─────────────────────────────
  {
    id: 'oro-territorio-2004',
    category: 'territorio',
    title: 'Asentamiento Histórico Desde 2004',
    subtitle: 'Permanencia documentada en el paralelo 42° Sur',
    kickerLeft: 'HISTORIA & GEOGRAFÍA',
    kickerRight: 'DESDE 2004',
    badge: 'FUNDACIÓN Y ASENTAMIENTO · CHILOÉ',
    mainTitle: 'Colmenares en el paralelo 42° Sur.',
    mainSubtitle: 'Técnica apícola adaptada a la geografía oceánica insular:',
    suggestedLayout: 'pillars',
    content: {
      items: [
        {
          title: 'DESDE EL AÑO 2004',
          desc: 'Presencia documentada en colmenares del archipiélago de Chiloé.',
        },
        {
          title: 'CLIMA DE SELVA FRÍA',
          desc: 'Régimen de 2.400 mm de lluvia anual y vientos del Pacífico Sur.',
        },
        {
          title: 'RECOLECCIÓN DEL EXCEDENTE',
          desc: 'Respeto estricto a la reserva invernal. Se extrae solo el remanente estival.',
        },
        {
          title: 'DIVERSIDAD MELÍFERA',
          desc: 'Dosel maduro con floraciones sucesivas de Ulmo, Tiaca, Melí y Tepú.',
        },
      ],
      note: 'Presencia territorial continua en el archipiélago.',
    },
  },
  {
    id: 'oro-dos-expresiones',
    category: 'territorio',
    title: 'La Física en Dos Estados',
    subtitle: 'Miel Cruda líquida vs. Crema batida en frío 48h',
    kickerLeft: 'ESTADOS FÍSICOS',
    kickerRight: 'CRUDA & CREMADA',
    badge: 'COMPORTAMIENTO DE CRISTALIZACIÓN',
    mainTitle: 'La materia en dos expresiones.',
    mainSubtitle: 'Una misma recolección botánica; dos estructuras mecánicas en frío:',
    suggestedLayout: 'comparison',
    content: {
      note: 'AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA',
    },
  },

  // ── 5. Tienda Soberana y Acceso Directo ──────────────────────────────────
  {
    id: 'oro-portal-soberano',
    category: 'tienda',
    title: 'Portal Soberano obrerayzangano.cl',
    subtitle: 'Acceso directo a la reserva y monografías botánicas',
    kickerLeft: 'BIBLIOTECA & ORIGEN',
    kickerRight: 'ACCESO DIRECTO',
    badge: 'ENTORNO ACTIVO · INFORMACIÓN PÚBLICA',
    mainTitle: 'Acceso directo al origen.',
    mainSubtitle: 'En obrerayzangano.cl se encuentra documentado:',
    suggestedLayout: 'cta',
    content: {
      bullets: [
        'Monografías botánicas de cada floración nativa.',
        'Catálogo de parámetros analíticos y científicos.',
        'Trazabilidad por código de lote.',
        'Asignación de Miel Cruda y Crema de Miel batida en frío.',
        'Despacho directo desde el archipiélago de Chiloé.',
      ],
      note: 'ENLACE DIRECTO EN LA BIOGRAFÍA ->',
    },
  },
];

// ============================================================================
// PRESETS EXPANDIDOS DE CARRUSEL
// ============================================================================

export interface CarouselPreset {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  slides: SlideData[];
}

export const CAROUSEL_PRESETS: CarouselPreset[] = [
  {
    id: 'manifiesto-completo',
    name: 'Manifiesto Científico & Origen',
    description: 'Secuencia completa de 6 láminas: Ontología, Territorio, Laboratorio, Bosque, Dos Estados y Tienda.',
    slideCount: 6,
    slides: [
      {
        id: 'slide-01',
        badge: 'DOCUMENTO DE ORIGEN // SELVA VALDIVIANA',
        kickerLeft: 'REGISTRO BOTÁNICO',
        kickerRight: 'PARALELO 42°S',
        title: 'La miel cruda es la memoria química del bosque nativo.',
        subtitle: 'Un archivo biológico de floración estacional y enzimas intactas.',
        titleScale: 'monumental',
        layoutType: 'manifesto',
        manifestoHeader: 'ESTÁNDAR DE EXTRACCIÓN SOBERANA',
        manifestoLines: [
          'El néctar de bosque maduro opera como un concentrado botánico:',
          'contiene polen nativo específico, glucosa y fructosa crudas,',
          'y la firma enzimática de floraciones templadas lluviosas.',
          '',
          'Cada lote conserva la acidez, conductividad y perfil aromático',
          'de la cuenca donde las abejas establecieron su vuelo.',
          '',
          'Registro y constantes biológicas. ->',
        ],
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-02',
        badge: 'FUNDACIÓN Y ASENTAMIENTO · CHILOÉ',
        kickerLeft: 'HISTORIA & GEOGRAFÍA',
        kickerRight: 'DESDE 2004',
        title: 'Colmenares en el paralelo 42° Sur.',
        subtitle: 'Técnica apícola adaptada a la geografía oceánica insular:',
        titleScale: 'soberano',
        layoutType: 'pillars',
        pillars: [
          {
            title: 'DESDE EL AÑO 2004',
            desc: 'Presencia documentada en colmenares del archipiélago de Chiloé.',
          },
          {
            title: 'CLIMA DE SELVA FRÍA',
            desc: 'Régimen de 2.400 mm de lluvia anual y vientos del Pacífico Sur.',
          },
          {
            title: 'RECOLECCIÓN DEL EXCEDENTE',
            desc: 'Respeto estricto a la reserva invernal. Se extrae solo el remanente estival.',
          },
          {
            title: 'DIVERSIDAD MELÍFERA',
            desc: 'Dosel maduro con floraciones sucesivas de Ulmo, Tiaca, Melí y Tepú.',
          },
        ],
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-03',
        badge: 'PARÁMETROS QUÍMICOS AUDITABLES',
        kickerLeft: 'LABORATORIO',
        kickerRight: 'NORMA CXS 12-1981',
        title: 'Constantes de la miel viva.',
        subtitle: 'Criterios analíticos aplicados a cada recolección de origen:',
        titleScale: 'soberano',
        layoutType: 'metrics',
        metrics: [
          {
            param: 'TEMPERATURA NATURAL',
            desc: '< 35 °C en todo el ciclo (umbral biológico de la colmena).',
          },
          {
            param: 'ENZIMAS DIASTASA & INVERTASA',
            desc: 'Actividad enzimática activa certificada según Codex Alimentarius.',
          },
          {
            param: 'PERÓXIDO DE HIDRÓGENO',
            desc: 'Factor antimicrobiano natural generado por la enzima glucosa oxidasa.',
          },
          {
            param: 'CONTEO MELISOPALINOLÓGICO',
            desc: 'Microscopía de granos de polen para certificar la especie dominante.',
          },
          {
            param: 'FILTRADO MECÁNICO GRUESO',
            desc: 'Retención deliberada de partículas de cera virgen y polen nativo.',
          },
        ],
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-04',
        badge: 'ESTRUCTURA FORESTAL Y BALANCE DE CARBONO',
        kickerLeft: 'BIOMASA & CUENCAS',
        kickerRight: 'REGULACIÓN HÍDRICA',
        title: 'El dosel maduro y el agua.',
        subtitle: 'La floración nativa depende de la conservación de la selva fría:',
        titleScale: 'soberano',
        layoutType: 'botany',
        botanyBlocks: [
          {
            title: 'ÁRBOLES NODRIZA (Ulmo y Tiaca)',
            desc: 'Especies que alcanzan hasta 40 metros de altura, con alta densidad de fijación de carbono en biomasa forestal perenne.',
          },
          {
            title: 'PROTECCIÓN DE CUENCAS RIPARIAS',
            desc: 'Colmenares ubicados en cabeceras de cuencas de Chiloé que resguardan la red hídrica superficial y las turberas.',
          },
          {
            title: 'POLINIZACIÓN DE ESPECIES ENDÉMICAS',
            desc: 'La abeja propicia la dispersión genética y germinación de semillas de especies amenazadas del estrato medio.',
          },
        ],
        botanyFooterNote: 'VÍNCULO FORESTAL: CONSERVACIÓN CONTINUA DE CUENCAS EN CHILOÉ',
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-05',
        badge: 'COMPORTAMIENTO DE CRISTALIZACIÓN',
        kickerLeft: 'ESTADOS FÍSICOS',
        kickerRight: 'CRUDA & CREMADA',
        title: 'La materia en dos expresiones.',
        subtitle: 'Una misma recolección botánica; dos estructuras mecánicas en frío:',
        titleScale: 'soberano',
        layoutType: 'comparison',
        comparisonLeft: {
          tag: '[ESTADO 01]',
          title: 'MIEL CRUDA',
          subtitle: 'Floración Estacional',
          bullets: [
            'Extracción por centrifugado mecánico directo del panal.',
            'Ámbar dorado translúcido que cristaliza de forma espontánea y natural con el paso de los meses.',
            'Densidad original sin alteración de fase.',
          ],
        },
        comparisonRight: {
          tag: '[ESTADO 02]',
          title: 'CREMA DE MIEL',
          subtitle: 'Batido en Frío 48 Horas',
          bullets: [
            'Micro-cristalización dirigida mecánicamente.',
            'Cuarenta y ocho horas de movimiento lento a temperatura ambiente.',
            'Estructura aterciopelada y untuosa permanente que mantiene su textura estable.',
          ],
        },
        comparisonSharedNote: 'AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA',
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-06',
        badge: 'ENTORNO ACTIVO · INFORMACIÓN PÚBLICA',
        kickerLeft: 'BIBLIOTECA & ORIGEN',
        kickerRight: 'ACCESO DIRECTO',
        title: 'Acceso directo al origen.',
        subtitle: 'En obrerayzangano.cl se encuentra documentado:',
        titleScale: 'soberano',
        layoutType: 'cta',
        ctaUrl: 'obrerayzangano.cl',
        ctaSubtitle: 'Tienda oficial y biblioteca botánica abierta.',
        ctaSubCall: 'ENLACE DIRECTO EN LA BIOGRAFÍA ->',
        ctaBullets: [
          'Monografías botánicas de cada floración nativa.',
          'Catálogo de parámetros analíticos y científicos.',
          'Trazabilidad por código de lote.',
          'Asignación de Miel Cruda y Crema de Miel batida en frío.',
          'Despacho directo desde el archipiélago de Chiloé.',
        ],
        footerLeft: 'obrerayzangano.cl',
      },
    ],
  },
  {
    id: 'cifra-impacto',
    name: 'Cifra Monumental (Stat Hero)',
    description: 'Carrusel de 3 láminas centrado en métricas biofísicas de alto impacto (< 35°C, HMF < 8 mg/kg).',
    slideCount: 3,
    slides: [
      {
        id: 'slide-stat-01',
        badge: 'LÍMITE BIOFÍSICO INNEGOCIABLE',
        kickerLeft: 'TERMODINÁMICA',
        kickerRight: '< 35 °C',
        title: 'El umbral que separa la miel viva del jarabe industrial.',
        subtitle: 'Constante biológica de la colmena aplicada al proceso de extracción:',
        titleScale: 'soberano',
        layoutType: 'stat_hero',
        statNumber: '< 35 °C',
        statLabel: 'TEMPERATURA MÁXIMA EN TODO EL CICLO',
        statNarrative:
          'La colmena regula su interior a 34.5 °C. Extraer por sobre esa temperatura licúa la miel más rápido pero desnaturaliza las enzimas diastasa y glucosa oxidasa. Nuestro estándar prohíbe todo calentamiento artificial.',
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-stat-02',
        badge: 'ANÁLISIS DE LABORATORIO CERTIFICADO',
        kickerLeft: 'FRESCURA QUÍMICA',
        kickerRight: 'HMF < 8 mg/kg',
        title: 'El Hidroximetilfurfural como testigo físico.',
        subtitle: 'Parámetro de pureza auditado lote por lote:',
        titleScale: 'soberano',
        layoutType: 'stat_hero',
        statNumber: '< 8 mg/kg',
        statLabel: 'HMF AL ENVASADO (NORMA CODEX: 40 mg/kg)',
        statNarrative:
          'El HMF es una sustancia que se forma cuando los azúcares se degradan por calor o envejecimiento. Registrar menos de 8 mg/kg demuestra que el frasco contiene néctar fresco extraído en frío mecánico.',
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-stat-03',
        badge: 'INFORMACIÓN PÚBLICA EN LÍNEA',
        kickerLeft: 'TRAZABILIDAD',
        kickerRight: 'ACCESO DIRECTO',
        title: 'Revisa el pasaporte de laboratorio de tu lote.',
        subtitle: 'Transparencia de datos abierta a la comunidad:',
        titleScale: 'soberano',
        layoutType: 'cta',
        ctaUrl: 'obrerayzangano.cl',
        ctaSubtitle: 'Cada frasco incluye código QR hacia su ensayo de laboratorio.',
        ctaSubCall: 'VER MONOGRAFÍAS Y ANÁLISIS ->',
        ctaBullets: [
          'Espectro de polen de flora nativa.',
          'Porcentaje de humedad medido por refractometría.',
          'Conductividad y acidez libre.',
        ],
        footerLeft: 'obrerayzangano.cl',
      },
    ],
  },
  {
    id: 'ulmo-estacional',
    name: 'Monografía de Ulmo (Verano)',
    description: 'Secuencia botánica de 3 láminas: Eucryphia cordifolia, laboratorio y bodega estacional.',
    slideCount: 3,
    slides: [
      {
        id: 'slide-ulmo-01',
        badge: 'FLORACIÓN DE VERANO // CUENCA DE CHILOÉ',
        kickerLeft: 'FLORA NATIVA',
        kickerRight: 'Eucryphia cordifolia',
        title: 'Floración del Ulmo: el cenit estival del dosel.',
        subtitle: 'Néctar denso y cristalización mantecosa del bosque templado.',
        titleScale: 'monumental',
        layoutType: 'manifesto',
        manifestoHeader: 'CARACTERÍSTICAS DEL NÉCTAR MONOFLORAL',
        manifestoLines: [
          'El árbol de Ulmo florece únicamente entre febrero y marzo en la selva fría.',
          'Sus flores blancas de gran copa generan un néctar de aroma floral penetrante,',
          'con una tonalidad marfil que adquiere cuerpo al consolidar sus microcristales.',
          '',
          'Recolección limitada por la duración exacta de la floración estacional.',
          '',
          'Especificación botánica y analítica. ->',
        ],
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-ulmo-02',
        badge: 'NORMA ANALÍTICA AUDITABLE',
        kickerLeft: 'LABORATORIO',
        kickerRight: 'HUMEDAD < 18%',
        title: 'Análisis analítico del lote Ulmo.',
        subtitle: 'Comprobación de madurez biológica y concentración de polen:',
        titleScale: 'soberano',
        layoutType: 'metrics',
        metrics: [
          {
            param: 'DOMINANCIA POLÍNICA',
            desc: '> 45% de granos de polen correspondientes a Eucryphia cordifolia.',
          },
          {
            param: 'HUMEDAD NATURAL',
            desc: '17.2% garantizado (por debajo del límite del 20% del Codex).',
          },
          {
            param: 'CONDUCTIVIDAD ELÉCTRICA',
            desc: '0.62 mS/cm, sello típico de mieles de bosque nativo húmedo.',
          },
          {
            param: 'HMF (HIDROXIMETILFURFURAL)',
            desc: '< 8 mg/kg al envasado. Cero estrés térmico en el ciclo.',
          },
        ],
        footerLeft: 'obrerayzangano.cl',
      },
      {
        id: 'slide-ulmo-03',
        badge: 'ACCESO EXCLUSIVO POR LOTE',
        kickerLeft: 'COLECCIÓN ESTACIONAL',
        kickerRight: 'DESDE 2004',
        title: 'Reserva disponible en bodega.',
        subtitle: 'Envasado en frasco de vidrio ámbar con pasaporte de origen:',
        titleScale: 'soberano',
        layoutType: 'cta',
        ctaUrl: 'obrerayzangano.cl',
        ctaSubtitle: 'Despacho directo desde el archipiélago a todo el país.',
        ctaSubCall: 'EXPLORA EL CATÁLOGO OFICIAL ->',
        ctaBullets: [
          'Miel de Ulmo en textura líquida original o crema batida 48h.',
          'Sello de origen territorial y número de lote individual.',
          'Acceso a monografía científica completa por frasco.',
        ],
        footerLeft: 'obrerayzangano.cl',
      },
    ],
  },
];

// Presets canónicos históricos para retrocompatibilidad
export const PRESET_MANIFIESTO = CAROUSEL_PRESETS[0].slides;
export const PRESET_ULMO_ESTACIONAL = CAROUSEL_PRESETS[2].slides;

// ============================================================================
// VALIDADOR ANTI-SLOP Y VOCABULARIO SAGRADO CON AUTO-FIX
// ============================================================================

export function checkBrandCompliance(slide: SlideData): BrandIssue[] {
  const issues: BrandIssue[] = [];
  const fullText = [
    slide.badge,
    slide.kickerLeft,
    slide.kickerRight,
    slide.title,
    slide.subtitle,
    slide.statNumber ?? '',
    slide.statLabel ?? '',
    slide.statNarrative ?? '',
    slide.manifestoHeader ?? '',
    ...(slide.manifestoLines ?? []),
    ...(slide.pillars?.flatMap((p) => [p.title, p.desc]) ?? []),
    ...(slide.metrics?.flatMap((m) => [m.param, m.desc]) ?? []),
    ...(slide.botanyBlocks?.flatMap((b) => [b.title, b.desc]) ?? []),
    slide.botanyFooterNote ?? '',
    slide.comparisonLeft?.title ?? '',
    slide.comparisonLeft?.subtitle ?? '',
    ...(slide.comparisonLeft?.bullets ?? []),
    slide.comparisonRight?.title ?? '',
    slide.comparisonRight?.subtitle ?? '',
    ...(slide.comparisonRight?.bullets ?? []),
    slide.comparisonSharedNote ?? '',
    slide.ctaSubtitle ?? '',
    ...(slide.ctaBullets ?? []),
    ...(slide.essayContent ?? []),
    slide.customCardTitle ?? '',
    slide.customCardContent ?? '',
  ].join(' ');

  // 1. Regla Inviolable: Prohibido "cosecha"
  if (/\bcosech/i.test(fullText)) {
    issues.push({
      severity: 'error',
      title: 'Vocabulario sagrado: Uso de "cosecha" prohibido',
      description:
        'En el estándar de la marca se utiliza siempre "recolección" o "recolectado" (la acción de obtener néctar y miel del bosque nativo).',
      suggestion: 'Reemplazar por "recolección", "recolectado" o "recolección estacional".',
      autoFix: { target: 'cosecha', replacement: 'recolección' },
    });
  }

  // 2. Anti-Slop: Contraste reactivo negativo
  if (
    /\b(a diferencia de|no hacemos|no usamos engaños|frente a la industria|a diferencia del mercado|no somos como)\b/i.test(
      fullText,
    )
  ) {
    issues.push({
      severity: 'error',
      title: 'Anti-Slop: Contraste reactivo detectado',
      description:
        'Prohibido definir la marca por comparación negativa con otros. La redacción debe ser 100% asertiva, fáctica y ontológica.',
      suggestion:
        'Enfocarse en hechos comprobables propios (ej. "0% pasteurización térmica", "Extracción en frío < 35°C").',
    });
  }

  // 3. Inmune al envejecimiento: Fechas relativas
  const yearsMatch = fullText.match(/\b(\d+\s*años(?:\s+de\s+trayectoria)?)\b/i);
  if (yearsMatch && !/desde/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Envejecimiento temporal: Número relativo de años',
      description:
        'Frases como "22 años de trayectoria" quedan obsoletas al cambiar de año calendario.',
      suggestion: 'Usar anclaje histórico absoluto como "Desde 2004" o "Fundado en 2004".',
      autoFix: { target: yearsMatch[1], replacement: 'Desde 2004' },
    });
  }

  // 4. Cero jerga de ONG/Hippie
  if (/\bbiocultural\b/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Tono de lujo: Jerga no permitida ("biocultural")',
      description: 'Evitar "biocultural" en UI pública y piezas comerciales; es un principio operativo interno.',
      suggestion: 'Utilizar "territorial", "de origen" o "selva templada".',
      autoFix: { target: 'biocultural', replacement: 'territorial' },
    });
  }
  if (/\bcustodia\b/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Tono de lujo: Jerga no permitida ("custodia")',
      description: 'Evitar "custodia" en interfaces o piezas de cliente.',
      suggestion: 'Utilizar "trayectoria", "legado" o "vínculo".',
      autoFix: { target: 'custodia', replacement: 'legado' },
    });
  }
  if (/\boficio\b/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Tono de lujo: Connotación de sacrificio ("oficio")',
      description: 'Evitar "oficio" para no proyectar trabajador abnegado; proyectar maestría y elegancia.',
      suggestion: 'Utilizar "técnica apícola", "maestría" o "estándar de origen".',
      autoFix: { target: 'oficio', replacement: 'técnica apícola' },
    });
  }

  // 5. Cero filtraciones técnicas
  if (/\b(\.sql|pnpm|uuid|sha-256|postgres|rls|testnet|blockchain)\b/i.test(fullText)) {
    issues.push({
      severity: 'error',
      title: 'Fuga técnica no permitida',
      description: 'No se deben exponer nombres de scripts, bases de datos o comandos en piezas públicas.',
      suggestion: 'Describir el valor funcional ("Pasaporte de trazabilidad", "Registro oficial").',
    });
  }

  return issues;
}

export function applyAutoFixToSlide(
  slide: SlideData,
  fix: { target: string; replacement: string },
): SlideData {
  const replaceStr = (str?: string) => {
    if (!str) return str;
    const regex = new RegExp(fix.target, 'gi');
    return str.replace(regex, fix.replacement);
  };

  return {
    ...slide,
    badge: replaceStr(slide.badge) ?? '',
    kickerLeft: replaceStr(slide.kickerLeft) ?? '',
    kickerRight: replaceStr(slide.kickerRight) ?? '',
    title: replaceStr(slide.title) ?? '',
    subtitle: replaceStr(slide.subtitle) ?? '',
    statNumber: replaceStr(slide.statNumber),
    statLabel: replaceStr(slide.statLabel),
    statNarrative: replaceStr(slide.statNarrative),
    manifestoHeader: replaceStr(slide.manifestoHeader),
    manifestoLines: slide.manifestoLines?.map((l) => replaceStr(l) ?? ''),
    manifestoAccentNote: replaceStr(slide.manifestoAccentNote),
    pillars: slide.pillars?.map((p) => ({
      title: replaceStr(p.title) ?? '',
      desc: replaceStr(p.desc) ?? '',
    })),
    metrics: slide.metrics?.map((m) => ({
      param: replaceStr(m.param) ?? '',
      desc: replaceStr(m.desc) ?? '',
    })),
    botanyBlocks: slide.botanyBlocks?.map((b) => ({
      title: replaceStr(b.title) ?? '',
      desc: replaceStr(b.desc) ?? '',
    })),
    botanyFooterNote: replaceStr(slide.botanyFooterNote),
    comparisonLeft: slide.comparisonLeft
      ? {
          tag: replaceStr(slide.comparisonLeft.tag) ?? '',
          title: replaceStr(slide.comparisonLeft.title) ?? '',
          subtitle: replaceStr(slide.comparisonLeft.subtitle) ?? '',
          bullets: slide.comparisonLeft.bullets.map((b) => replaceStr(b) ?? ''),
        }
      : undefined,
    comparisonRight: slide.comparisonRight
      ? {
          tag: replaceStr(slide.comparisonRight.tag) ?? '',
          title: replaceStr(slide.comparisonRight.title) ?? '',
          subtitle: replaceStr(slide.comparisonRight.subtitle) ?? '',
          bullets: slide.comparisonRight.bullets.map((b) => replaceStr(b) ?? ''),
        }
      : undefined,
    comparisonSharedNote: replaceStr(slide.comparisonSharedNote),
    ctaSubtitle: replaceStr(slide.ctaSubtitle),
    ctaSubCall: replaceStr(slide.ctaSubCall),
    ctaBullets: slide.ctaBullets?.map((b) => replaceStr(b) ?? ''),
    essayContent: slide.essayContent?.map((e) => replaceStr(e) ?? ''),
    customCardTitle: replaceStr(slide.customCardTitle),
    customCardContent: replaceStr(slide.customCardContent),
  };
}

export function createSlideFromNugget(nugget: GoldNugget): SlideData {
  const base: SlideData = {
    id: `slide-nugget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    badge: nugget.badge,
    kickerLeft: nugget.kickerLeft,
    kickerRight: nugget.kickerRight,
    title: nugget.mainTitle,
    subtitle: nugget.mainSubtitle,
    titleScale: nugget.suggestedLayout === 'stat_hero' ? 'monumental' : 'soberano',
    layoutType: nugget.suggestedLayout,
    footerLeft: 'obrerayzangano.cl',
  };

  if (nugget.suggestedLayout === 'stat_hero') {
    base.statNumber = nugget.content.statNumber ?? '< 35 °C';
    base.statLabel = nugget.content.statLabel ?? 'PARÁMETRO BIOLÓGICO';
    base.statNarrative = nugget.content.statNarrative ?? '';
    base.manifestoAccentNote = nugget.content.note;
  } else if (nugget.suggestedLayout === 'manifesto') {
    base.manifestoHeader = nugget.title.toUpperCase();
    if (nugget.content.items && nugget.content.items.length > 0) {
      base.manifestoLines = nugget.content.items.map((it) => `${it.title}: ${it.desc}`);
    } else if (nugget.content.bullets && nugget.content.bullets.length > 0) {
      base.manifestoLines = nugget.content.bullets;
    } else if (nugget.content.statNarrative) {
      base.manifestoLines = [nugget.content.statNarrative];
    }
    base.manifestoAccentNote = nugget.content.note;
  } else if (nugget.suggestedLayout === 'pillars') {
    base.pillars = nugget.content.items ?? [];
  } else if (nugget.suggestedLayout === 'metrics') {
    base.metrics = (nugget.content.items ?? []).map((it) => ({
      param: it.title,
      desc: it.desc,
    }));
  } else if (nugget.suggestedLayout === 'botany') {
    base.botanyBlocks = nugget.content.items ?? [];
    base.botanyFooterNote = nugget.content.note;
  } else if (nugget.suggestedLayout === 'cta') {
    base.ctaUrl = 'obrerayzangano.cl';
    base.ctaSubtitle = nugget.mainSubtitle;
    base.ctaBullets = nugget.content.bullets ?? [];
    base.ctaSubCall = nugget.content.note ?? 'ENLACE DIRECTO EN LA BIOGRAFÍA ->';
  } else if (nugget.suggestedLayout === 'essay') {
    base.essayContent = nugget.content.statNarrative
      ? [nugget.content.statNarrative]
      : nugget.content.bullets ?? [];
  }

  return base;
}

export function applyNuggetToSlide(targetSlide: SlideData, nugget: GoldNugget): SlideData {
  const newSlide = createSlideFromNugget(nugget);
  return {
    ...newSlide,
    id: targetSlide.id,
    footerLeft: targetSlide.footerLeft || 'obrerayzangano.cl',
  };
}

// ============================================================================
// MOTOR DE RENDERIZADO CANVAS (1080 × 1350)
// ============================================================================

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function renderSlideToCanvas(
  slide: SlideData,
  slideIndex: number,
  totalSlides: number,
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignorar fallback
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D de canvas');

  const BG_DARK = '#0A0B0A';
  const CARD_DARK = '#101310';
  const BORDER_LINE = '#262C27';
  const DIVIDER_MUTED = '#1A201B';
  const TEXT_IVORY = '#F2EEE6';
  const TEXT_MUTED = '#8E9690';
  const GOLD_ACCENT = '#D6AA5C';
  const GOLD_MUTED = '#A07E44';

  // 1. Fondo pizarra
  ctx.fillStyle = BG_DARK;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Textura sutil
  for (let i = 0; i < 4000; i++) {
    const rx = Math.floor((Math.sin(i * 997) * 0.5 + 0.5) * CANVAS_WIDTH);
    const ry = Math.floor((Math.cos(i * 613) * 0.5 + 0.5) * CANVAS_HEIGHT);
    const val = 10 + (i % 8);
    ctx.fillStyle = `rgb(${val}, ${val + 1}, ${val})`;
    ctx.fillRect(rx, ry, 1, 1);
  }

  // 3. Recuadro exterior
  ctx.strokeStyle = BORDER_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, CANVAS_WIDTH - 110, CANVAS_HEIGHT - 110);

  // 4. Header
  ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillText(`LA OBRERA Y EL ZÁNGANO // ${slide.kickerLeft}`, 95, 105);

  const rightKicker = slide.kickerRight || 'CHILOÉ · 42°S';
  const rkW = ctx.measureText(rightKicker).width;
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(rightKicker, CANVAS_WIDTH - 95 - rkW, 105);

  ctx.strokeStyle = DIVIDER_MUTED;
  ctx.beginPath();
  ctx.moveTo(95, 140);
  ctx.lineTo(CANVAS_WIDTH - 95, 140);
  ctx.stroke();

  // 5. Footer
  ctx.beginPath();
  ctx.moveTo(95, CANVAS_HEIGHT - 140);
  ctx.lineTo(CANVAS_WIDTH - 95, CANVAS_HEIGHT - 140);
  ctx.stroke();

  ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(slide.footerLeft || 'obrerayzangano.cl', 95, CANVAS_HEIGHT - 95);

  const slideTag = `${String(slideIndex).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`;
  const stW = ctx.measureText(slideTag).width;
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillText(slideTag, CANVAS_WIDTH - 95 - stW, CANVAS_HEIGHT - 95);

  // 6. Badge
  ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillText(slide.badge, 95, 220);

  // 7. Título principal
  const titleSize =
    slide.titleScale === 'monumental'
      ? 74
      : slide.titleScale === 'editorial'
        ? 52
        : slide.titleScale === 'condensado'
          ? 42
          : 64; // 'soberano' por defecto
  const titleLineHeight = Math.round(titleSize * 1.2);

  ctx.font = `600 ${titleSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = TEXT_IVORY;
  const titleLines = wrapCanvasText(ctx, slide.title, CANVAS_WIDTH - 190);
  let curY = 295;
  for (const line of titleLines) {
    ctx.fillText(line, 95, curY);
    curY += titleLineHeight;
  }

  // 8. Subtítulo
  if (slide.subtitle) {
    ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = TEXT_MUTED;
    const subLines = wrapCanvasText(ctx, slide.subtitle, CANVAS_WIDTH - 190);
    curY += 10;
    for (const sline of subLines) {
      ctx.fillText(sline, 95, curY);
      curY += 44;
    }
  }

  // 9. Renderizado por Layout
  curY = Math.max(curY + 30, 470);

  if (slide.layoutType === 'stat_hero') {
    // ── Stat Hero Layout: Gran cifra biofísica + narrativa ────────────
    const cardY = curY;
    const cardH = 580;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
    ctx.strokeStyle = GOLD_ACCENT;
    ctx.lineWidth = 1;
    ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

    // Cifra Monumental (Cormorant 120px)
    ctx.font = '700 115px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.statNumber || '< 35 °C', 140, cardY + 130);

    // Etiqueta Mono
    ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = TEXT_IVORY;
    ctx.fillText(slide.statLabel || 'CONSTANTE BIOFÍSICA CERTIFICADA', 140, cardY + 185);

    ctx.strokeStyle = DIVIDER_MUTED;
    ctx.beginPath();
    ctx.moveTo(140, cardY + 225);
    ctx.lineTo(CANVAS_WIDTH - 140, cardY + 225);
    ctx.stroke();

    // Narrativa en prosa limpia
    ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = TEXT_IVORY;
    const narLines = wrapCanvasText(ctx, slide.statNarrative || '', CANVAS_WIDTH - 280);
    let ny = cardY + 285;
    for (const nl of narLines) {
      ctx.fillText(nl, 140, ny);
      ny += 44;
    }
  } else if (slide.layoutType === 'manifesto') {
    const cardY = curY;
    const cardH = 550;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

    ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.manifestoHeader || 'ESTÁNDAR DE EXTRACCIÓN SOBERANA', 140, cardY + 50);

    ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
    let lineY = cardY + 105;
    for (const mline of slide.manifestoLines ?? []) {
      if (!mline) {
        lineY += 16;
        continue;
      }
      ctx.fillStyle = mline.includes('->') ? GOLD_ACCENT : TEXT_IVORY;
      ctx.fillText(mline, 140, lineY);
      lineY += 44;
    }
  } else if (slide.layoutType === 'pillars') {
    const cardY = curY;
    const cardH = 580;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

    let py = cardY + 45;
    for (const pilar of slide.pillars ?? []) {
      ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(pilar.title, 135, py);

      ctx.font = '400 26px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(pilar.desc, 135, py + 38);

      ctx.strokeStyle = DIVIDER_MUTED;
      ctx.beginPath();
      ctx.moveTo(135, py + 95);
      ctx.lineTo(CANVAS_WIDTH - 135, py + 95);
      ctx.stroke();

      py += 135;
    }
  } else if (slide.layoutType === 'metrics') {
    const cardY = curY;
    const cardH = 620;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

    let my = cardY + 40;
    for (const m of slide.metrics ?? []) {
      ctx.font = '600 23px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(m.param, 135, my);

      ctx.font = '400 25px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(m.desc, 135, my + 35);

      ctx.strokeStyle = DIVIDER_MUTED;
      ctx.beginPath();
      ctx.moveTo(135, my + 88);
      ctx.lineTo(CANVAS_WIDTH - 135, my + 88);
      ctx.stroke();

      my += 115;
    }
  } else if (slide.layoutType === 'botany') {
    let by = curY;
    for (const b of slide.botanyBlocks ?? []) {
      ctx.fillStyle = CARD_DARK;
      ctx.fillRect(95, by, CANVAS_WIDTH - 190, 180);
      ctx.strokeStyle = BORDER_LINE;
      ctx.strokeRect(95, by, CANVAS_WIDTH - 190, 180);

      ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(b.title, 135, by + 34);

      ctx.font = '400 24px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      const descLines = wrapCanvasText(ctx, b.desc, CANVAS_WIDTH - 270);
      let dy = by + 75;
      for (const dl of descLines) {
        ctx.fillText(dl, 135, dy);
        dy += 34;
      }
      by += 205;
    }

    if (slide.botanyFooterNote) {
      ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_MUTED;
      ctx.fillText(slide.botanyFooterNote, 95, by + 30);
    }
  } else if (slide.layoutType === 'comparison') {
    const cardY = curY;
    const cardH = 590;
    const colW = 420;

    // Columna izquierda
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, colW, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(95, cardY, colW, cardH);

    ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.comparisonLeft?.tag || '[ESTADO 01]', 130, cardY + 45);

    ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = TEXT_IVORY;
    ctx.fillText(slide.comparisonLeft?.title || 'MIEL CRUDA', 130, cardY + 95);

    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = GOLD_MUTED;
    ctx.fillText(slide.comparisonLeft?.subtitle || 'Floración Estacional', 130, cardY + 140);

    ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = TEXT_IVORY;
    let b1Y = cardY + 195;
    for (const bullet of slide.comparisonLeft?.bullets ?? []) {
      const blines = wrapCanvasText(ctx, bullet, colW - 70);
      for (const bl of blines) {
        ctx.fillText(bl, 130, b1Y);
        b1Y += 34;
      }
      b1Y += 12;
    }

    // Columna derecha
    const col2X = 565;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(col2X, cardY, colW, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(col2X, cardY, colW, cardH);

    ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.comparisonRight?.tag || '[ESTADO 02]', col2X + 35, cardY + 45);

    ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = TEXT_IVORY;
    ctx.fillText(slide.comparisonRight?.title || 'CREMA DE MIEL', col2X + 35, cardY + 95);

    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = GOLD_MUTED;
    ctx.fillText(slide.comparisonRight?.subtitle || 'Batido en Frío 48 Horas', col2X + 35, cardY + 140);

    ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = TEXT_IVORY;
    let b2Y = cardY + 195;
    for (const bullet of slide.comparisonRight?.bullets ?? []) {
      const blines = wrapCanvasText(ctx, bullet, colW - 70);
      for (const bl of blines) {
        ctx.fillText(bl, col2X + 35, b2Y);
        b2Y += 34;
      }
      b2Y += 12;
    }

    if (slide.comparisonSharedNote) {
      ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(slide.comparisonSharedNote, 95, cardY + cardH + 45);
    }
  } else if (slide.layoutType === 'cta') {
    ctx.font = '400 32px "Source Sans 3", system-ui, sans-serif';
    let cy = curY;
    for (const b of slide.ctaBullets ?? []) {
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText('•', 95, cy);
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(b, 130, cy);
      cy += 50;
    }

    const boxY = Math.max(cy + 30, 840);
    const boxH = 240;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, boxY, CANVAS_WIDTH - 190, boxH);
    ctx.strokeStyle = GOLD_ACCENT;
    ctx.strokeRect(95, boxY, CANVAS_WIDTH - 190, boxH);

    ctx.font = '600 42px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.ctaUrl || 'obrerayzangano.cl', 140, boxY + 65);

    ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = TEXT_IVORY;
    ctx.fillText(slide.ctaSubtitle || 'Tienda oficial y biblioteca botánica abierta.', 140, boxY + 125);

    ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(slide.ctaSubCall || 'ENLACE DIRECTO EN LA BIOGRAFÍA ->', 140, boxY + 175);
  } else if (slide.layoutType === 'essay') {
    // ── Ensayo libre a sangre sin recuadro ─────────────────────────────
    ctx.font = '400 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = TEXT_IVORY;
    let ey = curY + 20;
    for (const paragraph of slide.essayContent ?? []) {
      const elines = wrapCanvasText(ctx, paragraph, CANVAS_WIDTH - 190);
      for (const el of elines) {
        ctx.fillText(el, 95, ey);
        ey += 48;
      }
      ey += 24;
    }
  } else {
    const cardY = curY;
    const cardH = 550;
    ctx.fillStyle = CARD_DARK;
    ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
    ctx.strokeStyle = BORDER_LINE;
    ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

    ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fillText(slide.customCardTitle || 'REGISTRO PERSONALIZADO', 140, cardY + 50);

    ctx.font = '400 28px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = TEXT_IVORY;
    const lines = wrapCanvasText(ctx, slide.customCardContent || '', CANVAS_WIDTH - 280);
    let ly = cardY + 105;
    for (const l of lines) {
      ctx.fillText(l, 140, ly);
      ly += 42;
    }
  }

  return canvas;
}
