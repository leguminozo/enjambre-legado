// ============================================================================
// slide-studio-core.ts — Motor y Arsenal Canónico del Estudio Editorial RRSS
// Marca: La Obrera y el Zángano (obrerayzangano.cl) · Enjambre Legado
// Proporción: 4:5 · Resolución: 1080 × 1350 px · Tipografía: Cormorant Garamond
// ============================================================================

// ============================================================================
// 1. MODELO ABSTRACTO DE LÁMINA (BLOQUES MODULARES)
// ============================================================================

export type SlideBlock =
  | {
      id: string;
      type: 'paragraph';
      header?: string;
      lines: string[];
      accentNote?: string;
    }
  | {
      id: string;
      type: 'items'; // Pilares, principios, especies, fases
      items: Array<{ title: string; desc: string }>;
    }
  | {
      id: string;
      type: 'metrics'; // Tabla analítica de laboratorio o parámetros
      items: Array<{ label: string; value: string }>;
    }
  | {
      id: string;
      type: 'comparison'; // Dos fases (ej. Miel Cruda vs Crema)
      left: { tag: string; title: string; subtitle?: string; lines: string[] };
      right: { tag: string; title: string; subtitle?: string; lines: string[] };
      sharedNote?: string;
    }
  | {
      id: string;
      type: 'portal'; // Tienda soberana / Llamado directo
      url: string;
      subtitle: string;
      bullets: string[];
      callNote?: string;
    }
  | {
      id: string;
      type: 'quote'; // Declaración de alta intensidad
      quote: string;
      attribution?: string;
    };

export type SlideTitleSize = 'compact' | 'normal' | 'large';
export type SlideAlignment = 'left' | 'center';

export interface SlidePalette {
  id: string;
  label: string;
  hex: string;
  mutedHex: string;
}

export const SLIDE_ACCENT_PALETTES: Record<string, SlidePalette> = {
  oro: { id: 'oro', label: 'Oro Melífero', hex: '#D6AA5C', mutedHex: '#A07E44' },
  marfil: { id: 'marfil', label: 'Marfil de Cera', hex: '#F2EEE6', mutedHex: '#B5AEA4' },
  ambar: { id: 'ambar', label: 'Ámbar de Bosque', hex: '#E59840', mutedHex: '#A86824' },
  esmeralda: { id: 'esmeralda', label: 'Selva Fría', hex: '#52B788', mutedHex: '#2D6A4F' },
  ceniza: { id: 'ceniza', label: 'Ceniza Glacial', hex: '#94A3B8', mutedHex: '#64748B' },
  cobre: { id: 'cobre', label: 'Cobre Nativo', hex: '#D97757', mutedHex: '#9C4E34' },
};

export function resolveAccentColor(accent?: string): { hex: string; mutedHex: string } {
  if (!accent) return { hex: '#D6AA5C', mutedHex: '#A07E44' };
  const found = SLIDE_ACCENT_PALETTES[accent];
  if (found) return { hex: found.hex, mutedHex: found.mutedHex };
  if (accent.startsWith('#')) return { hex: accent, mutedHex: accent };
  return { hex: '#D6AA5C', mutedHex: '#A07E44' };
}

export interface SlideData {
  id: string;
  brandMark?: string; // Sello de emisor (ej: "LA OBRERA Y EL ZÁNGANO" o personalizado)
  kickerLeft: string;
  kickerRight: string;
  badge: string;
  title: string;
  subtitle?: string;
  blocks: SlideBlock[];
  footerLeft: string;
  footerRight?: string; // Arista inferior derecha: contador automático o texto personalizado
  accentColor?: string; // Color de acento de marca (oro, marfil, ambar, etc. o hex libre)
  titleSize?: SlideTitleSize; // Escala tipográfica del título ('compact' | 'normal' | 'large')
  alignment?: SlideAlignment; // Alineación del encabezado y título ('left' | 'center')
}

export interface BrandViolation {
  field?: string;
  message: string;
  correction: string;
}

/**
 * Resuelve el encabezado superior (kicker izquierdo y derecho) de forma limpia
 * sin prefijos hardcodeados que truncan el texto del usuario.
 */
export function buildHeaderKicker(slide: SlideData): { left: string; right: string } {
  const brand = slide.brandMark?.trim();
  const kicker = slide.kickerLeft?.trim() || '';

  let left = '';
  if (brand && kicker) {
    if (kicker.toLowerCase().startsWith(brand.toLowerCase())) {
      left = kicker;
    } else {
      left = `${brand} // ${kicker}`;
    }
  } else if (brand) {
    left = brand;
  } else {
    left = kicker || 'ORIGEN SOBERANO';
  }

  const right = slide.kickerRight?.trim() || 'CHILOÉ · 42°S';
  return { left, right };
}

/**
 * Genera un bloque completamente limpio para escribir desde cero sin
 * tener que borrar textos de muestra hardcodeados.
 */
