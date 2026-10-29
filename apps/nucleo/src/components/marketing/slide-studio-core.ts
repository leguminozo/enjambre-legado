// ============================================================================
// slide-studio-core.ts — Motor y Arsenal Canónico del Estudio Editorial RRSS
// Marca: La Obrera y el Zángano (obrerayzangano.cl) · Enjambre Legado
// Proporción: 4:5 · Resolución: 1080 × 1350 px · Tipografía: Cormorant Garamond
// ============================================================================

import { resolveTokenColor } from '@enjambre/ui/design-tokens';

// ============================================================================
// 1. MODELO ABSTRACTO DE LÁMINA (BLOQUES MODULARES)
// ============================================================================

export type SlideAspectRatio = '4:5' | '9:16' | '1:1' | '16:9';

export type SlideBlockScale = 'compact' | 'normal' | 'large';

export type SlideBlock =
  | {
      id: string;
      type: 'paragraph';
      header?: string;
      lines: string[];
      accentNote?: string;
      alignment?: SlideAlignment;
      scale?: SlideBlockScale;
    }
  | {
      id: string;
      type: 'items'; // Pilares, principios, especies, fases
      items: Array<{ title: string; desc: string }>;
      alignment?: SlideAlignment;
      scale?: SlideBlockScale;
    }
  | {
      id: string;
      type: 'metrics'; // Tabla analítica de laboratorio o parámetros
      items: Array<{ label: string; value: string }>;
      alignment?: SlideAlignment;
      scale?: SlideBlockScale;
    }
  | {
      id: string;
      type: 'comparison'; // Dos fases (ej. Miel Cruda vs Crema)
      left: { tag: string; title: string; subtitle?: string; lines: string[] };
      right: { tag: string; title: string; subtitle?: string; lines: string[] };
      sharedNote?: string;
      alignment?: SlideAlignment;
    }
  | {
      id: string;
      type: 'portal'; // Tienda soberana / Llamado directo
      url: string;
      subtitle: string;
      bullets: string[];
      callNote?: string;
      alignment?: SlideAlignment;
    }
  | {
      id: string;
      type: 'quote'; // Declaración de alta intensidad
      quote: string;
      attribution?: string;
      alignment?: SlideAlignment;
      scale?: SlideBlockScale;
    }
  | {
      id: string;
      type: 'qr_code'; // Código QR vivo con destino configurable
      destinationType: 'resena' | 'lote' | 'producto' | 'club' | 'tienda' | 'punto_venta_mesa' | 'custom';
      url: string;
      title: string;
      subtitle?: string;
      batchCode?: string;
      alignment?: SlideAlignment;
    }
  | {
      id: string;
      type: 'sensorial'; // Perfil organoléptico y maridaje de autor
      title?: string; // Título libre del bloque (ej. "CATA SENSORIAL DE CAFÉ")
      axisLabels?: [string, string, string, string]; // 4 ejes libres (ej. Fragancia, Acidez, Cuerpo, Balance)
      sweetness: number; // 1-5 (Eje 1)
      acidity: number; // 1-5 (Eje 2)
      flora: number; // 1-5 (Eje 3)
      body: number; // 1-5 (Eje 4)
      crystallization?: string;
      pairingNote?: string;
      alignment?: SlideAlignment;
    };

export type SlideTitleSize = 'compact' | 'normal' | 'large';
export type SlideTitleWeight = 'light' | 'normal' | 'bold';
export type SlideAlignment = 'left' | 'center' | 'right' | 'justify';

export type SlideFontFamily = 'cormorant' | 'sans' | 'mono' | 'display' | 'humanist';

export interface SlideFontConfig {
  id: SlideFontFamily;
  label: string;
  sublabel: string;
  cssClass: string;
  canvasFamily: string;
  isCanonical?: boolean;
}

export const SLIDE_FONT_FAMILIES: Record<SlideFontFamily, SlideFontConfig> = {
  cormorant: {
    id: 'cormorant',
    label: 'Serif Clásico',
    sublabel: 'Cormorant Garamond',
    cssClass: 'font-existencial',
    canvasFamily: '"Cormorant Garamond", Georgia, serif',
    isCanonical: true,
  },
  sans: {
    id: 'sans',
    label: 'Sans Editorial',
    sublabel: 'Source Sans 3 / Inter',
    cssClass: 'font-sans',
    canvasFamily: '"Source Sans 3", system-ui, -apple-system, sans-serif',
    isCanonical: true,
  },
  mono: {
    id: 'mono',
    label: 'Mono de Archivo',
    sublabel: 'JetBrains Mono',
    cssClass: 'font-mono',
    canvasFamily: '"JetBrains Mono", ui-monospace, monospace',
    isCanonical: true,
  },
  display: {
    id: 'display',
    label: 'Display Monumental',
    sublabel: 'Playfair Display',
    cssClass: 'font-serif tracking-tight',
    canvasFamily: '"Playfair Display", "Times New Roman", serif',
    isCanonical: false,
  },
  humanist: {
    id: 'humanist',
    label: 'Humanista Suave',
    sublabel: 'Georgia / Bookman',
    cssClass: 'font-serif',
    canvasFamily: 'Georgia, "Times New Roman", serif',
    isCanonical: false,
  },
};

export function resolveSlideFontFamily(font?: SlideFontFamily): SlideFontConfig {
  if (!font || !SLIDE_FONT_FAMILIES[font]) return SLIDE_FONT_FAMILIES.cormorant;
  return SLIDE_FONT_FAMILIES[font];
}

export function resolveTitleFontWeight(weight?: SlideTitleWeight): {
  cssClass: string;
  canvasWeight: string;
} {
  switch (weight) {
    case 'light':
      return { cssClass: 'font-light', canvasWeight: '300' };
    case 'normal':
      return { cssClass: 'font-normal', canvasWeight: '500' };
    case 'bold':
    default:
      return { cssClass: 'font-semibold', canvasWeight: '600' };
  }
}

export type SlideTheme = 'obsidiana' | 'marfil' | 'selva' | 'tierra';

export interface SlideThemeConfig {
  id: SlideTheme;
  label: string;
  sublabel: string;
  bgHex: string;
  cardHex: string;
  borderHex: string;
  dividerHex: string;
  textPrimaryHex: string;
  textMutedHex: string;
  isLight?: boolean;
}

