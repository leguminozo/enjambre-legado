/**
 * export-targets.ts — Regla común de formatos de salida.
 *
 * Esta tabla es la ley de salida del estudio y la comparten los dos motores:
 * el generador de láminas y el generador audiovisual. Si un motor inventa un
 * formato propio, la regla queda rota.
 *
 * Tres familias:
 *   raster  Imagen fija (PNG / JPG / WebP). Un frame.
 *   video   Secuencia temporal (MP4 / WebM). Requiere motor de video.
 *   data    Modelo y receta (JSON). Sin pixels: con memoria.
 */

import type { MotionScope } from './slide-motion';

export type ExportFormatId =
  | 'png'
  | 'jpg'
  | 'webp'
  | 'mp4'
  | 'webm'
  | 'json'
  | 'recipe';

export type ExportKind = 'raster' | 'video' | 'data';

export type ExportEngine = 'canvas' | 'webcodecs' | 'mediarecorder' | 'none';

export interface ExportTarget {
  id: ExportFormatId;
  kind: ExportKind;
  label: string;
  /** Descripción en voz de casa. Sin jerga de medio. */
  description: string;
  mime: string;
  extension: string;
  engine: ExportEngine;
  /** Soporta canal alfa (transparencia). */
  alpha: boolean;
  /** Comprime con pérdida (el peso manda sobre la fidelidad). */
  lossy: boolean;
  /** El mismo modelo produce el mismo archivo, byte a byte. */
  deterministic: boolean;
  /** Alcances de movimiento donde aplica. */
  scopes: MotionScope[];
  order: number;
}

export const EXPORT_TARGETS: readonly ExportTarget[] = [
  {
    id: 'png',
    kind: 'raster',
    label: 'PNG',
    description: 'Imagen sin pérdida con fondo opaco. La forma de archivo de la marca.',
    mime: 'image/png',
    extension: 'png',
    engine: 'canvas',
    alpha: false,
    lossy: false,
    deterministic: true,
    scopes: ['estatico', 'elegante', 'rupturista'],
    order: 10,
  },
  {
    id: 'jpg',
    kind: 'raster',
    label: 'JPG',
    description: 'Imagen liviana para mensajería. Sin transparencia.',
    mime: 'image/jpeg',
    extension: 'jpg',
    engine: 'canvas',
    alpha: false,
    lossy: true,
    deterministic: true,
    scopes: ['estatico', 'elegante', 'rupturista'],
    order: 20,
  },
  {
    id: 'webp',
    kind: 'raster',
    label: 'WebP',
    description: 'Imagen liviana con transparencia. Para web y piezas flotantes.',
    mime: 'image/webp',
    extension: 'webp',
    engine: 'canvas',
    alpha: true,
    lossy: false,
    deterministic: true,
    scopes: ['estatico', 'elegante', 'rupturista'],
    order: 30,
  },
  {
    id: 'mp4',
    kind: 'video',
    label: 'MP4',
    description: 'Video para Reels, TikTok y Histories. Se arma cuadro a cuadro.',
    mime: 'video/mp4',
    extension: 'mp4',
    engine: 'webcodecs',
    alpha: false,
    lossy: true,
    deterministic: true,
    scopes: ['elegante', 'rupturista'],
    order: 40,
  },
  {
    id: 'webm',
    kind: 'video',
    label: 'WebM',
    description: 'Video abierto para web. Alternativa para piezas que se publican en página.',
    mime: 'video/webm',
    extension: 'webm',
    engine: 'webcodecs',
    alpha: false,
    lossy: true,
    deterministic: true,
    scopes: ['elegante', 'rupturista'],
    order: 50,
  },
  {
    id: 'json',
    kind: 'data',
    label: 'Modelo',
    description: 'La pieza entera en texto. Se vuelve a abrir y se sigue editando.',
    mime: 'application/json',
    extension: 'json',
    engine: 'none',
    alpha: false,
    lossy: false,
    deterministic: true,
    scopes: ['estatico', 'elegante', 'rupturista'],
    order: 60,
  },
  {
    id: 'recipe',
    kind: 'data',
    label: 'Receta',
    description:
      'Semilla, alcance y parámetros con los que se generó la pieza. Sirve para reproducirla idéntica.',
    mime: 'application/json',
    extension: 'recipe.json',
    engine: 'none',
    alpha: false,
    lossy: false,
    deterministic: true,
    scopes: ['estatico', 'elegante', 'rupturista'],
    order: 70,
  },
] as const;

export function listExportTargets(scope?: MotionScope): ExportTarget[] {
  const all = [...EXPORT_TARGETS].sort((a, b) => a.order - b.order);
  if (!scope) return all;
  return all.filter((target) => target.scopes.includes(scope));
}

