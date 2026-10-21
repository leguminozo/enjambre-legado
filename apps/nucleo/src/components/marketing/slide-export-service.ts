/**
 * slide-export-service.ts — Salida única de la pieza.
 *
 * Todos los formatos salen por aquí. El motor de lámina y el motor audiovisual
 * llaman a la misma función, así una imagen y un video dicen lo mismo sobre
 * cómo se generó la pieza.
 */

import {
  buildExportPlan,
  resolveExportAvailability,
  type ExportTarget,
  type VideoExportPath,
} from './export-targets';
import { hashString } from './prng';
import { MOTION_SCOPES, type MotionScope } from './slide-motion';
import {
  DEFAULT_SUBSTRATE_PARAMS,
  IdentitySubstrateSimulation,
  type SubstratePaletteId,
} from './identity-substrate-engine';
import { createSequenceRenderer, DEFAULT_SEQUENCE_FPS, type SequenceSource } from './slide-sequence';
import { exportVideo } from './slide-video-export';
import { type SlideAspectRatio, type SlideData, type SlideTheme } from './slide-studio-core';

export interface ExportRequest {
  slides: SlideData[];
  target: ExportTarget;
  scope: MotionScope;
  aspectRatio: SlideAspectRatio;
  seed: number;
  baseName?: string;
  /** Sustrato generativo para el alcance elegido. */
  substrateCanvas?: HTMLCanvasElement | null;
  advanceSubstrate?: () => void;
  reduced?: boolean;
  onProgress?: (progress: number) => void;
  isCancelled?: () => boolean;
}

export interface ExportOutcome {
  blob: Blob;
  filename: string;
  mime: string;
  path: 'canvas' | 'webcodecs' | 'mediarecorder' | 'data';
  /** El archivo sale igual si se repite con la misma receta. */
  deterministic: boolean;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo preparar la imagen.'));
      },
      mime,
      quality,
    );
  });
}

function buildRecipe(request: ExportRequest): string {
  const spec = MOTION_SCOPES[request.scope];
  const payload = {
    version: 1,
    marca: 'Enjambre Legado',
    alcance: request.scope,
    proporcion: request.aspectRatio,
    fps: DEFAULT_SEQUENCE_FPS,
    duracionPorLaminaMs: spec.slideDurationMs,
    transicionMs: spec.transitionMs,
    semilla: request.seed,
    laminas: request.slides.map((slide) => ({
      titulo: slide.title,
      tema: slide.theme ?? 'obsidiana',
      acento: slide.accentColor ?? 'oro',
      bloques: slide.blocks.length,
    })),
  };
  const checksum = hashString(
    `${request.seed}|${request.scope}|${request.aspectRatio}|${JSON.stringify(payload.laminas)}`,
  )
    .toString(16)
    .padStart(8, '0');

  return JSON.stringify({ ...payload, checksum }, null, 2);
}

function buildModel(request: ExportRequest): string {
  return JSON.stringify(
    {
      version: 1,
      alcance: request.scope,
      semilla: request.seed,
      proporcion: request.aspectRatio,
      laminas: request.slides,
    },
    null,
    2,
  );
}

function createOutputCanvas(aspectRatio: SlideAspectRatio): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  if (aspectRatio === '9:16') {
    canvas.width = 1080;
    canvas.height = 1920;
  } else if (aspectRatio === '1:1') {
    canvas.width = 1080;
    canvas.height = 1080;
  } else if (aspectRatio === '16:9') {
    canvas.width = 1920;
    canvas.height = 1080;
  } else {
    canvas.width = 1080;
    canvas.height = 1350;
  }
  return canvas;
}

/**
 * La atmósfera de la lámina manda sobre el sustrato: el fondo vivo toma la
 * paleta del tema, no la suya.
 */
const THEME_TO_SUBSTRATE: Record<SlideTheme, SubstratePaletteId> = {
  obsidiana: 'obsidiana',
  marfil: 'marfil',
  selva: 'selva',
  tierra: 'cobre',
};

