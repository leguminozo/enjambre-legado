'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Sliders,
  AlertTriangle,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle2,
  LayoutGrid,
  FlaskConical,
  Trees,
  Columns2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ImmersiveModal, toast, cn } from '@enjambre/ui';

// ============================================================================
// TIPOS Y MODELO DE DATOS
// ============================================================================

export type SlideLayoutType =
  | 'manifesto'
  | 'pillars'
  | 'metrics'
  | 'botany'
  | 'comparison'
  | 'cta'
  | 'custom';

export interface SlideData {
  id: string;
  badge: string;
  kickerLeft: string;
  kickerRight: string;
  title: string;
  subtitle: string;
  layoutType: SlideLayoutType;

  // Manifesto layout
  manifestoHeader?: string;
  manifestoLines?: string[];

  // Pillars layout
  pillars?: Array<{ title: string; desc: string }>;

  // Metrics layout
  metrics?: Array<{ param: string; desc: string }>;

  // Botany layout
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

  // Custom layout
  customCardTitle?: string;
  customCardContent?: string;

  footerLeft: string;
}

// ============================================================================
// PRESETS EDITORIALES DE ALTA GAMA (CANÓNICOS)
// ============================================================================

const PRESET_MANIFIESTO: SlideData[] = [
  {
    id: 'slide-01',
    badge: 'DOCUMENTO DE ORIGEN // SELVA VALDIVIANA',
    kickerLeft: 'REGISTRO BOTÁNICO',
    kickerRight: 'PARALELO 42°S',
    title: 'La miel cruda es la memoria química del bosque nativo.',
    subtitle: 'Un archivo biológico de floración estacional y enzimas intactas.',
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
];

const PRESET_ULMO_ESTACIONAL: SlideData[] = [
  {
    id: 'slide-ulmo-01',
    badge: 'FLORACIÓN DE VERANO // CUENCA DE CHILOÉ',
    kickerLeft: 'FLORA NATIVA',
    kickerRight: 'Eucryphia cordifolia',
    title: 'Floración del Ulmo: el cenit estival del dosel.',
    subtitle: 'Néctar denso y cristalización mantecosa del bosque templado.',
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
];

// ============================================================================
// GUARDIÁN DE MARCA: REGLAS ANTI-SLOP Y VOCABULARIO SAGRADO
// ============================================================================

interface BrandIssue {
  severity: 'error' | 'warning';
  title: string;
  description: string;
  suggestion?: string;
}

function checkBrandCompliance(slide: SlideData): BrandIssue[] {
  const issues: BrandIssue[] = [];
  const fullText = [
    slide.badge,
    slide.kickerLeft,
    slide.kickerRight,
    slide.title,
    slide.subtitle,
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
    slide.customCardTitle ?? '',
    slide.customCardContent ?? '',
  ].join(' ');

  // 1. Regla Inviolable: Prohibido "cosecha"
  if (/\bcosech/i.test(fullText)) {
    issues.push({
      severity: 'error',
      title: 'Vocabulario sagrado: Uso de "cosecha" prohibido',
      description: 'En el estándar de la marca se utiliza siempre "recolección" o "recolectado" (la acción de obtener néctar y miel del bosque nativo).',
      suggestion: 'Reemplazar por "recolección", "recolectado" o "recolección estacional".',
    });
  }

  // 2. Anti-Slop: Contraste reactivo negativo
  if (/\b(a diferencia de|no hacemos|no usamos engaños|frente a la industria|a diferencia del mercado)\b/i.test(fullText)) {
    issues.push({
      severity: 'error',
      title: 'Anti-Slop: Contraste reactivo detectado',
      description: 'Prohibido definir la marca por comparación negativa con otros. La redacción debe ser 100% asertiva, fáctica y ontológica.',
      suggestion: 'Enfocarse en hechos comprobables propios (ej. "0% pasteurización térmica", "Extracción en frío < 35°C").',
    });
  }

  // 3. Inmune al envejecimiento: Fechas relativas
  if (/\b\d+\s*años\b/i.test(fullText) && !/desde/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Envejecimiento temporal: Número relativo de años',
      description: 'Frases como "22 años de trayectoria" quedan obsoletas al cambiar de año calendario.',
      suggestion: 'Usar anclaje histórico absoluto como "Desde 2004" o "Fundado en 2004".',
    });
  }

  // 4. Cero jerga de ONG/Hippie
  if (/\b(biocultural|custodia|oficio)\b/i.test(fullText)) {
    issues.push({
      severity: 'warning',
      title: 'Tono de lujo: Jerga de ONG / Abnegación',
      description: 'Evitar "biocultural" en UI pública; evitar "custodia" (usar "trayectoria", "legado" o "vínculo"); evitar "oficio" (proyectar maestría y alta técnica apícola).',
      suggestion: 'Utilizar "maestría apícola", "estándar de origen", "presencia" o "legado territorial".',
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

// ============================================================================
// RENDERIZADO CANVAS EN ALTA RESOLUCIÓN (1080 × 1350)
// ============================================================================

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

function wrapCanvasText(
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

async function renderSlideToCanvas(
  slide: SlideData,
  slideIndex: number,
  totalSlides: number,
): Promise<HTMLCanvasElement> {
  // Asegura que las fuentes web estén listas
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

  // Paleta exacta
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

  // 7. Título principal (Cormorant Garamond)
  ctx.font = '600 66px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = TEXT_IVORY;
  const titleLines = wrapCanvasText(ctx, slide.title, CANVAS_WIDTH - 190);
  let curY = 295;
  for (const line of titleLines) {
    ctx.fillText(line, 95, curY);
    curY += 80;
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

  if (slide.layoutType === 'manifesto') {
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
    // Bullets superiores
    ctx.font = '400 32px "Source Sans 3", system-ui, sans-serif';
    let cy = curY;
    for (const b of slide.ctaBullets ?? []) {
      ctx.fillStyle = GOLD_ACCENT;
      ctx.fillText('•', 95, cy);
      ctx.fillStyle = TEXT_IVORY;
      ctx.fillText(b, 130, cy);
      cy += 50;
    }

    // Caja Soberana
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
  } else {
    // Custom layout
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

// ============================================================================
// COMPONENTE PRINCIPAL: SocialSlideStudioModal
// ============================================================================

export interface SocialSlideStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSlideStudioModal({ open, onClose }: SocialSlideStudioModalProps) {
  const [slides, setSlides] = useState<SlideData[]>(PRESET_MANIFIESTO);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const activeSlide = slides[activeSlideIndex] ?? slides[0];

  // Reglas de marca en vivo
  const brandIssues = useMemo(() => {
    return checkBrandCompliance(activeSlide);
  }, [activeSlide]);

  // Actualizador inmutable
  const updateActiveSlide = useCallback((partial: Partial<SlideData>) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (!updated[activeSlideIndex]) return prev;
      updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...partial };
      return updated;
    });
  }, [activeSlideIndex]);

  // Operaciones de carrusel
  const handleAddSlide = () => {
    const newSlide: SlideData = {
      id: `slide-custom-${Date.now()}`,
      badge: 'NUEVA LÁMINA EDITORIAL',
      kickerLeft: 'ORIGEN SOBERANO',
      kickerRight: 'CHILOÉ · 42°S',
      title: 'Título de la nueva lámina editorial.',
      subtitle: 'Bajada descriptiva en tipografía Cormorant Garamond.',
      layoutType: 'manifesto',
      manifestoHeader: 'ESTÁNDAR DE MAESTRÍA',
      manifestoLines: [
        'Enunciado fáctico comprobable.',
        'Detalle técnico de extracción en frío.',
        'Trazabilidad directa al colmenar de origen.',
      ],
      footerLeft: 'obrerayzangano.cl',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    const clone = { ...activeSlide, id: `slide-copy-${Date.now()}` };
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, clone);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe contener al menos 1 lámina.');
      return;
    }
    const updated = slides.filter((_, idx) => idx !== activeSlideIndex);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const handleMoveSlide = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const temp = updated[activeSlideIndex];
    updated[activeSlideIndex] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSlides(updated);
    setActiveSlideIndex(targetIdx);
  };

  // Exportar PNG actual
  const handleExportSinglePNG = async () => {
    try {
      setIsExporting(true);
      const canvas = await renderSlideToCanvas(activeSlide, activeSlideIndex + 1, slides.length);
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Error al generar imagen de la lámina.');
          setIsExporting(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `oyz_slide_${String(activeSlideIndex + 1).padStart(2, '0')}.png`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.success(`Lámina ${activeSlideIndex + 1} exportada en 1080×1350 px.`);
      }, 'image/png');
    } catch {
      setIsExporting(false);
      toast.error('No se pudo procesar la exportación gráfica.');
    }
  };

  // Exportar todas las láminas
  const handleExportAllPNGs = async () => {
    try {
      setIsExporting(true);
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = await renderSlideToCanvas(slide, i + 1, slides.length);
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `oyz_slide_${String(i + 1).padStart(2, '0')}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
            setTimeout(resolve, 300);
          }, 'image/png');
        });
      }
      setIsExporting(false);
      toast.success(`Carrusel completo (${slides.length} láminas) exportado con éxito.`);
    } catch {
      setIsExporting(false);
      toast.error('Error durante la descarga del carrusel.');
    }
  };

  // Copiar Caption para Instagram/X
  const handleCopyCaption = () => {
    const caption = [
      'La miel cruda no es un producto estandarizado: es la memoria biológica y química del bosque nativo de Chiloé.',
      '',
      'Desde 2004 en el paralelo 42° Sur, documentamos y analizamos cada recolección estacional bajo normas auditables de pureza:',
      '• 0% pasteurización térmica (< 35 °C en todo el ciclo).',
      '• Actividad enzimática (diastasa e invertasa) intacta certificada por laboratorio.',
      '• Filtrado mecánico grueso que retiene cera virgen y polen nativo.',
      '• Trazabilidad por código de lote y balance de cuenca forestal.',
      '',
      'En obrerayzangano.cl puedes acceder al registro analítico completo, monografías botánicas y a la asignación de Miel Cruda y Crema de Miel batida en frío.',
      '',
      '#LaObreraYElZangano #Chiloe #MielCruda #PurezaDeOrigen #SelvaValdiviana #EstandarDeOrigen',
    ].join('\n');

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    toast.success('Caption editorial copiado al portapapeles.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Estudio Editorial RRSS // La Obrera y el Zángano"
      title="Diseñador y Exportador de Láminas (4:5 · 1080×1350)"
      size="full"
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSlides(PRESET_MANIFIESTO);
                setActiveSlideIndex(0);
                toast.success('Preset de Manifiesto Científico cargado.');
              }}
            >
              Preset: Manifiesto (6)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSlides(PRESET_ULMO_ESTACIONAL);
                setActiveSlideIndex(0);
                toast.success('Preset de Ulmo Estacional cargado.');
              }}
            >
              Preset: Ulmo (3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              onClick={handleCopyCaption}
            >
              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              Copiar Caption
            </button>
            <button
              type="button"
              disabled={isExporting}
              className="btn btn-outline btn-sm flex items-center gap-1.5"
              onClick={handleExportSinglePNG}
            >
              <Download size={14} />
              Descargar Lámina Actual (PNG)
            </button>
            <button
              type="button"
              disabled={isExporting}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={handleExportAllPNGs}
            >
              <Layers size={14} />
              {isExporting ? 'Generando...' : `Descargar Carrusel (${slides.length})`}
            </button>
          </div>
        </div>
      }
      aside={
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-amber-400" />
              <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                Vista Previa WYSIWYG (1080×1350)
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>

          {/* Lienzo visual DOM 4:5 */}
          <div className="flex-1 flex items-center justify-center p-2">
            <div
              className={cn(
                'w-full max-w-[340px] aspect-[4/5] rounded-xl border border-[#262C27] bg-[#0A0B0A] text-[#F2EEE6] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none',
              )}
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="text-[#D6AA5C] truncate">
                    LA OBRERA Y EL ZÁNGANO // {activeSlide.kickerLeft}
                  </span>
                  <span className="text-[#8E9690]">{activeSlide.kickerRight}</span>
                </div>
                <div className="h-px bg-[#1A201B] w-full" />
              </div>

              {/* Contenido central */}
              <div className="my-auto space-y-2 py-1">
                <div className="text-[8px] font-mono text-[#D6AA5C] tracking-wide uppercase">
                  {activeSlide.badge}
                </div>
                <h3 className="font-existencial text-base leading-tight font-semibold text-[#F2EEE6]">
                  {activeSlide.title}
                </h3>
                {activeSlide.subtitle && (
                  <p className="font-existencial italic text-[10px] leading-snug text-[#8E9690]">
                    {activeSlide.subtitle}
                  </p>
                )}

                {/* Previsualización específica por layout */}
                <div className="rounded border border-[#262C27] bg-[#101310] p-2 space-y-1 mt-1 text-[8px]">
                  {activeSlide.layoutType === 'manifesto' && (
                    <>
                      <div className="text-[7px] font-mono text-[#D6AA5C]">
                        {activeSlide.manifestoHeader || 'ESTÁNDAR DE EXTRACCIÓN SOBERANA'}
                      </div>
                      <div className="space-y-0.5 text-[#F2EEE6] opacity-90 text-[7.5px] leading-tight">
                        {activeSlide.manifestoLines?.slice(0, 4).map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeSlide.layoutType === 'pillars' && (
                    <div className="space-y-1">
                      {activeSlide.pillars?.slice(0, 3).map((p, i) => (
                        <div key={i} className="border-b border-[#1A201B] pb-0.5">
                          <span className="font-mono text-[#D6AA5C] text-[7px] block">{p.title}</span>
                          <span className="text-[7.5px] text-[#F2EEE6] opacity-80">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSlide.layoutType === 'metrics' && (
                    <div className="space-y-1">
                      {activeSlide.metrics?.slice(0, 3).map((m, i) => (
                        <div key={i} className="border-b border-[#1A201B] pb-0.5">
                          <span className="font-mono text-[#D6AA5C] text-[7px] block">{m.param}</span>
                          <span className="text-[7.5px] text-[#F2EEE6] opacity-80">{m.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSlide.layoutType === 'botany' && (
                    <div className="space-y-1">
                      {activeSlide.botanyBlocks?.slice(0, 2).map((b, i) => (
                        <div key={i} className="border-b border-[#1A201B] pb-0.5">
                          <span className="font-mono text-[#D6AA5C] text-[7px] block">{b.title}</span>
                          <span className="text-[7.5px] text-[#F2EEE6] opacity-80 line-clamp-2">{b.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSlide.layoutType === 'comparison' && (
                    <div className="grid grid-cols-2 gap-1 text-[7px]">
                      <div className="p-1 rounded bg-[#0A0B0A] border border-[#262C27]">
                        <span className="text-[#D6AA5C] font-mono text-[6px] block">
                          {activeSlide.comparisonLeft?.tag}
                        </span>
                        <strong className="block font-existencial text-[9px] text-[#F2EEE6]">
                          {activeSlide.comparisonLeft?.title}
                        </strong>
                      </div>
                      <div className="p-1 rounded bg-[#0A0B0A] border border-[#262C27]">
                        <span className="text-[#D6AA5C] font-mono text-[6px] block">
                          {activeSlide.comparisonRight?.tag}
                        </span>
                        <strong className="block font-existencial text-[9px] text-[#F2EEE6]">
                          {activeSlide.comparisonRight?.title}
                        </strong>
                      </div>
                    </div>
                  )}

                  {activeSlide.layoutType === 'cta' && (
                    <div className="p-1.5 rounded border border-[#D6AA5C] bg-[#0A0B0A] text-center space-y-0.5">
                      <div className="font-mono text-[10px] text-[#D6AA5C] font-semibold">
                        {activeSlide.ctaUrl || 'obrerayzangano.cl'}
                      </div>
                      <div className="text-[7px] text-[#F2EEE6] opacity-80">
                        {activeSlide.ctaSubtitle}
                      </div>
                    </div>
                  )}

                  {activeSlide.layoutType === 'custom' && (
                    <div className="space-y-0.5">
                      <div className="text-[7px] font-mono text-[#D6AA5C]">
                        {activeSlide.customCardTitle}
                      </div>
                      <div className="text-[7.5px] text-[#F2EEE6] opacity-90 line-clamp-4">
                        {activeSlide.customCardContent}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-1.5">
                <div className="h-px bg-[#1A201B] w-full" />
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="text-[#8E9690]">{activeSlide.footerLeft}</span>
                  <span className="text-[#D6AA5C]">
                    {String(activeSlideIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validador de Reglas de Marca */}
          <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className={brandIssues.length === 0 ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="text-xs font-medium text-foreground">
                Guardián de Marca (Anti-Slop)
              </span>
            </div>

            {brandIssues.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 size={13} />
                <span>Estándar editorial verificado: Cero slop, tono soberano y fechas absolutas.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {brandIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'text-xs p-2 rounded-lg border space-y-0.5',
                      issue.severity === 'error'
                        ? 'bg-destructive/10 border-destructive/20 text-destructive'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                    )}
                  >
                    <div className="font-medium flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      {issue.title}
                    </div>
                    <div className="text-[11px] opacity-90">{issue.description}</div>
                    {issue.suggestion && (
                      <div className="text-[11px] font-mono opacity-80 pt-0.5">
                        👉 {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tira de Navegación de Láminas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              Secuencia del Carrusel ({slides.length} láminas)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => handleMoveSlide('left')}
                className="btn btn-ghost btn-xs h-7 px-2"
                title="Mover lámina a la izquierda"
              >
                <ArrowLeft size={13} />
              </button>
              <button
                type="button"
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() => handleMoveSlide('right')}
                className="btn btn-ghost btn-xs h-7 px-2"
                title="Mover lámina a la derecha"
              >
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={handleDuplicateSlide}
                className="btn btn-ghost btn-xs h-7 px-2"
                title="Duplicar lámina actual"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                disabled={slides.length <= 1}
                onClick={handleDeleteSlide}
                className="btn btn-ghost btn-xs h-7 px-2 text-destructive hover:text-destructive"
                title="Eliminar lámina actual"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0 flex items-center gap-1.5',
                  activeSlideIndex === idx
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold shadow-sm shadow-amber-500/10'
                    : 'border-border bg-card hover:bg-surface-raised text-muted-foreground',
                )}
              >
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-[10px] opacity-70 truncate max-w-[80px]">
                  {s.kickerLeft}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={handleAddSlide}
              className="px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-amber-400/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Formulario de Campos de la Lámina */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                Kicker Izquierdo (Encabezado)
              </label>
              <input
                type="text"
                className="input-field w-full text-xs font-mono"
                value={activeSlide.kickerLeft}
                onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                Kicker Derecho (Anclaje)
              </label>
              <input
                type="text"
                className="input-field w-full text-xs font-mono"
                value={activeSlide.kickerRight}
                onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                Tipo de Estructura Visual
              </label>
              <select
                className="input-field w-full text-xs"
                value={activeSlide.layoutType}
                onChange={(e) =>
                  updateActiveSlide({ layoutType: e.target.value as SlideLayoutType })
                }
              >
                <option value="manifesto">Manifiesto / Declaración</option>
                <option value="pillars">4 Pilares de Origen</option>
                <option value="metrics">Tabla de Laboratorio</option>
                <option value="botany">Botánica y Bosque</option>
                <option value="comparison">Dos Expresiones (Líquida / Crema)</option>
                <option value="cta">Portal Soberano / Acceso</option>
                <option value="custom">Personalizado Libre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
              Insignia / Categoría Superior
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={activeSlide.badge}
              onChange={(e) => updateActiveSlide({ badge: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
              Título Principal (Cormorant Garamond)
            </label>
            <textarea
              rows={2}
              className="input-field w-full text-sm font-existencial"
              value={activeSlide.title}
              onChange={(e) => updateActiveSlide({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
              Subtítulo / Bajada Descriptiva
            </label>
            <input
              type="text"
              className="input-field w-full text-xs"
              value={activeSlide.subtitle}
              onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
            />
          </div>

          {/* Campos contextuales según el Layout seleccionado */}
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Sliders size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-foreground">
                Configuración del Cuerpo: {activeSlide.layoutType.toUpperCase()}
              </span>
            </div>

            {activeSlide.layoutType === 'manifesto' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Encabezado de la Tarjeta
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.manifestoHeader ?? ''}
                    onChange={(e) => updateActiveSlide({ manifestoHeader: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Líneas de la Declaración (una por renglón)
                  </label>
                  <textarea
                    rows={6}
                    className="input-field w-full text-xs"
                    value={(activeSlide.manifestoLines ?? []).join('\n')}
                    onChange={(e) =>
                      updateActiveSlide({ manifestoLines: e.target.value.split('\n') })
                    }
                  />
                </div>
              </div>
            )}

            {activeSlide.layoutType === 'pillars' && (
              <div className="space-y-3">
                {(activeSlide.pillars ?? []).map((pilar, pidx) => (
                  <div key={pidx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título del Pilar (Mono)"
                      className="input-field w-full text-xs font-mono"
                      value={pilar.title}
                      onChange={(e) => {
                        const nextPillars = [...(activeSlide.pillars ?? [])];
                        nextPillars[pidx] = { ...nextPillars[pidx], title: e.target.value };
                        updateActiveSlide({ pillars: nextPillars });
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Descripción fáctica"
                      className="input-field w-full text-xs"
                      value={pilar.desc}
                      onChange={(e) => {
                        const nextPillars = [...(activeSlide.pillars ?? [])];
                        nextPillars[pidx] = { ...nextPillars[pidx], desc: e.target.value };
                        updateActiveSlide({ pillars: nextPillars });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeSlide.layoutType === 'metrics' && (
              <div className="space-y-3">
                {(activeSlide.metrics ?? []).map((m, midx) => (
                  <div key={midx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Parámetro Analítico (Mono)"
                      className="input-field w-full text-xs font-mono"
                      value={m.param}
                      onChange={(e) => {
                        const nextMetrics = [...(activeSlide.metrics ?? [])];
                        nextMetrics[midx] = { ...nextMetrics[midx], param: e.target.value };
                        updateActiveSlide({ metrics: nextMetrics });
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Criterio / Norma"
                      className="input-field w-full text-xs"
                      value={m.desc}
                      onChange={(e) => {
                        const nextMetrics = [...(activeSlide.metrics ?? [])];
                        nextMetrics[midx] = { ...nextMetrics[midx], desc: e.target.value };
                        updateActiveSlide({ metrics: nextMetrics });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeSlide.layoutType === 'botany' && (
              <div className="space-y-3">
                {(activeSlide.botanyBlocks ?? []).map((b, bidx) => (
                  <div key={bidx} className="space-y-1">
                    <input
                      type="text"
                      placeholder="Especie o Estrato (Mono)"
                      className="input-field w-full text-xs font-mono"
                      value={b.title}
                      onChange={(e) => {
                        const nextBlocks = [...(activeSlide.botanyBlocks ?? [])];
                        nextBlocks[bidx] = { ...nextBlocks[bidx], title: e.target.value };
                        updateActiveSlide({ botanyBlocks: nextBlocks });
                      }}
                    />
                    <textarea
                      rows={2}
                      placeholder="Detalle botánico y regulación de biomasa"
                      className="input-field w-full text-xs"
                      value={b.desc}
                      onChange={(e) => {
                        const nextBlocks = [...(activeSlide.botanyBlocks ?? [])];
                        nextBlocks[bidx] = { ...nextBlocks[bidx], desc: e.target.value };
                        updateActiveSlide({ botanyBlocks: nextBlocks });
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Nota al Pie del Bloque Botánico
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.botanyFooterNote ?? ''}
                    onChange={(e) => updateActiveSlide({ botanyFooterNote: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeSlide.layoutType === 'comparison' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Panel Izquierdo */}
                  <div className="space-y-2 p-3 rounded-lg border border-border bg-card/60">
                    <span className="text-[11px] font-mono text-amber-400 block font-semibold">
                      Panel Izquierdo (Estado 01)
                    </span>
                    <input
                      type="text"
                      placeholder="Tag (ej. [ESTADO 01])"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.comparisonLeft?.tag ?? ''}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonLeft: {
                            tag: e.target.value,
                            title: activeSlide.comparisonLeft?.title ?? '',
                            subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                            bullets: activeSlide.comparisonLeft?.bullets ?? [],
                          },
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Título (ej. MIEL CRUDA)"
                      className="input-field w-full text-xs font-existencial"
                      value={activeSlide.comparisonLeft?.title ?? ''}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonLeft: {
                            tag: activeSlide.comparisonLeft?.tag ?? '',
                            title: e.target.value,
                            subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                            bullets: activeSlide.comparisonLeft?.bullets ?? [],
                          },
                        })
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Puntos descriptivos (uno por renglón)"
                      className="input-field w-full text-xs"
                      value={(activeSlide.comparisonLeft?.bullets ?? []).join('\n')}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonLeft: {
                            tag: activeSlide.comparisonLeft?.tag ?? '',
                            title: activeSlide.comparisonLeft?.title ?? '',
                            subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                            bullets: e.target.value.split('\n'),
                          },
                        })
                      }
                    />
                  </div>

                  {/* Panel Derecho */}
                  <div className="space-y-2 p-3 rounded-lg border border-border bg-card/60">
                    <span className="text-[11px] font-mono text-amber-400 block font-semibold">
                      Panel Derecho (Estado 02)
                    </span>
                    <input
                      type="text"
                      placeholder="Tag (ej. [ESTADO 02])"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.comparisonRight?.tag ?? ''}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonRight: {
                            tag: e.target.value,
                            title: activeSlide.comparisonRight?.title ?? '',
                            subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                            bullets: activeSlide.comparisonRight?.bullets ?? [],
                          },
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Título (ej. CREMA DE MIEL)"
                      className="input-field w-full text-xs font-existencial"
                      value={activeSlide.comparisonRight?.title ?? ''}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonRight: {
                            tag: activeSlide.comparisonRight?.tag ?? '',
                            title: e.target.value,
                            subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                            bullets: activeSlide.comparisonRight?.bullets ?? [],
                          },
                        })
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Puntos descriptivos (uno por renglón)"
                      className="input-field w-full text-xs"
                      value={(activeSlide.comparisonRight?.bullets ?? []).join('\n')}
                      onChange={(e) =>
                        updateActiveSlide({
                          comparisonRight: {
                            tag: activeSlide.comparisonRight?.tag ?? '',
                            title: activeSlide.comparisonRight?.title ?? '',
                            subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                            bullets: e.target.value.split('\n'),
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Nota Compartida al Pie (Mono)
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.comparisonSharedNote ?? ''}
                    onChange={(e) => updateActiveSlide({ comparisonSharedNote: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeSlide.layoutType === 'cta' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="URL del Portal (ej. obrerayzangano.cl)"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.ctaUrl ?? ''}
                    onChange={(e) => updateActiveSlide({ ctaUrl: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Subtítulo del Portal"
                    className="input-field w-full text-xs"
                    value={activeSlide.ctaSubtitle ?? ''}
                    onChange={(e) => updateActiveSlide({ ctaSubtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Puntos Clave del Portal (uno por renglón)
                  </label>
                  <textarea
                    rows={4}
                    className="input-field w-full text-xs"
                    value={(activeSlide.ctaBullets ?? []).join('\n')}
                    onChange={(e) => updateActiveSlide({ ctaBullets: e.target.value.split('\n') })}
                  />
                </div>
              </div>
            )}

            {activeSlide.layoutType === 'custom' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Título de la Tarjeta Libre
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.customCardTitle ?? ''}
                    onChange={(e) => updateActiveSlide({ customCardTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Contenido Libre de la Tarjeta
                  </label>
                  <textarea
                    rows={6}
                    className="input-field w-full text-xs"
                    value={activeSlide.customCardContent ?? ''}
                    onChange={(e) => updateActiveSlide({ customCardContent: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ImmersiveModal>
  );
}