export function createEmptyBlock(type: SlideBlock['type'], defaultUrl: string = 'obrerayzangano.cl'): SlideBlock {
  const blockId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  switch (type) {
    case 'paragraph':
      return {
        id: blockId,
        type: 'paragraph',
        header: '',
        lines: [''],
        accentNote: '',
      };
    case 'items':
      return {
        id: blockId,
        type: 'items',
        items: [
          { title: '', desc: '' },
          { title: '', desc: '' },
        ],
      };
    case 'metrics':
      return {
        id: blockId,
        type: 'metrics',
        items: [
          { label: '', value: '' },
          { label: '', value: '' },
        ],
      };
    case 'comparison':
      return {
        id: blockId,
        type: 'comparison',
        left: { tag: '[FASE 01]', title: '', subtitle: '', lines: [''] },
        right: { tag: '[FASE 02]', title: '', subtitle: '', lines: [''] },
        sharedNote: '',
      };
    case 'portal':
      return {
        id: blockId,
        type: 'portal',
        url: defaultUrl,
        subtitle: '',
        bullets: [''],
        callNote: '',
      };
    case 'quote':
      return {
        id: blockId,
        type: 'quote',
        quote: '',
        attribution: '',
      };
  }
}

/**
 * Generador estructural de caption a partir de las láminas activas del carrusel.
 * Sintetiza dinámicamente título, bajadas, métricas o criterios y portal soberano.
 */
export function generateCarouselCaption(slides: SlideData[]): string {
  if (!slides || slides.length === 0) return '';
  const firstSlide = slides[0];
  const lastSlide = slides[slides.length - 1];

  const lines: string[] = [];

  // Título y gancho de apertura (Lámina 1)
  if (firstSlide.title?.trim()) {
    lines.push(firstSlide.title.trim());
  }
  if (firstSlide.subtitle?.trim()) {
    lines.push('');
    lines.push(firstSlide.subtitle.trim());
  }

  // Resumen estructural de puntos clave
  const keyPoints: string[] = [];
  for (const s of slides) {
    for (const b of s.blocks) {
      if (b.type === 'items') {
        for (const item of b.items) {
          if (item.title?.trim() && item.desc?.trim()) {
            keyPoints.push(`• ${item.title.trim()}: ${item.desc.trim()}`);
          }
        }
      } else if (b.type === 'metrics') {
        for (const m of b.items) {
          if (m.label?.trim() && m.value?.trim()) {
            keyPoints.push(`• ${m.label.trim()}: ${m.value.trim()}`);
          }
        }
      } else if (b.type === 'comparison') {
        if (b.left.title?.trim()) {
          keyPoints.push(`• ${b.left.title.trim()}: ${b.left.subtitle?.trim() || b.left.lines[0]?.trim() || ''}`);
        }
        if (b.right.title?.trim()) {
          keyPoints.push(`• ${b.right.title.trim()}: ${b.right.subtitle?.trim() || b.right.lines[0]?.trim() || ''}`);
        }
      } else if (b.type === 'paragraph' && b.lines.length > 0) {
        const firstMeaningful = b.lines.find((l) => l.trim().length > 0);
        if (firstMeaningful && keyPoints.length < 5) {
          keyPoints.push(`• ${firstMeaningful.trim()}`);
        }
      }
    }
  }

  if (keyPoints.length > 0) {
    lines.push('');
    lines.push('Parámetros y fundamentos documentados:');
    lines.push(...keyPoints.slice(0, 5));
  }

  // Portal y llamada
  const portalUrl = lastSlide.footerLeft?.trim() || firstSlide.footerLeft?.trim() || 'obrerayzangano.cl';
  lines.push('');
  lines.push(`Registro analítico y trazabilidad en ${portalUrl}.`);

  // Hashtags soberanos
  lines.push('');
  lines.push('#LaObreraYElZangano #Chiloe #MielCruda #PurezaDeOrigen #SelvaValdiviana #EstandarDeOrigen');

  return lines.join('\n');
}

// ============================================================================
// 2. LA MINA DE ORO: EL ARSENAL EDITORIAL (ACTIVOS & FRAGMENTOS CANÓNICOS)
// ============================================================================

export interface ArsenalAsset {
  id: string;
  categoria: 'doctrina' | 'laboratorio' | 'botanica' | 'fases' | 'portal';
  titulo: string;
  descripcion: string;
  kickerLeft: string;
  kickerRight: string;
  badge: string;
  tituloSlide: string;
  subtituloSlide?: string;
  block: SlideBlock;
}