export function resolveExportTarget(id?: string): ExportTarget {
  const found = EXPORT_TARGETS.find((target) => target.id === id);
  return found ?? EXPORT_TARGETS[0];
}

// ── Detección de capacidades ──────────────────────────────────────────────

export type VideoExportPath = 'webcodecs' | 'mediarecorder' | 'none';

export interface ExportAvailability {
  available: boolean;
  /** Camino efectivo cuando el destino es video. */
  path: VideoExportPath;
  /** Motivo en voz de casa cuando no está disponible. */
  reason: string;
}

function hasWebCodecs(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

function hasMediaRecorder(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  return typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

function hasCanvasEncoding(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement('canvas') === 'object';
}

/**
 * Camino de salida de video disponible en este dispositivo.
 *   webcodecs    Cuadro a cuadro, exacto y reproducible (Chrome, Edge, Firefox, Safari 16.4+).
 *   mediarecorder Grabación en vivo. Funciona en más equipos, pero el tiempo manda.
 *   none         Sin salida de video: solo imagen y modelo.
 */
export function detectVideoExportPath(): VideoExportPath {
  if (hasWebCodecs()) return 'webcodecs';
  if (hasMediaRecorder()) return 'mediarecorder';
  return 'none';
}

export function resolveExportAvailability(target: ExportTarget): ExportAvailability {
  if (target.kind === 'data') {
    return { available: true, path: 'none', reason: '' };
  }

  if (target.kind === 'raster') {
    if (!hasCanvasEncoding()) {
      return { available: false, path: 'none', reason: 'Este equipo no permite preparar imágenes.' };
    }
    if (target.id === 'webp' && !supportsWebpEncoding()) {
      return {
        available: false,
        path: 'none',
        reason: 'Este equipo no prepara WebP. Usa PNG o JPG.',
      };
    }
    return { available: true, path: 'none', reason: '' };
  }

  const path = detectVideoExportPath();
  if (path === 'none') {
    return {
      available: false,
      path: 'none',
      reason: 'Este equipo no arma video. Exporta la imagen y el modelo.',
    };
  }
  if (path === 'mediarecorder') {
    return {
      available: true,
      path,
      reason:
        'Este equipo graba en vivo: el video puede durar un poco más o menos de lo pedido.',
    };
  }
  return { available: true, path, reason: '' };
}

let webpSupport: boolean | null = null;

function supportsWebpEncoding(): boolean {
  if (webpSupport !== null) return webpSupport;
  if (typeof document === 'undefined') {
    webpSupport = false;
    return webpSupport;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webpSupport;
}

// ── Plan de exportación ────────────────────────────────────────────────────

export interface ExportPlan {
  target: ExportTarget;
  filename: string;
  mime: string;
  extension: string;
  kind: ExportKind;
  /** Video: hay que recorrer la línea de tiempo cuadro a cuadro. */
  requiresTimeline: boolean;
  /** Video: camino real de codificación. */
  videoPath: VideoExportPath;
  /** Video: si el archivo es reproducible byte a byte. */
  deterministic: boolean;
}

export interface ExportPlanInput {
  target: ExportTarget;
  /** Índice de la pieza (0-based). */
  index?: number;
  total?: number;
  /** Nombre base de la pieza. */
  baseName?: string;
}

/**
 * Construye el plan de salida. Ambos motores llaman a esta función: es el
 * único lugar donde se decide nombre, mime y camino.
 */
export function buildExportPlan(input: ExportPlanInput): ExportPlan {
  const { target } = input;
  const index = input.index ?? 0;
  const total = input.total ?? 1;
  const base = (input.baseName ?? 'oyz_lamina').replace(/[^\w.-]+/g, '_');

  const suffix = total > 1 ? `_${String(index + 1).padStart(2, '0')}` : '';
  const filename = `${base}${suffix}.${target.extension}`;

  const availability = resolveExportAvailability(target);
  const videoPath = target.kind === 'video' ? availability.path : 'none';

  return {
    target,
    filename,
    mime: target.mime,
    extension: target.extension,
    kind: target.kind,
    requiresTimeline: target.kind === 'video',
    videoPath,
    deterministic: target.deterministic && videoPath !== 'mediarecorder',
  };
}

/** Etiqueta corta para mostrar en el selector de formato. */
export function describeExportTarget(target: ExportTarget): string {
  const flags: string[] = [];
  if (target.alpha) flags.push('con transparencia');
  if (target.lossy) flags.push('liviano');
  if (target.kind === 'video') flags.push('movimiento');
  if (target.kind === 'data') flags.push('editable');
  if (flags.length === 0) return target.label;
  return `${target.label} · ${flags.join(' · ')}`;
}