export const SLIDE_THEMES: Record<SlideTheme, SlideThemeConfig> = {
  obsidiana: {
    id: 'obsidiana',
    label: 'Obsidiana Carbón',
    sublabel: 'Nocturno editorial',
    get bgHex() {
      return resolveTokenColor('--enj-slide-obsidiana-bg', '#0A0B0A');
    },
    get cardHex() {
      return resolveTokenColor('--enj-slide-obsidiana-card', '#101310');
    },
    get borderHex() {
      return resolveTokenColor('--enj-slide-obsidiana-border', '#262C27');
    },
    get dividerHex() {
      return resolveTokenColor('--enj-slide-obsidiana-divider', '#1A201B');
    },
    get textPrimaryHex() {
      return resolveTokenColor('--enj-slide-obsidiana-fg', '#F2EEE6');
    },
    get textMutedHex() {
      return resolveTokenColor('--enj-slide-obsidiana-muted', '#8E9690');
    },
    isLight: false,
  },
  marfil: {
    id: 'marfil',
    label: 'Marfil Papel',
    sublabel: 'Ficha clara de prensa',
    get bgHex() {
      return resolveTokenColor('--enj-slide-marfil-bg', '#F7F4EB');
    },
    get cardHex() {
      return resolveTokenColor('--enj-slide-marfil-card', '#EDE8DC');
    },
    get borderHex() {
      return resolveTokenColor('--enj-slide-marfil-border', '#D8D1BF');
    },
    get dividerHex() {
      return resolveTokenColor('--enj-slide-marfil-divider', '#DFD8C8');
    },
    get textPrimaryHex() {
      return resolveTokenColor('--enj-slide-marfil-fg', '#161916');
    },
    get textMutedHex() {
      return resolveTokenColor('--enj-slide-marfil-muted', '#666C66');
    },
    isLight: true,
  },
  selva: {
    id: 'selva',
    label: 'Selva Fría',
    sublabel: 'Verde bosque profundo',
    get bgHex() {
      return resolveTokenColor('--enj-slide-selva-bg', '#06130A');
    },
    get cardHex() {
      return resolveTokenColor('--enj-slide-selva-card', '#0B1C10');
    },
    get borderHex() {
      return resolveTokenColor('--enj-slide-selva-border', '#183822');
    },
    get dividerHex() {
      return resolveTokenColor('--enj-slide-selva-divider', '#112918');
    },
    get textPrimaryHex() {
      return resolveTokenColor('--enj-slide-selva-fg', '#EAF5EC');
    },
    get textMutedHex() {
      return resolveTokenColor('--enj-slide-selva-muted', '#7AA383');
    },
    isLight: false,
  },
  tierra: {
    id: 'tierra',
    label: 'Tierra Alerce',
    sublabel: 'Corteza cálida 42°S',
    get bgHex() {
      return resolveTokenColor('--enj-slide-tierra-bg', '#130A06');
    },
    get cardHex() {
      return resolveTokenColor('--enj-slide-tierra-card', '#1C100A');
    },
    get borderHex() {
      return resolveTokenColor('--enj-slide-tierra-border', '#331F14');
    },
    get dividerHex() {
      return resolveTokenColor('--enj-slide-tierra-divider', '#25160E');
    },
    get textPrimaryHex() {
      return resolveTokenColor('--enj-slide-tierra-fg', '#FCECE3');
    },
    get textMutedHex() {
      return resolveTokenColor('--enj-slide-tierra-muted', '#A88876');
    },
    isLight: false,
  },
};

export function resolveSlideTheme(theme?: SlideTheme): SlideThemeConfig {
  if (!theme || !SLIDE_THEMES[theme]) return SLIDE_THEMES.obsidiana;
  return SLIDE_THEMES[theme];
}

export interface SlidePalette {
  id: string;
  label: string;
  hex: string;
  mutedHex: string;
}

export const SLIDE_ACCENT_PALETTES: Record<string, SlidePalette> = {
  oro: {
    id: 'oro',
    label: 'Oro Melífero',
    get hex() {
      return resolveTokenColor('--enj-accent-oro', '#D6AA5C');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-oro-muted', '#A07E44');
    },
  },
  marfil: {
    id: 'marfil',
    label: 'Marfil de Cera',
    get hex() {
      return resolveTokenColor('--enj-accent-marfil', '#F2EEE6');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-marfil-muted', '#B5AEA4');
    },
  },
  ambar: {
    id: 'ambar',
    label: 'Ámbar de Bosque',
    get hex() {
      return resolveTokenColor('--enj-accent-ambar', '#E59840');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-ambar-muted', '#A86824');
    },
  },
  esmeralda: {
    id: 'esmeralda',
    label: 'Selva Fría',
    get hex() {
      return resolveTokenColor('--enj-accent-esmeralda', '#52B788');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-esmeralda-muted', '#2D6A4F');
    },
  },
  ceniza: {
    id: 'ceniza',
    label: 'Ceniza Glacial',
    get hex() {
      return resolveTokenColor('--enj-accent-ceniza', '#94A3B8');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-ceniza-muted', '#64748B');
    },
  },
  cobre: {
    id: 'cobre',
    label: 'Cobre Nativo',
    get hex() {
      return resolveTokenColor('--enj-accent-cobre', '#D97757');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-cobre-muted', '#9C4E34');
    },
  },
  tepu: {
    id: 'tepu',
    label: 'Corteza de Tepú',
    get hex() {
      return resolveTokenColor('--enj-accent-tepu', '#9A6B48');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-tepu-muted', '#6C4528');
    },
  },
  liquen: {
    id: 'liquen',
    label: 'Liquen Dorado',
    get hex() {
      return resolveTokenColor('--enj-accent-liquen', '#B3A158');
    },
    get mutedHex() {
      return resolveTokenColor('--enj-accent-liquen-muted', '#7A6D32');
    },
  },
};

export function resolveAccentColor(accent?: string): { hex: string; mutedHex: string } {
  const fallback = {
    hex: resolveTokenColor('--enj-accent-oro', '#D6AA5C'),
    mutedHex: resolveTokenColor('--enj-accent-oro-muted', '#A07E44'),
  };
  if (!accent) return fallback;
  const found = SLIDE_ACCENT_PALETTES[accent];
  if (found) return { hex: found.hex, mutedHex: found.mutedHex };
  if (accent.startsWith('#')) return { hex: accent, mutedHex: accent };
  return fallback;
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
  accentColor?: string; // Color de acento de marca (oro, marfil, ambar, etc. o hex libre #...)
  fontFamily?: SlideFontFamily; // Tipografía rectora
  theme?: SlideTheme; // Atmósfera de fondo y tono editorial
  titleSize?: SlideTitleSize; // Escala tipográfica del título ('compact' | 'normal' | 'large')
  titleWeight?: SlideTitleWeight; // Peso tipográfico del título ('light' | 'normal' | 'bold')
  titleItalic?: boolean; // Cursiva o itálica en el título principal
  alignment?: SlideAlignment; // Alineación rectora ('left' | 'center' | 'right' | 'justify')
  cleanFrame?: boolean; // Marco limpio/zen (sin aristas perimetrales)
  hideDividers?: boolean; // Minimalista limpio sin líneas divisorias
  aspectRatio?: SlideAspectRatio; // Proporción de aspecto ('4:5' | '9:16' | '1:1' | '16:9')
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
  const kicker = slide.kickerLeft !== undefined ? slide.kickerLeft.trim() : '';

  let left: string;
  if (brand && kicker) {
    if (kicker.toLowerCase().startsWith(brand.toLowerCase())) {
      left = kicker;
    } else {
      left = `${brand} // ${kicker}`;
    }
  } else if (brand) {
    left = brand;
  } else {
    left = kicker;
  }

  const right = slide.kickerRight !== undefined ? slide.kickerRight.trim() : '';
  return { left, right };
}

/**
 * Genera un bloque completamente limpio para escribir desde cero sin
 * tener que borrar textos de muestra hardcodeados.
 */
export function createEmptyBlock(type: SlideBlock['type'], defaultUrl: string = ''): SlideBlock {
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
    case 'qr_code':
      return {
        id: blockId,
        type: 'qr_code',
        destinationType: 'custom',
        url: 'https://',
        title: 'CÓDIGO QR',
        subtitle: 'Apunta la cámara para acceder directamente.',
        batchCode: '',
      };
    case 'sensorial':
      return {
        id: blockId,
        type: 'sensorial',
        title: '',
        axisLabels: ['Dulzura', 'Acidez', 'Flora', 'Cuerpo'],
        sweetness: 4,
        acidity: 3,
        flora: 5,
        body: 4,
        crystallization: '',
        pairingNote: '',
      };
  }
}