export const ARSENAL_EDITORIAL: readonly ArsenalAsset[] = [
  // --- DOCTRINA & AXIOMAS ---
  {
    id: 'doc_memoria_quimica',
    categoria: 'doctrina',
    titulo: 'Memoria Química del Bosque Nativo',
    descripcion: 'Axioma central sobre la miel cruda como archivo biológico vivo.',
    kickerLeft: 'REGISTRO BOTÁNICO',
    kickerRight: 'PARALELO 42°S',
    badge: 'DOCUMENTO DE ORIGEN // SELVA VALDIVIANA',
    tituloSlide: 'La miel cruda es la memoria química del bosque nativo.',
    subtituloSlide: 'Un archivo biológico de floración estacional y enzimas intactas.',
    block: {
      id: 'b_memoria',
      type: 'paragraph',
      header: 'ESTÁNDAR DE EXTRACCIÓN SOBERANA',
      lines: [
        'El néctar de bosque maduro opera como un concentrado botánico:',
        'contiene polen nativo específico, glucosa y fructosa crudas,',
        'y la firma enzimática de floraciones templadas lluviosas.',
        '',
        'Cada lote conserva la acidez, conductividad y perfil aromático',
        'de la cuenca donde las abejas establecieron su vuelo.',
      ],
      accentNote: 'Registro y constantes biológicas. ->',
    },
  },
  {
    id: 'doc_cuatro_pilares',
    categoria: 'doctrina',
    titulo: 'Fundación en Chiloé (Desde 2004)',
    descripcion: 'Los 4 pilares geográficos e históricos de permanencia en el territorio.',
    kickerLeft: 'HISTORIA & GEOGRAFÍA',
    kickerRight: 'DESDE 2004',
    badge: 'FUNDACIÓN Y ASENTAMIENTO · CHILOÉ',
    tituloSlide: 'Colmenares en el paralelo 42° Sur.',
    subtituloSlide: 'Técnica apícola adaptada a la geografía oceánica insular:',
    block: {
      id: 'b_pilares',
      type: 'items',
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
    },
  },

  // --- LABORATORIO & CIENCIA ---
  {
    id: 'lab_constantes_codex',
    categoria: 'laboratorio',
    titulo: 'Constantes Químicas (Norma CXS 12-1981)',
    descripcion: 'Parámetros bioquímicos auditables de calidad y frescura de la miel cruda.',
    kickerLeft: 'LABORATORIO',
    kickerRight: 'NORMA CXS 12-1981',
    badge: 'PARÁMETROS QUÍMICOS AUDITABLES',
    tituloSlide: 'Constantes de la miel viva.',
    subtituloSlide: 'Criterios analíticos aplicados a cada recolección de origen:',
    block: {
      id: 'b_constantes',
      type: 'metrics',
      items: [
        {
          label: 'TEMPERATURA NATURAL',
          value: '< 35 °C en todo el ciclo (umbral biológico de la colmena).',
        },
        {
          label: 'ENZIMAS DIASTASA & INVERTASA',
          value: 'Actividad enzimática activa certificada según Codex Alimentarius.',
        },
        {
          label: 'PERÓXIDO DE HIDRÓGENO',
          value: 'Factor antimicrobiano natural generado por la enzima glucosa oxidasa.',
        },
        {
          label: 'CONTEO MELISOPALINOLÓGICO',
          value: 'Microscopía de granos de polen para certificar la especie dominante.',
        },
        {
          label: 'FILTRADO MECÁNICO GRUESO',
          value: 'Retención deliberada de partículas de cera virgen y polen nativo.',
        },
      ],
    },
  },
  {
    id: 'lab_lote_ulmo',
    categoria: 'laboratorio',
    titulo: 'Análisis de Lote Ulmo Monofloral',
    descripcion: 'Métricas de madurez biológica, humedad y conteo polínico de Eucryphia cordifolia.',
    kickerLeft: 'LABORATORIO',
    kickerRight: 'HUMEDAD < 18%',
    badge: 'NORMA ANALÍTICA AUDITABLE',
    tituloSlide: 'Análisis analítico del lote Ulmo.',
    subtituloSlide: 'Comprobación de madurez biológica y concentración de polen:',
    block: {
      id: 'b_analisis_ulmo',
      type: 'metrics',
      items: [
        {
          label: 'DOMINANCIA POLÍNICA',
          value: '> 45% de granos de polen correspondientes a Eucryphia cordifolia.',
        },
        {
          label: 'HUMEDAD NATURAL',
          value: '17.2% garantizado (por debajo del límite del 20% del Codex).',
        },
        {
          label: 'CONDUCTIVIDAD ELÉCTRICA',
          value: '0.62 mS/cm, sello típico de mieles de bosque nativo húmedo.',
        },
        {
          label: 'HMF (HIDROXIMETILFURFURAL)',
          value: '< 8 mg/kg al envasado. Cero estrés térmico en el ciclo.',
        },
      ],
    },
  },

  // --- BOTÁNICA & BOSQUE ---
  {
    id: 'bot_estructura_bosque',
    categoria: 'botanica',
    titulo: 'Árboles Nodriza y Balance de Cuenca',
    descripcion: 'Estratos de bosque nativo templado, especies nodriza y regulación hídrica.',
    kickerLeft: 'BIOMASA & CUENCAS',
    kickerRight: 'REGULACIÓN HÍDRICA',
    badge: 'ESTRUCTURA FORESTAL Y BALANCE DE CARBONO',
    tituloSlide: 'El dosel maduro y el agua.',
    subtituloSlide: 'La floración nativa depende de la conservación de la selva fría:',
    block: {
      id: 'b_bosque_bloques',
      type: 'items',
      items: [
        {
          title: 'ÁRBOLES NODRIZA (Ulmo y Tiaca)',
          desc: 'Especies de hasta 40 metros de altura con alta densidad de fijación de carbono.',
        },
        {
          title: 'PROTECCIÓN DE CUENCAS RIPARIAS',
          desc: 'Colmenares en cabeceras de cuencas de Chiloé que resguardan la red hídrica.',
        },
        {
          title: 'POLINIZACIÓN DE ESPECIES ENDÉMICAS',
          desc: 'Dispersión genética y germinación de semillas de especies del estrato medio.',
        },
      ],
    },
  },
  {
    id: 'bot_cenit_ulmo',
    categoria: 'botanica',
    titulo: 'Floración Estival del Ulmo',
    descripcion: 'Monografía botánica de febrero-marzo en la selva templada lluviosa.',
    kickerLeft: 'FLORA NATIVA',
    kickerRight: 'Eucryphia cordifolia',
    badge: 'FLORACIÓN DE VERANO // CUENCA DE CHILOÉ',
    tituloSlide: 'Floración del Ulmo: el cenit estival del dosel.',
    subtituloSlide: 'Néctar denso y cristalización mantecosa del bosque templado.',
    block: {
      id: 'b_ulmo_parrafo',
      type: 'paragraph',
      header: 'CARACTERÍSTICAS DEL NÉCTAR MONOFLORAL',
      lines: [
        'El árbol de Ulmo florece únicamente entre febrero y marzo en la selva fría.',
        'Sus flores blancas de gran copa generan un néctar de aroma floral penetrante,',
        'con una tonalidad marfil que adquiere cuerpo al consolidar sus microcristales.',
        '',
        'Recolección limitada por la duración exacta de la floración estacional.',
      ],
      accentNote: 'Especificación botánica y analítica. ->',
    },
  },

  // --- FASES FÍSICAS & TEXTURAS ---
  {
    id: 'fases_dos_expresiones',
    categoria: 'fases',
    titulo: 'Miel Cruda Líquida vs. Crema Batida 48h',
    descripcion: 'Comparativa de estados mecánicos en frío de una misma recolección botánica.',
    kickerLeft: 'ESTADOS FÍSICOS',
    kickerRight: 'CRUDA & CREMADA',
    badge: 'COMPORTAMIENTO DE CRISTALIZACIÓN',
    tituloSlide: 'La materia en dos expresiones.',
    subtituloSlide: 'Una misma recolección botánica; dos estructuras mecánicas en frío:',
    block: {
      id: 'b_comparacion_fases',
      type: 'comparison',
      left: {
        tag: '[ESTADO 01]',
        title: 'MIEL CRUDA',
        subtitle: 'Floración Estacional',
        lines: [
          'Extracción por centrifugado mecánico directo del panal.',
          'Ámbar dorado translúcido que cristaliza de forma espontánea y natural.',
          'Densidad original sin alteración de fase.',
        ],
      },
      right: {
        tag: '[ESTADO 02]',
        title: 'CREMA DE MIEL',
        subtitle: 'Batido en Frío 48 Horas',
        lines: [
          'Micro-cristalización dirigida mecánicamente.',
          'Cuarenta y ocho horas de movimiento lento a temperatura ambiente.',
          'Estructura aterciopelada y untuosa permanente.',
        ],
      },
      sharedNote: 'AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA',
    },
  },

  // --- PORTAL SOBERANO & ACCESO ---
  {
    id: 'portal_soberano_cierre',
    categoria: 'portal',
    titulo: 'Portal Soberano (obrerayzangano.cl)',
    descripcion: 'Cierre oficial con llamada a biblioteca botánica, trazabilidad y tienda.',
    kickerLeft: 'BIBLIOTECA & ORIGEN',
    kickerRight: 'ACCESO DIRECTO',
    badge: 'ENTORNO ACTIVO · INFORMACIÓN PÚBLICA',
    tituloSlide: 'Acceso directo al origen.',
    subtituloSlide: 'En obrerayzangano.cl se encuentra documentado:',
    block: {
      id: 'b_portal_cta',
      type: 'portal',
      url: 'obrerayzangano.cl',
      subtitle: 'Tienda oficial y biblioteca botánica abierta.',
      bullets: [
        'Monografías botánicas de cada floración nativa.',
        'Catálogo de parámetros analíticos y científicos.',
        'Trazabilidad por código de lote.',
        'Asignación de Miel Cruda y Crema de Miel batida en frío.',
        'Despacho directo desde el archipiélago de Chiloé.',
      ],
      callNote: 'ENLACE DIRECTO EN LA BIOGRAFÍA ->',
    },
  },
];