interface SubstrateHandle {
  canvas: HTMLCanvasElement;
  advance: () => void;
}

/**
 * Levanta el sustrato vivo para el alcance pedido.
 * Solo existe cuando el alcance lo pide: el alcance estático es la forma
 * legal del archivo y no lleva fondo generado.
 */
function createSubstrate(
  width: number,
  height: number,
  theme: SlideTheme,
  seed: number,
): SubstrateHandle {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const simulation = new IdentitySubstrateSimulation(canvas, {
    ...DEFAULT_SUBSTRATE_PARAMS,
    seed,
    palette: THEME_TO_SUBSTRATE[theme] ?? 'ambar',
    transparentBackground: true,
  });

  return { canvas, advance: () => simulation.step() };
}

/**
 * Exporta la pieza en el formato pedido.
 * Lanza si el formato no está disponible en este equipo.
 */
export async function exportSlidePiece(request: ExportRequest): Promise<ExportOutcome> {
  const availability = resolveExportAvailability(request.target);
  if (!availability.available) {
    throw new Error(availability.reason || 'Este formato no está disponible en este equipo.');
  }

  const plan = buildExportPlan({
    target: request.target,
    total: request.slides.length,
    baseName: request.baseName,
  });

  if (request.target.kind === 'data') {
    const payload =
      request.target.id === 'recipe' ? buildRecipe(request) : buildModel(request);
    return {
      blob: new Blob([payload], { type: 'application/json' }),
      filename: plan.filename,
      mime: 'application/json',
      path: 'data',
      deterministic: true,
    };
  }

  const canvas = createOutputCanvas(request.aspectRatio);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de salida.');

  const spec = MOTION_SCOPES[request.scope];
  const substrate =
    request.substrateCanvas || spec.substrateOpacity <= 0
      ? null
      : createSubstrate(
          canvas.width,
          canvas.height,
          request.slides[0]?.theme ?? 'obsidiana',
          request.seed,
        );

  const substrateCanvas = request.substrateCanvas ?? substrate?.canvas ?? null;
  const advanceSubstrate = request.advanceSubstrate ?? substrate?.advance;

  if (request.target.kind === 'raster') {
    const renderer = createSequenceRenderer({
      slides: request.slides,
      aspectRatio: request.aspectRatio,
      scope: request.scope,
      seed: request.seed,
      reduced: request.reduced,
      substrateCanvas,
      advanceSubstrate,
    });

    await renderer.renderFrame(ctx, 0);
    request.onProgress?.(1);

    const blob = await canvasToBlob(
      canvas,
      request.target.mime,
      request.target.lossy ? 0.92 : undefined,
    );

    return {
      blob,
      filename: plan.filename,
      mime: request.target.mime,
      path: 'canvas',
      deterministic: true,
    };
  }

  // Video
  const source: SequenceSource = {
    slides: request.slides,
    aspectRatio: request.aspectRatio,
    scope: request.scope,
    seed: request.seed,
    reduced: request.reduced,
    substrateCanvas,
    advanceSubstrate,
  };
  const renderer = createSequenceRenderer(source);

  const videoPath: VideoExportPath = availability.path;
  const result = await exportVideo({
    canvas,
    width: canvas.width,
    height: canvas.height,
    fps: renderer.fps,
    durationMs: renderer.durationMs,
    format: request.target.id === 'webm' ? 'webm' : 'mp4',
    drawFrame: async (index) => {
      await renderer.renderFrame(ctx, index);
    },
    onProgress: request.onProgress,
    isCancelled: request.isCancelled,
  });

  void videoPath;

  return {
    blob: result.blob,
    filename: plan.filename,
    mime: result.mime,
    path: result.path,
    deterministic: result.deterministic,
  };
}

/** Descarga un archivo ya preparado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