export const createDefaultSlideBlock = createEmptyBlock;

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

  // --- CAFETERÍAS DE ESPECIALIDAD ---
  {
    id: 'cafe_cuatro_cremas',
    categoria: 'doctrina',
    titulo: 'Las Cuatro Cremas de Mesa (Cafetería)',
    descripcion: 'Línea de cremas batidas en frío por maridaje con café, té e infusiones de especialidad.',
    kickerLeft: 'CUATRO CREMAS DE MESA',
    kickerRight: 'BATIDO EN FRÍO 48H',
    badge: 'COLECCIÓN DE BARRA · FORMATOS 25G — 5 KG',
    tituloSlide: 'Pequeñas creaciones para una gran taza.',
    subtituloSlide: 'Cuatro expresiones de miel cruda micro-cristalizada, formuladas por maridaje:',
    block: {
      id: 'b_cuatro_cremas',
      type: 'items',
      items: [
        {
          title: 'MIEL VIRGEN CON TROCITO DE PANAL',
          desc: 'Miel virgen cruda con trozo de panal natural intacto. Maridaje: té negro, infusiones de flor y bollería fina.',
        },
        {
          title: 'CREMA CON AVELLANA CHILENA TOSTADA Y MOLIDA',
          desc: 'Avellana nativa tostada y molida en frío. Maridaje: cappuccino, chai especiado y tostadas.',
        },
        {
          title: 'CREMA CON NIBS DE CACAO CRUDO (SANTANDER)',
          desc: 'Nibs de cacao crudo puro de Santander (Colombia). Maridaje: espresso, mocaccino y café filtrado.',
        },
        {
          title: 'CREMA CON POLEN FLORAL',
          desc: 'Polen floral seleccionado en micro-grano. Maridaje: té verde, yogurt natural y bowls matinales.',
        },
      ],
    },
  },
  {
    id: 'cafe_protocolo_barra',
    categoria: 'laboratorio',
    titulo: 'Protocolo de Barra — Límite Térmico y Conservación',
    descripcion: 'Estándar técnico para preservar la invertasa activa en servicio de café de especialidad.',
    kickerLeft: 'ESTÁNDAR DE BARRA',
    kickerRight: 'PARÁMETROS TÉCNICOS',
    badge: 'PROTOCOLO DE SERVICIO // EMULSIÓN & TEMPERATURA',
    tituloSlide: 'Reglas de servicio en barra de especialidad.',
    subtituloSlide: 'Preservación de enzimas activas y disolución perfecta:',
    block: {
      id: 'b_protocolo_barra',
      type: 'items',
      items: [
        {
          title: 'LÍMITE TÉRMICO ACTIVO: 40°C',
          desc: 'Verter siempre tras texturizar la leche. Protege la invertasa viva del néctar.',
        },
        {
          title: 'CONSERVACIÓN 15°C – 25°C',
          desc: 'Rango técnico entre pedidos para mantener la enzima invertasa activa.',
        },
        {
          title: 'SOLUBILIDAD INSTANTÁNEA',
          desc: 'Dispersión homogénea en Chemex, V60, cold brew y aeropress sin agitación forzada.',
        },
        {
          title: 'TRIADA DE FORMATOS DE ALTA GAMA',
          desc: 'Frasco 25g para cata en mesa, 150g para vitrina retail y pote 500g para emulsión barista.',
        },
      ],
    },
  },
  {
    id: 'cafe_st_cata_mesa',
    categoria: 'doctrina',
    titulo: 'Protocolo ST-CATA — Cata Científica en Mesa (60 segundos)',
    descripcion: 'Instrumento sensorial para comensales en cafetería: pares semánticos, chips y acreditación automática de puntos.',
    kickerLeft: 'PROTOCOLO ST-CATA',
    kickerRight: 'CIENCIA EN SALA',
    badge: 'CIENCIA SENSORIAL // 60 SEGUNDOS · N ≥ 30 SESIONES',
    tituloSlide: 'Tu comensal valida el origen desde la mesa.',
    subtituloSlide: 'Instrumento de cata de 60 segundos con acreditación automática de puntos:',
    block: {
      id: 'b_st_cata',
      type: 'comparison',
      left: {
        tag: '[BARISTA]',
        title: 'PENDÓN QR',
        subtitle: 'Activación del punto',
        lines: [
          'Código QR único del local en cada mesa.',
          'El comensal ingresa con WhatsApp o correo.',
          'Sin descargas ni contraseñas.',
        ],
      },
      right: {
        tag: '[COMENSAL]',
        title: 'CATA GUIADA',
        subtitle: 'Protocolo ST-CATA',
        lines: [
          '3 pares semánticos: Suave–Intenso, Dulce–Ácido, Líquida–Cremosa.',
          'Chips de sabor con orden aleatorio contra sesgos de posición.',
          '25 puntos acreditados automáticamente al perfil.',
        ],
      },
      sharedNote:
        'RESEÑA "DEGUSTACIÓN EN CAFETERÍA · [CIUDAD]" PUBLICADA EN TIENDA PARA MODERACIÓN EDITORIAL',
    },
  },
  {
    id: 'cafe_portal_alianza',
    categoria: 'portal',
    titulo: 'Portal de Alianza Gastronómica (Cafeterías)',
    descripcion: 'Bloque de cierre B2B para cafeterías: kit piloto, láminas A6 de mesa y trazabilidad de origen.',
    kickerLeft: 'ALIANZA GASTRONÓMICA',
    kickerRight: 'ACCESO DIRECTO',
    badge: 'ACTIVACIÓN DEL CANAL // PRIMERA ENTREGA EN 5 DÍAS HÁBILES',
    tituloSlide: 'Ingresa al circuito de origen.',
    subtituloSlide: 'Tu cafetería como nodo de cata sensorial distribuida del bosque nativo de Chiloé:',
    block: {
      id: 'b_portal_alianza_cafe',
      type: 'portal',
      url: 'obrerayzangano.cl/alianzas/cafeterias',
      subtitle: 'Registro de aliados gastronómicos y activación de kit.',
      bullets: [
        'Dossier con lista de precios netos mayoristas sin intermediarios.',
        'Láminas A6 de mesa con QR ST-CATA (fidelización comensal desde el día 1).',
        'Soporte técnico y curva de vertido térmico (< 40°C) para baristas.',
        'Reposición con validador de stock y despacho preferente.',
        'Garantía técnica de 30 días para resguardo de temperatura y calidad.',
      ],
      callNote: 'SOLICITAR KIT PILOTO O PROPUESTA A MEDIDA ->',
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

export const PRESET_KIT_CAFETERIA: SlideData[] = [
  // --- LÁMINA 01: Portada de Maridaje — Gancho sensorial de alta gama ---
  {
    id: 'slide-cafe-01',
    kickerLeft: 'CAFETERÍAS DE ESPECIALIDAD',
    kickerRight: 'BARISMO // CHILOÉ',
    badge: 'MARIDAJE DE ORIGEN · CATA DE AUTOR',
    title: 'Miel de bosque virgen para café de especialidad.',
    subtitle: 'Equilibrio botánico entre acidez floral y dulzura enzimática intacta.',
    blocks: [
      {
        id: 'bc1',
        type: 'sensorial',
        title: 'PERFIL DE MARIDAJE DE AUTOR',
        axisLabels: ['Dulzura Floral', 'Acidez Botánica', 'Intensidad Bosque', 'Cuerpo / Crema'],
        sweetness: 4,
        acidity: 3,
        flora: 5,
        body: 4,
        crystallization: 'Microcristales sedosos y untuosos',
        pairingNote: 'Armoniza con tueste medio lavado, geisha y cold brews cítricos. Servir a < 40°C.',
      },
    ],

    footerLeft: 'obrerayzangano.cl // Red de Alianzas Gastronómicas',
    footerRight: 'KIT MESA',
    theme: 'tierra',
    accentColor: 'ambar',
    fontFamily: 'cormorant',
    titleSize: 'large',
    titleWeight: 'bold',
  },

  // --- LÁMINA 02: Las cuatro cremas — Producto diferenciado por maridaje ---
  {
    id: 'slide-cafe-02',
    kickerLeft: 'CUATRO CREMAS DE MESA',
    kickerRight: 'BATIDO EN FRÍO 48H',
    badge: 'COLECCIÓN DE BARRA · FORMATOS 25G — 5 KG',
    title: 'Pequeñas creaciones para una gran taza.',
    subtitle: 'Cuatro expresiones de miel cruda micro-cristalizada, formuladas por maridaje:',
    blocks: [
      {
        id: 'bc2',
        type: 'items',
        items: [
          {
            title: 'MIEL VIRGEN CON TROCITO DE PANAL',
            desc: 'Miel virgen cruda con trozo de panal natural intacto. Maridaje: té negro, infusiones de flor y bollería fina.',
          },
          {
            title: 'CREMA CON AVELLANA CHILENA TOSTADA Y MOLIDA',
            desc: 'Avellana nativa tostada y molida en frío. Maridaje: cappuccino, chai especiado y tostadas.',
          },
          {
            title: 'CREMA CON NIBS DE CACAO CRUDO (SANTANDER)',
            desc: 'Nibs de cacao crudo puro de Santander (Colombia). Maridaje: espresso, mocaccino y café filtrado.',
          },
          {
            title: 'CREMA CON POLEN FLORAL',
            desc: 'Polen floral seleccionado en micro-grano. Maridaje: té verde, yogurt natural y bowls matinales.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl // Alianzas Gastronómicas',
    footerRight: 'LÍNEA BARRA',
    theme: 'tierra',
    accentColor: 'oro',
    fontFamily: 'cormorant',
  },

  // --- LÁMINA 03: Protocolo de barra — Estándar técnico de servicio ---
  {
    id: 'slide-cafe-03',
    kickerLeft: 'ESTÁNDAR DE BARRA',
    kickerRight: 'PARÁMETROS TÉCNICOS',
    badge: 'PROTOCOLO DE SERVICIO // EMULSIÓN & TEMPERATURA',
    title: 'Reglas de servicio en barra de especialidad.',
    subtitle: 'Preservación de enzimas activas y disolución perfecta:',
    blocks: [
      {
        id: 'bc3',
        type: 'items',
        items: [
          {
            title: 'LÍMITE TÉRMICO ACTIVO: 40°C',
            desc: 'Verter siempre tras texturizar la leche. Protege la invertasa viva del néctar.',
          },
          {
            title: 'CONSERVACIÓN 15°C – 25°C',
            desc: 'Rango técnico entre pedidos para mantener la enzima invertasa activa.',
          },
          {
            title: 'SOLUBILIDAD INSTANTÁNEA',
            desc: 'Dispersión homogénea en Chemex, V60, cold brew y aeropress sin agitación forzada.',
          },
          {
            title: 'TRIADA DE FORMATOS DE ALTA GAMA',
            desc: 'Frasco 25g para cata en mesa, 150g para vitrina retail y pote 500g para emulsión barista.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl',
    footerRight: 'PROTOCOLO',
    theme: 'obsidiana',
    accentColor: 'oro',
    fontFamily: 'cormorant',
  },

  // --- LÁMINA 04: Kits y escalas — Propuesta comercial clara con MOQ ---
  {
    id: 'slide-cafe-04',
    kickerLeft: 'KITS DE ACTIVACIÓN',
    kickerRight: 'DOS MODELOS + A MEDIDA',
    badge: 'CONDICIONES COMERCIALES B2B // PILOTO → ESCALADO',
    title: 'Dos modalidades para integrar el bosque nativo.',
    subtitle: 'Activación inmediata sin imposición de dogmas, con láminas A6 de mesa y trazabilidad:',
    blocks: [
      {
        id: 'bc4',
        type: 'metrics',
        items: [
          {
            label: 'PILOTO MESA & BARRA ($69.000 NETO)',
            value: '48×25g (mesa/cata) + 2×500g (barra filtrados) + láminas A6 de mesa con QR ST-CATA y fidelización.',
          },
          {
            label: 'RESERVA BARRA & VITRINA ($249.000 NETO)',
            value: '144×25g + 18×150g (vitrina) + 6×500g (emulsión) + display madera nativa + activación en mapa público.',
          },
          {
            label: 'PROPUESTA A MEDIDA / CO-BRANDING',
            value: 'Volúmenes a granel (baldes 5kg/10kg), múltiples sucursales o partidas botánicas bajo consulta directa.',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl // Despacho sin costo RM sobre $900.000 netos',
    footerRight: 'KITS',
    theme: 'obsidiana',
    accentColor: 'ambar',
    fontFamily: 'mono',
  },

  // --- LÁMINA 05: ST-CATA en mesa — Diferenciador de experiencia del comensal ---
  {
    id: 'slide-cafe-05',
    kickerLeft: 'PROTOCOLO ST-CATA',
    kickerRight: 'EXPERIENCIA EN SALA',
    badge: 'CIENCIA SENSORIAL // 60 SEGUNDOS · N ≥ 30 SESIONES',
    title: 'Tu comensal valida el origen desde la mesa.',
    subtitle: 'Instrumento de cata de 60 segundos con acreditación automática de puntos:',
    blocks: [
      {
        id: 'bc5',
        type: 'comparison',
        left: {
          tag: '[BARISTA]',
          title: 'PENDÓN QR',
          subtitle: 'Activación del punto',
          lines: [
            'Código QR único del local en cada mesa.',
            'El comensal ingresa con WhatsApp o correo.',
            'Sin descargas ni contraseñas.',
          ],
        },
        right: {
          tag: '[COMENSAL]',
          title: 'CATA GUIADA',
          subtitle: 'Protocolo ST-CATA',
          lines: [
            '3 pares semánticos: Suave–Intenso, Dulce–Ácido, Líquida–Cremosa.',
            'Chips de sabor con orden aleatorio contra sesgos de posición.',
            '25 puntos acreditados automáticamente al perfil.',
          ],
        },
        sharedNote:
          'RESEÑA "DEGUSTACIÓN EN CAFETERÍA · [CIUDAD]" PUBLICADA EN TIENDA PARA MODERACIÓN EDITORIAL',
      },
    ],
    footerLeft: 'obrerayzangano.cl/club-legado-del-bosque',
    footerRight: 'ST-CATA',
    theme: 'selva',
    accentColor: 'esmeralda',
    fontFamily: 'cormorant',
  },

  // --- LÁMINA 06: Portal de activación — Cierre B2B con llamada directa ---
  {
    id: 'slide-cafe-06',
    kickerLeft: 'ALIANZA GASTRONÓMICA',
    kickerRight: 'ACCESO DIRECTO',
    badge: 'ACTIVACIÓN DEL CANAL // PRIMERA ENTREGA EN 5 DÍAS HÁBILES',
    title: 'Ingresa al circuito de origen.',
    subtitle: 'Tu cafetería como nodo de cata sensorial distribuida del bosque nativo de Chiloé:',
    blocks: [
      {
        id: 'bc6',
        type: 'portal',
        url: 'obrerayzangano.cl/alianzas/cafeterias',
        subtitle: 'Registro de aliados gastronómicos y activación de kit.',
        bullets: [
          'Dossier con lista de precios netos mayoristas sin intermediarios.',
          'Láminas A6 de mesa con QR ST-CATA (fidelización comensal desde el día 1).',
          'Soporte técnico y curva de vertido térmico (< 40°C) para baristas.',
          'Reposición con validador de stock y despacho preferente.',
          'Garantía técnica de 30 días para resguardo de temperatura y calidad.',
        ],
        callNote: 'SOLICITAR KIT PILOTO O PROPUESTA A MEDIDA ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl/alianzas/cafeterias',
    footerRight: 'ACTIVAR',
    theme: 'tierra',
    accentColor: 'oro',
    fontFamily: 'cormorant',
    titleSize: 'normal',
  },
];


export const PRESET_CLUB_LEGADO: SlideData[] = [
  {
    id: 'slide-club-01',
    kickerLeft: 'MEMBRESÍA LIBRE',
    kickerRight: 'DESDE 2004',
    badge: 'COMUNIDAD SOBERANA // SELVA VALDIVIANA',
    title: 'Un archivo vivo entre el bosque nativo y tu mesa.',
    subtitle: 'Al registrarte en la tienda formas parte del Club Legado del Bosque:',
    blocks: [
      {
        id: 'bcl1',
        type: 'items',
        items: [
          {
            title: 'REPOSICIÓN A TU MEDIDA',
            desc: 'Entrega periódica programada de tus floraciones nativas preferidas.',
          },
          {
            title: 'RESERVAS Y MICROLOTES',
            desc: 'Acceso preferente a recolecciones estacionales limitadas (Tiaca, Melí, Ulmo).',
          },
          {
            title: 'RETORNO CIRCULAR',
            desc: 'Devuelve tus frascos de vidrio vacíos y acumula saldo a favor para tus pedidos.',
          },
        ],
      },
    ],
    footerLeft: 'tienda.obrerayzangano.cl/club-legado-del-bosque',
    footerRight: 'CLUB LEGADO',
  },
  {
    id: 'slide-club-02',
    kickerLeft: 'TRAZABILIDAD QUÍMICA',
    kickerRight: 'NORMA CXS 12-1981',
    badge: 'PASAPORTE BOTÁNICO DE CADA FRASCO',
    title: 'Cada partida cuenta con respaldo documentado.',
    subtitle: 'Transparencia radical de cada recolección en el archipiélago de Chiloé:',
    blocks: [
      {
        id: 'bcl2',
        type: 'metrics',
        items: [
          {
            label: 'HUMEDAD BIOLÓGICA',
            value: '< 17.5% garantizada para preservar frescura y estabilidad.',
          },
          {
            label: 'CONDUCTIVIDAD ELÉCTRICA',
            value: '0.72 mS/cm representativa de suelos volcánicos de selva fría.',
          },
          {
            label: 'ANÁLISIS POLÍNICO',
            value: '> 85% polen nativo dominante verificado bajo microscopio.',
          },
          {
            label: 'HMF EN ENVASADO',
            value: '< 5 mg/kg (miel cruda jamás recalentada industrialmente).',
          },
        ],
      },
    ],
    footerLeft: 'obrerayzangano.cl',
    footerRight: 'PASAPORTE',
  },
  {
    id: 'slide-club-03',
    kickerLeft: 'REGISTRO DIRECTO',
    kickerRight: 'SIN COSTO DE ENTRADA',
    badge: 'ACREDITACIÓN DIGITAL INMEDIATA',
    title: 'Activa tu presencia en el Club Legado.',
    subtitle: 'Sin cobros periódicos forzados ni intermediarios comerciales:',
    blocks: [
      {
        id: 'bcl3',
        type: 'qr_code',
        destinationType: 'club',
        url: 'https://tienda.obrerayzangano.cl/club-legado-del-bosque',
        title: 'ACREDITACIÓN EN LÍNEA',
        subtitle: 'Escanea para unirte al club, programar tu reposición y recibir tus primeros sellos.',
      },
    ],
    footerLeft: 'obrerayzangano.cl/club-legado-del-bosque',
    footerRight: 'ACCESO',
  },
];

export const PRESET_STAND_FERIA: SlideData[] = [
  // --- LÁMINA 01: Tablero de Cata / Acrílico de Mesa (Stand & Degustación) ---
  {
    id: 'slide-feria-01',
    kickerLeft: 'ESTACIÓN DE DEGUSTACIÓN',
    kickerRight: 'CHILOÉ · 42°S',
    badge: 'CATA LIBRE DE AUTOR · BOSQUE NATIVO',
    title: 'Ritual de Cata en Vivo: Mieles Puras & Batidas en Frío.',
    subtitle: 'Degusta libremente con tu revolvedor de bambú y descubre el bosque nativo de Pureo.',
    theme: 'obsidiana',
    accentColor: 'oro',
    fontFamily: 'cormorant',
    titleSize: 'normal',
    blocks: [
      {
        id: 'b-feria-sensorial',
        type: 'sensorial',
        title: 'PERFIL DE CATA: CREMA CON AVELLANA CHILENA',
        axisLabels: ['Dulzura Enzimática', 'Tensión Ácida', 'Flora Nativa', 'Persistencia / Untuosidad'],
        sweetness: 4,
        acidity: 3,
        flora: 5,
        body: 5,
        crystallization: 'Microcristales sedosos · Batido en frío 48h',
        pairingNote: 'Gevuina avellana silvestre tostada y molida. Armoniza con café de especialidad y masa madre.',
      },
      {
        id: 'b-feria-qr',
        type: 'qr_code',
        destinationType: 'resena',
        url: 'https://obrerayzangano.cl/cata/feria',
        title: 'REGISTRO DE CATA & WALLET',
        subtitle: 'Apunta tu cámara para votar en la Nebulosa Sensorial y guardar tu Pase del Bosque en Apple o Google Wallet.',
      },
    ],
    footerLeft: 'obrerayzangano.cl/cata/feria',
    footerRight: 'STAND SOBERANO',
  },
  // --- LÁMINA 02: Tarjeta Técnica de Cadena de Frío ---
  {
    id: 'slide-feria-02',
    kickerLeft: 'PROTOCOLO BOTÁNICO',
    kickerRight: 'CADENA DE FRÍO',
    badge: 'ESTRUCTURA CRISTALINA VIVA',
    title: 'Nuestras cremas de miel requieren refrigeración (<14°C).',
    subtitle: 'Alimento vivo: el frío preserva la microestructura cristalina fina y la actividad enzimática.',
    theme: 'selva',
    accentColor: 'oro',
    fontFamily: 'cormorant',
    titleSize: 'normal',
    blocks: [
      {
        id: 'b-feria-items-frio',
        type: 'items',
        items: [
          {
            title: 'BATIDO EN FRÍO 48H',
            desc: 'Proceso mecánico continuo que guía la formación de microcristales sin calentar jamás el néctar.',
          },
          {
            title: 'CERO JARABES NI ADITIVOS',
            desc: '100% néctar silvestre de Chiloé y avellana chilena nativa (Gevuina avellana). Sin espesantes.',
          },
          {
            title: 'INVERTASA & ENZIMAS VIVAS',
            desc: 'Conserva el perfil biológico original del panal que la pasteurización comercial destruye.',
          },
        ],
      },
      {
        id: 'b-feria-portal-frio',
        type: 'portal',
        url: 'obrerayzangano.cl/ciencia',
        subtitle: 'Protocolo de estabilidad y análisis polínicos de laboratorio.',
        bullets: [
          'Mantener bajo 14°C para conservar su textura sedosa.',
          'Consumir pura con cuchara o sobre preparaciones tibias.',
          'Garantía de recolección en bosque templado lluvioso.',
        ],
        callNote: 'CONOCER EL RESPALDO CIENTÍFICO ->',
      },
    ],
    footerLeft: 'obrerayzangano.cl/ciencia',
    footerRight: 'CALIDAD CERTIFICADA',
  },
  // --- LÁMINA 03: Pase Digital Wallet & Fidelización ---
  {
    id: 'slide-feria-03',
    kickerLeft: 'EL LEGADO DEL BOSQUE',
    kickerRight: 'MEMBRESÍA DIGITAL',
    badge: 'APPLE & GOOGLE WALLET · PASE DE GUARDIÁN',
    title: 'Guarda tu Pase del Bosque en la pantalla de tu teléfono.',
    subtitle: 'Conecta con la colmena de Pureo y acumula sellos de origen en cada visita o feria:',
    theme: 'obsidiana',
    accentColor: 'oro',
    fontFamily: 'cormorant',
    titleSize: 'normal',
    blocks: [
      {
        id: 'b-feria-items-wallet',
        type: 'items',
        items: [
          {
            title: 'TIMBRES DE DEGUSTACIÓN',
            desc: 'Cada evaluación en mesones o tiendas aliadas suma sellos de fidelidad a tu credencial.',
          },
          {
            title: 'ACCESO RESERVADO A LOTES',
            desc: 'Prioridad de reserva en recolecciones estacionales limitadas antes de su apertura general.',
          },
          {
            title: 'TRAZABILIDAD EN TIEMPO REAL',
            desc: 'Tu pase se actualiza dinámicamente con floraciones activas y coordenadas del colmenar.',
          },
        ],
      },
      {
        id: 'b-feria-qr-wallet',
        type: 'qr_code',
        destinationType: 'club',
        url: 'https://obrerayzangano.cl/club-legado-del-bosque',
        title: 'INSTALAR PASE DIGITAL',
        subtitle: 'Escanea para descargar tu tarjeta oficial de Guardián en Apple Wallet o Google Wallet.',
      },
    ],
    footerLeft: 'obrerayzangano.cl/club-legado-del-bosque',
    footerRight: 'PASE DIGITAL',
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
      case 'qr_code':
        return `${block.title} ${block.subtitle ?? ''} ${block.batchCode ?? ''} ${block.url}`;
      case 'sensorial':
        return `${block.pairingNote ?? ''} ${block.crystallization ?? ''}`;
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

export interface RenderSlideOptions {
  aspectRatio?: SlideAspectRatio;
}

export async function renderSlideToCanvas(
  slide: SlideData,
  slideIndex: number,
  totalSlides: number,
  options?: RenderSlideOptions,
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignorar fallback
    }
  }

  const ratio = options?.aspectRatio || slide.aspectRatio || '4:5';
  const canvasWidth = ratio === '16:9' ? 1920 : CANVAS_WIDTH;
  const canvasHeight = ratio === '9:16' ? 1920 : ratio === '1:1' ? 1080 : ratio === '16:9' ? 1080 : 1350;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D');

  const themeConfig = resolveSlideTheme(slide.theme);
  const fontConfig = resolveSlideFontFamily(slide.fontFamily);
  const weightConfig = resolveTitleFontWeight(slide.titleWeight);
  const italicPrefix = slide.titleItalic ? 'italic ' : '';

  const BG_COLOR = themeConfig.bgHex;
  const CARD_COLOR = themeConfig.cardHex;
  const BORDER_COLOR = themeConfig.borderHex;
  const DIVIDER_COLOR = themeConfig.dividerHex;
  const TEXT_PRIMARY = themeConfig.textPrimaryHex;
  const TEXT_MUTED = themeConfig.textMutedHex;

  const { hex: resolvedAccent, mutedHex: resolvedMuted } = resolveAccentColor(slide.accentColor);
  const GOLD_ACCENT = resolvedAccent;
  const GOLD_MUTED = resolvedMuted;
  const isCentered = slide.alignment === 'center';

  // 1. Fondo de atmósfera
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Textura orgánica sutil
  for (let i = 0; i < 4000; i++) {
    const rx = Math.floor((Math.sin(i * 997) * 0.5 + 0.5) * canvasWidth);
    const ry = Math.floor((Math.cos(i * 613) * 0.5 + 0.5) * canvasHeight);
    if (themeConfig.isLight) {
      const val = 240 + (i % 8);
      ctx.fillStyle = `rgb(${val}, ${val - 1}, ${val - 2})`;
    } else {
      const val = 10 + (i % 8);
      ctx.fillStyle = `rgb(${val}, ${val + 1}, ${val})`;
    }
    ctx.fillRect(rx, ry, 1, 1);
  }

  // 3. Recuadro exterior (Omitido en Marco Zen)
  if (!slide.cleanFrame) {
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 55, canvasWidth - 110, canvasHeight - 110);
  }

  // 4. Header (Kickers y divisor)
  if (!slide.cleanFrame) {
    const { left: headerLeft, right: headerRight } = buildHeaderKicker(slide);
    ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
    if (headerLeft) {
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(headerLeft, 95, 105);
    }

    if (headerRight) {
      const rkW = ctx.measureText(headerRight).width;
      ctx.fillStyle = TEXT_MUTED;
      ctx.fillText(headerRight, canvasWidth - 95 - rkW, 105);
    }

    if (!slide.hideDividers && (headerLeft || headerRight)) {
      ctx.strokeStyle = DIVIDER_COLOR;
      ctx.beginPath();
      ctx.moveTo(95, 140);
      ctx.lineTo(canvasWidth - 95, 140);
      ctx.stroke();
    }
  }

  // 5. Footer (Divisor y aristas de pie)
  if (!slide.cleanFrame) {
    const hasFooterLeft = Boolean(slide.footerLeft && slide.footerLeft.trim());
    const hasExplicitFooterRight = slide.footerRight !== undefined && slide.footerRight.trim() !== '';
    const defaultSlideTag = `${String(slideIndex).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`;
    const slideTag = hasExplicitFooterRight ? slide.footerRight!.trim() : (slide.footerRight === '' ? '' : defaultSlideTag);

    if (!slide.hideDividers && (hasFooterLeft || Boolean(slideTag))) {
      ctx.strokeStyle = DIVIDER_COLOR;
      ctx.beginPath();
      ctx.moveTo(95, canvasHeight - 140);
      ctx.lineTo(canvasWidth - 95, canvasHeight - 140);
      ctx.stroke();
    }

    ctx.font = '500 21px "JetBrains Mono", ui-monospace, monospace';
    if (hasFooterLeft) {
      ctx.fillStyle = TEXT_MUTED;
      ctx.fillText(slide.footerLeft.trim(), 95, canvasHeight - 95);
    }

    if (slideTag) {
      const stW = ctx.measureText(slideTag).width;
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(slideTag, canvasWidth - 95 - stW, canvasHeight - 95);
    }
  }


  // 6. Badge superior
  if (slide.badge) {
    ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = GOLD_ACCENT;
    const bW = ctx.measureText(slide.badge).width;
    const bX = isCentered ? (canvasWidth - bW) / 2 : 95;
    ctx.fillText(slide.badge, bX, slide.cleanFrame ? 140 : 220);
  }

  // 7. Título principal (Escala tipográfica & Párrafos)
  const isLargeTitle = slide.titleSize === 'large';
  const isCompactTitle = slide.titleSize === 'compact';
  const titleFontSize = isLargeTitle ? 80 : isCompactTitle ? 52 : 66;
  const titleLineHeight = isLargeTitle ? 96 : isCompactTitle ? 66 : 80;
  ctx.font = `${italicPrefix}${weightConfig.canvasWeight} ${titleFontSize}px ${fontConfig.canvasFamily}`;
  ctx.fillStyle = TEXT_PRIMARY;
  const titleLines = wrapCanvasText(ctx, slide.title, canvasWidth - 190);
  let curY = slide.cleanFrame ? 190 : 295;
  for (const line of titleLines) {
    if (!line) {
      curY += 28; // Salto visible de párrafo por doble enter en título
      continue;
    }
    const tW = ctx.measureText(line).width;
    const lineX = isCentered ? (canvasWidth - tW) / 2 : 95;
    ctx.fillText(line, lineX, curY);
    curY += titleLineHeight;
  }

  // 8. Subtítulo (Párrafos)
  if (slide.subtitle) {
    ctx.font = `italic 34px ${fontConfig.canvasFamily}`;
    ctx.fillStyle = TEXT_MUTED;
    const subLines = wrapCanvasText(ctx, slide.subtitle, canvasWidth - 190);
    curY += 10;
    for (const sline of subLines) {
      if (!sline) {
        curY += 20; // Salto visible de párrafo por doble enter en subtítulo
        continue;
      }
      const slW = ctx.measureText(sline).width;
      const sLineX = isCentered ? (canvasWidth - slW) / 2 : 95;
      ctx.fillText(sline, sLineX, curY);
      curY += 44;
    }
  }

  curY = Math.max(curY + 30, slide.cleanFrame ? 340 : 470);

  // 9. Renderizado dinámico de bloques abstractos
  for (const block of slide.blocks) {
    if (block.type === 'paragraph') {
      const cardY = curY;
      const align = block.alignment || slide.alignment || 'left';
      const scale = block.scale || 'normal';
      const fontSize = scale === 'compact' ? 24 : scale === 'large' ? 36 : 30;
      const lineHeight = scale === 'compact' ? 36 : scale === 'large' ? 52 : 44;

      const validLines = block.lines.filter((l) => l.trim().length > 0);
      const emptyLines = block.lines.length - validLines.length;
      const computedH =
        (block.header ? 65 : 25) +
        validLines.length * lineHeight +
        emptyLines * 24 +
        (block.accentNote ? 55 : 20) +
        30;
      const cardH = Math.min(Math.max(computedH, 180), 590);
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      if (block.header) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        const hW = ctx.measureText(block.header).width;
        const hX =
          align === 'center'
            ? 95 + (canvasWidth - 190 - hW) / 2
            : align === 'right'
            ? canvasWidth - 140 - hW
            : 140;
        ctx.fillText(block.header, hX, cardY + 50);
      }

      ctx.font = `400 ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
      let lineY = cardY + (block.header ? 105 : 60);
      for (const mline of block.lines) {
        if (!mline || !mline.trim()) {
          lineY += 24;
          continue;
        }
        ctx.fillStyle = mline.includes('->') ? GOLD_ACCENT : TEXT_PRIMARY;
        const mW = ctx.measureText(mline).width;
        const lineX =
          align === 'center'
            ? 95 + (canvasWidth - 190 - mW) / 2
            : align === 'right'
            ? canvasWidth - 140 - mW
            : 140;
        ctx.fillText(mline, lineX, lineY);
        lineY += lineHeight;
      }
      if (block.accentNote) {
        ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        const aW = ctx.measureText(block.accentNote).width;
        const aX =
          align === 'center'
            ? 95 + (canvasWidth - 190 - aW) / 2
            : align === 'right'
            ? canvasWidth - 140 - aW
            : 140;
        ctx.fillText(block.accentNote, aX, lineY + 10);
      }
      curY += cardH + 20;

    } else if (block.type === 'items') {
      const cardY = curY;
      const validItems = block.items.filter((i) => i.title || i.desc);
      const computedH = Math.max(validItems.length * 120 + 30, 180);
      const cardH = Math.min(computedH, 620);
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      let py = cardY + 45;
      for (const item of block.items) {
        ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(item.title, 135, py);

        ctx.font = '400 26px "Source Sans 3", system-ui, sans-serif';
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.fillText(item.desc, 135, py + 38);

        ctx.strokeStyle = DIVIDER_COLOR;
        ctx.beginPath();
        ctx.moveTo(135, py + 95);
        ctx.lineTo(canvasWidth - 135, py + 95);
        ctx.stroke();

        py += 135;
      }
      curY += cardH + 20;
    } else if (block.type === 'metrics') {
      const cardY = curY;
      const validMetrics = block.items.filter((m) => m.label || m.value);
      const computedH = Math.max(validMetrics.length * 105 + 30, 180);
      const cardH = Math.min(computedH, 630);
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      let my = cardY + 40;
      for (const m of block.items) {
        ctx.font = '600 23px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(m.label, 135, my);

        ctx.font = '400 25px "Source Sans 3", system-ui, sans-serif';
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.fillText(m.value, 135, my + 35);

        ctx.strokeStyle = DIVIDER_COLOR;
        ctx.beginPath();
        ctx.moveTo(135, my + 88);
        ctx.lineTo(canvasWidth - 135, my + 88);
        ctx.stroke();

        my += 115;
      }
      curY += cardH + 20;
    } else if (block.type === 'comparison') {
      const cardY = curY;
      const cardH = 590;
      const colW = Math.floor((canvasWidth - 190 - 40) / 2);

      // Columna izquierda
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, colW, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, colW, cardH);

      ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(block.left.tag, 130, cardY + 45);

      ctx.font = `600 40px ${fontConfig.canvasFamily}`;
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.fillText(block.left.title, 130, cardY + 95);

      if (block.left.subtitle) {
        ctx.font = `italic 24px ${fontConfig.canvasFamily}`;
        ctx.fillStyle = GOLD_MUTED;
        ctx.fillText(block.left.subtitle, 130, cardY + 140);
      }

      ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_PRIMARY;
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
      const col2X = 95 + colW + 40;
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(col2X, cardY, colW, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(col2X, cardY, colW, cardH);

      ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(block.right.tag, col2X + 35, cardY + 45);

      ctx.font = `600 40px ${fontConfig.canvasFamily}`;
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.fillText(block.right.title, col2X + 35, cardY + 95);

      if (block.right.subtitle) {
        ctx.font = `italic 24px ${fontConfig.canvasFamily}`;
        ctx.fillStyle = GOLD_MUTED;
        ctx.fillText(block.right.subtitle, col2X + 35, cardY + 140);
      }

      ctx.font = '400 23px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_PRIMARY;
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
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.fillText(b, 130, cy);
        cy += 50;
      }

      const boxY = Math.max(cy + 30, 840);
      const boxH = 240;
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, boxY, canvasWidth - 190, boxH);
      ctx.strokeStyle = GOLD_ACCENT;
      ctx.strokeRect(95, boxY, canvasWidth - 190, boxH);

      ctx.font = '600 42px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(block.url, 140, boxY + 65);

      ctx.font = '400 30px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.fillText(block.subtitle, 140, boxY + 125);

      if (block.callNote) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = TEXT_MUTED;
        ctx.fillText(block.callNote, 140, boxY + 175);
      }
      curY += boxH + 40;
    } else if (block.type === 'quote') {
      const cardY = curY;
      const align = block.alignment || slide.alignment || 'left';
      const scale = block.scale || 'normal';
      const quoteFontSize = scale === 'compact' ? 36 : scale === 'large' ? 52 : 44;
      const quoteLineHeight = scale === 'compact' ? 46 : scale === 'large' ? 64 : 55;

      const cardH = 340;
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      ctx.font = `italic ${quoteFontSize}px ${fontConfig.canvasFamily}`;
      ctx.fillStyle = TEXT_PRIMARY;
      const qlines = wrapCanvasText(ctx, `«${block.quote}»`, canvasWidth - 280);
      let qy = cardY + 80;
      for (const ql of qlines) {
        const qW = ctx.measureText(ql).width;
        const qX =
          align === 'center'
            ? 95 + (canvasWidth - 190 - qW) / 2
            : align === 'right'
            ? canvasWidth - 140 - qW
            : 140;
        ctx.fillText(ql, qX, qy);
        qy += quoteLineHeight;
      }
      if (block.attribution) {
        ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_ACCENT;
        const attText = `— ${block.attribution}`;
        const attW = ctx.measureText(attText).width;
        const attX =
          align === 'center'
            ? 95 + (canvasWidth - 190 - attW) / 2
            : align === 'right'
            ? canvasWidth - 140 - attW
            : 140;
        ctx.fillText(attText, attX, qy + 20);
      }
      curY += cardH + 20;

    } else if (block.type === 'qr_code') {
      const cardY = curY;
      const cardH = 340;
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = GOLD_ACCENT;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      // Renderizar texto a la izquierda
      ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(block.title || 'CÓDIGO DE ORIGEN & CATA', 140, cardY + 55);

      ctx.font = '400 24px "Source Sans 3", system-ui, sans-serif';
      ctx.fillStyle = TEXT_PRIMARY;
      const subLines = wrapCanvasText(
        ctx,
        block.subtitle || 'Apunta la cámara de tu teléfono para validar lote y registrar tu percepción sensorial.',
        canvasWidth - 520,
      );
      let subY = cardY + 100;
      for (const sl of subLines.slice(0, 3)) {
        ctx.fillText(sl, 140, subY);
        subY += 34;
      }

      if (block.batchCode) {
        ctx.font = '600 20px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = GOLD_MUTED;
        ctx.fillText(`LOTE: ${block.batchCode}`, 140, cardY + 225);
      }

      ctx.font = '400 18px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = TEXT_MUTED;
      ctx.fillText(block.url, 140, cardY + 265);

      // Renderizar el QR a la derecha
      const qrSize = 210;
      const qrX = canvasWidth - 95 - qrSize - 35;
      const qrY = cardY + (cardH - qrSize) / 2;

      // Renderizar el contenedor QR y patrones en canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // Dibujar patrones de esquina del código QR (Finder patterns)
      const drawFinder = (fx: number, fy: number, s = 48) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, fy, s, s);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(fx + 7, fy + 7, s - 14, s - 14);
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx + 14, fy + 14, s - 28, s - 28);
      };
      drawFinder(qrX + 8, qrY + 8);
      drawFinder(qrX + qrSize - 56, qrY + 8);
      drawFinder(qrX + 8, qrY + qrSize - 56);

      // Micro-bloque de lectura en canvas
      const qrTopLabel = block.title ? block.title.slice(0, 16) : 'ESCANEAR QR';
      const qrSubLabel = block.batchCode ? `LOTE ${block.batchCode}` : 'ACCESO DIRECTO';
      ctx.font = '700 12px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = '#000000';
      const qtlW = ctx.measureText(qrTopLabel).width;
      ctx.fillText(qrTopLabel, qrX + (qrSize - qtlW) / 2, qrY + 115);

      ctx.font = '400 10px "JetBrains Mono", ui-monospace, monospace';
      const qslW = ctx.measureText(qrSubLabel).width;
      ctx.fillText(qrSubLabel, qrX + (qrSize - qslW) / 2, qrY + 132);

      curY += cardH + 20;
    } else if (block.type === 'sensorial') {
      const cardY = curY;
      const cardH = 340;
      ctx.fillStyle = CARD_COLOR;
      ctx.fillRect(95, cardY, canvasWidth - 190, cardH);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(95, cardY, canvasWidth - 190, cardH);

      const sensorialTitle = block.title || 'PERFIL SENSORIAL & CATA';
      ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText(sensorialTitle, 140, cardY + 50);

      const axes = block.axisLabels || ['Dulzura', 'Acidez', 'Flora', 'Cuerpo'];
      const metrics = [
        { label: axes[0] || 'Dulzura', val: block.sweetness },
        { label: axes[1] || 'Acidez', val: block.acidity },
        { label: axes[2] || 'Flora', val: block.flora },
        { label: axes[3] || 'Cuerpo', val: block.body },
      ];


      let barY = cardY + 95;
      for (const m of metrics) {
        ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.fillText(m.label, 140, barY);

        // Barra de 5 segmentos
        const barStartX = 420;
        const totalSegments = 5;
        const segWidth = 55;
        for (let s = 1; s <= totalSegments; s++) {
          ctx.fillStyle = s <= m.val ? GOLD_ACCENT : DIVIDER_COLOR;
          ctx.fillRect(barStartX + (s - 1) * (segWidth + 8), barY - 16, segWidth, 14);
        }
        barY += 36;
      }

      if (block.pairingNote) {
        ctx.strokeStyle = DIVIDER_COLOR;
        ctx.beginPath();
        ctx.moveTo(140, cardY + 250);
        ctx.lineTo(canvasWidth - 140, cardY + 250);
        ctx.stroke();

        ctx.font = `italic 22px ${fontConfig.canvasFamily}`;
        ctx.fillStyle = GOLD_ACCENT;
        ctx.fillText(`Maridaje: ${block.pairingNote}`, 140, cardY + 285);
      }

      curY += cardH + 20;
    }
  }

  return canvas;
}