// ============================================================================
// 3. PRESETS INICIALES CONSTRUIDOS SOBRE EL ARSENAL
// ============================================================================

export const PRESET_MANIFIESTO: SlideData[] = [
  {
    id: 'slide-01',
    kickerLeft: 'REGISTRO BOTÁNICO',
    kickerRight: 'PARALELO 42°S',
    badge: 'DOCUMENTO DE ORIGEN // SELVA VALDIVIANA',
    title: 'La miel cruda es la memoria química del bosque nativo.',
    subtitle: 'Un archivo biológico de floración estacional y enzimas intactas.',
    blocks: [
      {
        id: 'b1',
        type: 'paragraph',
        header: 'ESTÁNDAR DE EXTRACCIÓN SOBERANA',
        lines: [
          'El néctar de bosque maduro opera como un concentrado botánico:',
          'contiene polen nativo específico, glucosa y fructosa crudas,',
          'y la firma enzimática de floraciones templadas lluviosas.',
          '',
          'Cada lote conserva la acidez, conductividad y perfil aromático',
          'de la cuenca donde las abejas establecieron su vuelo.',
        ],
        accentNote: 'Registro y constantes biológicas. ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-02',
    kickerLeft: 'HISTORIA & GEOGRAFÍA',
    kickerRight: 'DESDE 2004',
    badge: 'FUNDACIÓN Y ASENTAMIENTO · CHILOÉ',
    title: 'Colmenares en el paralelo 42° Sur.',
    subtitle: 'Técnica apícola adaptada a la geografía oceánica insular:',
    blocks: [
      {
        id: 'b2',
        type: 'items',
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
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-03',
    kickerLeft: 'LABORATORIO',
    kickerRight: 'NORMA CXS 12-1981',
    badge: 'PARÁMETROS QUÍMICOS AUDITABLES',
    title: 'Constantes de la miel viva.',
    subtitle: 'Criterios analíticos aplicados a cada recolección de origen:',
    blocks: [
      {
        id: 'b3',
        type: 'metrics',
        items: [
          {
            label: 'TEMPERATURA NATURAL',
            value: '< 35 °C en todo el ciclo (umbral biológico de la colmena).',
          },
          {
            label: 'ENZIMAS DIASTASA & INVERTASA',
            value: 'Actividad enzimática activa certificada según Codex Alimentarius.',
          },
          {
            label: 'PERÓXIDO DE HIDRÓGENO',
            value: 'Factor antimicrobiano natural generado por la enzima glucosa oxidasa.',
          },
          {
            label: 'CONTEO MELISOPALINOLÓGICO',
            value: 'Microscopía de granos de polen para certificar la especie dominante.',
          },
          {
            label: 'FILTRADO MECÁNICO GRUESO',
            value: 'Retención deliberada de partículas de cera virgen y polen nativo.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-04',
    kickerLeft: 'BIOMASA & CUENCAS',
    kickerRight: 'REGULACIÓN HÍDRICA',
    badge: 'ESTRUCTURA FORESTAL Y BALANCE DE CARBONO',
    title: 'El dosel maduro y el agua.',
    subtitle: 'La floración nativa depende de la conservación de la selva fría:',
    blocks: [
      {
        id: 'b4',
        type: 'items',
        items: [
          {
            title: 'ÁRBOLES NODRIZA (Ulmo y Tiaca)',
            desc: 'Especies de hasta 40 metros de altura con alta densidad de fijación de carbono.',
          },
          {
            title: 'PROTECCIÓN DE CUENCAS RIPARIAS',
            desc: 'Colmenares en cabeceras de cuencas de Chiloé que resguardan la red hídrica.',
          },
          {
            title: 'POLINIZACIÓN DE ESPECIES ENDÉMICAS',
            desc: 'Dispersión genética y germinación de semillas de especies amenazadas.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-05',
    kickerLeft: 'ESTADOS FÍSICOS',
    kickerRight: 'CRUDA & CREMADA',
    badge: 'COMPORTAMIENTO DE CRISTALIZACIÓN',
    title: 'La materia en dos expresiones.',
    subtitle: 'Una misma recolección botánica; dos estructuras mecánicas en frío:',
    blocks: [
      {
        id: 'b5',
        type: 'comparison',
        left: {
          tag: '[ESTADO 01]',
          title: 'MIEL CRUDA',
          subtitle: 'Floración Estacional',
          lines: [
            'Extracción por centrifugado mecánico directo del panal.',
            'Ámbar dorado translúcido que cristaliza espontáneamente.',
            'Densidad original sin alteración de fase.',
          ],
        },
        right: {
          tag: '[ESTADO 02]',
          title: 'CREMA DE MIEL',
          subtitle: 'Batido en Frío 48 Horas',
          lines: [
            'Micro-cristalización dirigida mecánicamente.',
            'Cuarenta y ocho horas de movimiento lento a temperatura ambiente.',
            'Estructura aterciopelada y untuosa permanente.',
          ],
        },
        sharedNote: 'AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA',
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-06',
    kickerLeft: 'BIBLIOTECA & ORIGEN',
    kickerRight: 'ACCESO DIRECTO',
    badge: 'ENTORNO ACTIVO · INFORMACIÓN PÚBLICA',
    title: 'Acceso directo al origen.',
    subtitle: 'En obrerayzangano.cl se encuentra documentado:',
    blocks: [
      {
        id: 'b6',
        type: 'portal',
        url: 'obrerayzangano.cl',
        subtitle: 'Tienda oficial y biblioteca botánica abierta.',
        bullets: [
          'Monografías botánicas de cada floración nativa.',
          'Catálogo de parámetros analíticos y científicos.',
          'Trazabilidad por código de lote.',
          'Asignación de Miel Cruda y Crema de Miel batida en frío.',
          'Despacho directo desde el archipiélago de Chiloé.',
        ],
        callNote: 'ENLACE DIRECTO EN LA BIOGRAFÍA ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
];

export const PRESET_ULMO_ESTACIONAL: SlideData[] = [
  {
    id: 'slide-ulmo-01',
    kickerLeft: 'FLORA NATIVA',
    kickerRight: 'Eucryphia cordifolia',
    badge: 'FLORACIÓN DE VERANO // CUENCA DE CHILOÉ',
    title: 'Floración del Ulmo: el cenit estival del dosel.',
    subtitle: 'Néctar denso y cristalización mantecosa del bosque templado.',
    blocks: [
      {
        id: 'bu1',
        type: 'paragraph',
        header: 'CARACTERÍSTICAS DEL NÉCTAR MONOFLORAL',
        lines: [
          'El árbol de Ulmo florece únicamente entre febrero y marzo en la selva fría.',
          'Sus flores blancas de gran copa generan un néctar de aroma floral penetrante,',
          'con una tonalidad marfil que adquiere cuerpo al consolidar sus microcristales.',
          '',
          'Recolección limitada por la duración exacta de la floración estacional.',
        ],
        accentNote: 'Especificación botánica y analítica. ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-ulmo-02',
    kickerLeft: 'LABORATORIO',
    kickerRight: 'HUMEDAD < 18%',
    badge: 'NORMA ANALÍTICA AUDITABLE',
    title: 'Análisis analítico del lote Ulmo.',
    subtitle: 'Comprobación de madurez biológica y concentración de polen:',
    blocks: [
      {
        id: 'bu2',
        type: 'metrics',
        items: [
          {
            label: 'DOMINANCIA POLÍNICA',
            value: '> 45% de granos de polen correspondientes a Eucryphia cordifolia.',
          },
          {
            label: 'HUMEDAD NATURAL',
            value: '17.2% garantizado (por debajo del límite del 20% del Codex).',
          },
          {
            label: 'CONDUCTIVIDAD ELÉCTRICA',
            value: '0.62 mS/cm, sello típico de mieles de bosque nativo húmedo.',
          },
          {
            label: 'HMF (HIDROXIMETILFURFURAL)',
            value: '< 8 mg/kg al envasado. Cero estrés térmico en el ciclo.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
  {
    id: 'slide-ulmo-03',
    kickerLeft: 'COLECCIÓN ESTACIONAL',
    kickerRight: 'DESDE 2004',
    badge: 'ACCESO EXCLUSIVO POR LOTE',
    title: 'Reserva disponible en bodega.',
    subtitle: 'Envasado en frasco de vidrio ámbar con pasaporte de origen:',
    blocks: [
      {
        id: 'bu3',
        type: 'portal',
        url: 'obrerayzangano.cl',
        subtitle: 'Despacho directo desde el archipiélago a todo el país.',
        bullets: [
          'Miel de Ulmo en textura líquida original o crema batida 48h.',
          'Sello de origen territorial y número de lote individual.',
          'Acceso a monografía científica completa por frasco.',
        ],
        callNote: 'EXPLORA EL CATÁLOGO OFICIAL ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl',
  },
];

// ============================================================================
// 4. GUARDIÁN DE MARCA: AUDITORÍA EN TIEMPO REAL (SIN BANNERS REDUNDANTES)
// Retorna violaciones concretas. Si no hay violaciones, retorna [].
// ============================================================================

export function checkBrandCompliance(slide: SlideData): BrandViolation[] {
  const violations: BrandViolation[] = [];

  const extractText = (block: SlideBlock): string => {
    switch (block.type) {
      case 'paragraph':
        return `${block.header ?? ''} ${block.lines.join(' ')} ${block.accentNote ?? ''}`;
      case 'items':
        return block.items.map((i) => `${i.title} ${i.desc}`).join(' ');
      case 'metrics':
        return block.items.map((m) => `${m.label} ${m.value}`).join(' ');
      case 'comparison':
        return `${block.left.title} ${block.left.lines.join(' ')} ${block.right.title} ${block.right.lines.join(' ')} ${block.sharedNote ?? ''}`;
      case 'portal':
        return `${block.subtitle} ${block.bullets.join(' ')} ${block.callNote ?? ''}`;
      case 'quote':
        return `${block.quote} ${block.attribution ?? ''}`;
    }
  };

  const fullText = [
    slide.badge,
    slide.kickerLeft,
    slide.kickerRight,
    slide.title,
    slide.subtitle ?? '',
    slide.footerLeft ?? '',
    slide.footerRight ?? '',
    ...slide.blocks.map(extractText),
  ].join(' ');

  // 1. Prohibido "cosecha"
  if (/\bcosech/i.test(fullText)) {
    violations.push({
      message: 'Uso de "cosecha" detectado.',
      correction: 'Usar "recolección" o "recolectado" (la acción de obtener néctar del bosque nativo).',
    });
  }

  // 2. Anti-Slop: Contraste reactivo negativo
  if (/\b(a diferencia de|no hacemos|no usamos engaños|frente a la industria|a diferencia del mercado)\b/i.test(fullText)) {
    violations.push({
      message: 'Contraste reactivo ("a diferencia de").',
      correction: 'Expresar hechos afirmativos ontológicos sin definirse por comparación negativa.',
    });
  }

  // 3. Fechas relativas
  if (/\b\d+\s*años\b/i.test(fullText) && !/desde/i.test(fullText)) {
    violations.push({
      message: 'Fecha relativa susceptible a envejecimiento.',
      correction: 'Usar anclaje histórico absoluto como "Desde 2004".',
    });
  }

  // 4. Jerga ONG
  if (/\b(biocultural|custodia|oficio)\b/i.test(fullText)) {
    violations.push({
      message: 'Término de abnegación o jerga interna detectado.',
      correction: 'Usar "maestría apícola", "estándar de origen", "presencia" o "legado".',
    });
  }

  // 5. Filtración técnica
  if (/\b(\.sql|pnpm|uuid|sha-256|postgres|rls|testnet|blockchain)\b/i.test(fullText)) {
    violations.push({
      message: 'Fuga técnica no permitida en pieza pública.',
      correction: 'Usar "Pasaporte de lote", "Sello de origen" o "Certificado analítico".',
    });
  }

  return violations;
}

// ============================================================================
// 5. RENDERIZADO EN ALTA RESOLUCIÓN CANVAS (1080 × 1350)
// ============================================================================

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (!text) return [];
  // Dividir primero por saltos de línea para respetar párrafos y dobles enter (\n\n)
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx];
    // Si la línea está vacía (producida por doble enter \n\n), agregar línea vacía como espaciador
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
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
  }

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
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D');

  const BG_DARK = '#0A0B0A';
  const CARD_DARK = '#101310';
  const BORDER_LINE = '#262C27';
  const DIVIDER_MUTED = '#1A201B';
  const TEXT_IVORY = '#F2EEE6';
  const TEXT_MUTED = '#8E9690';
  const { hex: resolvedAccent, mutedHex: resolvedMuted } = resolveAccentColor(slide.accentColor);
  const GOLD_ACCENT = resolvedAccent;
  const GOLD_MUTED = resolvedMuted;
  const isCentered = slide.alignment === 'center';

  // 1. Fondo pizarra
  ctx.fillStyle = BG_DARK;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Textura orgánica sutil
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
  const { left: headerLeft, right: headerRight } = buildHeaderKicker(slide);
  ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillText(headerLeft, 95, 105);

  const rkW = ctx.measureText(headerRight).width;
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(headerRight, CANVAS_WIDTH - 95 - rkW, 105);

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

  const defaultSlideTag = `${String(slideIndex).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`;
  const slideTag = slide.footerRight?.trim() ? slide.footerRight.trim() : defaultSlideTag;
  const stW = ctx.measureText(slideTag).width;
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillText(slideTag, CANVAS_WIDTH - 95 - stW, CANVAS_HEIGHT - 95);

  // 6. Badge
  ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = GOLD_ACCENT;
  const bW = ctx.measureText(slide.badge).width;
  const bX = isCentered ? (CANVAS_WIDTH - bW) / 2 : 95;
  ctx.fillText(slide.badge, bX, 220);

  // 7. Título principal (Escala tipográfica & Párrafos)
  const isLargeTitle = slide.titleSize === 'large';
  const isCompactTitle = slide.titleSize === 'compact';
  const titleFontSize = isLargeTitle ? 80 : isCompactTitle ? 52 : 66;
  const titleLineHeight = isLargeTitle ? 96 : isCompactTitle ? 66 : 80;
  ctx.font = `600 ${titleFontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = TEXT_IVORY;
  const titleLines = wrapCanvasText(ctx, slide.title, CANVAS_WIDTH - 190);
  let curY = 295;
  for (const line of titleLines) {
    if (!line) {
      curY += 28; // Salto visible de párrafo por doble enter en título
      continue;
    }
    const tW = ctx.measureText(line).width;
    const lineX = isCentered ? (CANVAS_WIDTH - tW) / 2 : 95;
    ctx.fillText(line, lineX, curY);
    curY += titleLineHeight;
  }

  // 8. Subtítulo (Párrafos)
  if (slide.subtitle) {
    ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = TEXT_MUTED;
    const subLines = wrapCanvasText(ctx, slide.subtitle, CANVAS_WIDTH - 190);
    curY += 10;
    for (const sline of subLines) {
      if (!sline) {
        curY += 20; // Salto visible de párrafo por doble enter en subtítulo
        continue;
      }
      const slW = ctx.measureText(sline).width;
      const sLineX = isCentered ? (CANVAS_WIDTH - slW) / 2 : 95;
      ctx.fillText(sline, sLineX, curY);
      curY += 44;
    }
  }

  curY = Math.max(curY + 30, 470);

  // 9. Renderizado dinámico de bloques abstractos
  for (const block of slide.blocks) {
    if (block.type === 'paragraph') {
      const cardY = curY;
      const validLines = block.lines.filter((l) => l.trim().length > 0);
      const emptyLines = block.lines.length - validLines.length;
      const computedH = (block.header ? 65 : 25) + validLines.length * 44 + emptyLines * 28 + (block.accentNote ? 55 : 20) + 30;
      const cardH = Math.min(Math.max(computedH, 180), 590);
      ctx.fillStyle = CARD_DARK;
      ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
      ctx.strokeStyle = BORDER_LINE;
      ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

      if (block.header) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(block.header, 140, cardY + 50);
      }

      ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
      let lineY = cardY + (block.header ? 105 : 60);
      for (const mline of block.lines) {
        if (!mline || !mline.trim()) {
          lineY += 28; // Salto de párrafo por doble enter
          continue;
        }
        ctx.fillStyle = mline.includes('->') ? GOLD_ACCENT : TEXT_IVORY;
        ctx.fillText(mline, 140, lineY);
        lineY += 44;
      }
      if (block.accentNote) {
        ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(block.accentNote, 140, lineY + 10);
      }
      curY += cardH + 20;
    } else if (block.type === 'items') {
      const cardY = curY;
      const validItems = block.items.filter((i) => i.title || i.desc);
      const computedH = Math.max(validItems.length * 120 + 30, 180);
      const cardH = Math.min(computedH, 620);
      ctx.fillStyle = CARD_DARK;
      ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
      ctx.strokeStyle = BORDER_LINE;
      ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

      let py = cardY + 45;
      for (const item of block.items) {
        ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(item.title, 135, py);

        ctx.font = '400 26px "Source Sans 3", system-ui, sans-serif';
        ctx.fillStyle = TEXT_IVORY;
        ctx.fillText(item.desc, 135, py + 38);

        ctx.strokeStyle = DIVIDER_MUTED;
        ctx.beginPath();
        ctx.moveTo(135, py + 95);
        ctx.lineTo(CANVAS_WIDTH - 135, py + 95);
        ctx.stroke();

        py += 135;
      }
      curY += cardH + 20;
    } else if (block.type === 'metrics') {
      const cardY = curY;
      const validMetrics = block.items.filter((m) => m.label || m.value);
      const computedH = Math.max(validMetrics.length * 105 + 30, 180);
      const cardH = Math.min(computedH, 630);
      ctx.fillStyle = CARD_DARK;
      ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
      ctx.strokeStyle = BORDER_LINE;
      ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

      let my = cardY + 40;
      for (const m of block.items) {
        ctx.font = '600 23px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(m.label, 135, my);

        ctx.font = '400 25px "Source Sans 3", system-ui, sans-serif';
        ctx.fillStyle = TEXT_IVORY;
        ctx.fillText(m.value, 135, my + 35);

        ctx.strokeStyle = DIVIDER_MUTED;
        ctx.beginPath();
        ctx.moveTo(135, my + 88);
        ctx.lineTo(CANVAS_WIDTH - 135, my + 88);
        ctx.stroke();

        my += 115;
      }
      curY += cardH + 20;
    } else if (block.type === 'comparison') {
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
      ctx.fillText(block.left.tag, 130, cardY + 45);

      ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(block.left.title, 130, cardY + 95);

      if (block.left.subtitle) {
        ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = GOLD_MUTED;
        ctx.fillText(block.left.subtitle, 130, cardY + 140);
      }

      ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      let b1Y = cardY + 195;
      for (const bullet of block.left.lines) {
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
      ctx.fillText(block.right.tag, col2X + 35, cardY + 45);

      ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(block.right.title, col2X + 35, cardY + 95);

      if (block.right.subtitle) {
        ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = GOLD_MUTED;
        ctx.fillText(block.right.subtitle, col2X + 35, cardY + 140);
      }

      ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      let b2Y = cardY + 195;
      for (const bullet of block.right.lines) {
        const blines = wrapCanvasText(ctx, bullet, colW - 70);
        for (const bl of blines) {
          ctx.fillText(bl, col2X + 35, b2Y);
          b2Y += 34;
        }
        b2Y += 12;
      }

      if (block.sharedNote) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(block.sharedNote, 95, cardY + cardH + 45);
      }
      curY += cardH + 60;
    } else if (block.type === 'portal') {
      ctx.font = '400 32px "Source Sans 3", system-ui, sans-serif';
      let cy = curY;
      for (const b of block.bullets) {
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
      ctx.fillText(block.url, 140, boxY + 65);

      ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(block.subtitle, 140, boxY + 125);

      if (block.callNote) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = TEXT_MUTED;
        ctx.fillText(block.callNote, 140, boxY + 175);
      }
      curY += boxH + 40;
    } else if (block.type === 'quote') {
      const cardY = curY;
      const cardH = 340;
      ctx.fillStyle = CARD_DARK;
      ctx.fillRect(95, cardY, CANVAS_WIDTH - 190, cardH);
      ctx.strokeStyle = BORDER_LINE;
      ctx.strokeRect(95, cardY, CANVAS_WIDTH - 190, cardH);

      ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = TEXT_IVORY;
      const qlines = wrapCanvasText(ctx, `«${block.quote}»`, CANVAS_WIDTH - 280);
      let qy = cardY + 80;
      for (const ql of qlines) {
        ctx.fillText(ql, 140, qy);
        qy += 55;
      }
      if (block.attribution) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(`— ${block.attribution}`, 140, qy + 20);
      }
      curY += cardH + 20;
    }
  }

  return canvas;
}
