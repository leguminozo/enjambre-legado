/**
 * slide-sequence.ts — Recorrido de la pieza cuadro a cuadro.
 *
 * Convierte un carrusel en una línea de tiempo y sabe dibujar cada cuadro.
 * Es el puente entre el modelo (láminas) y el archivo (imagen o video).
 *
 * La lámina se dibuja una vez por índice y se cachea: el movimiento se
 * compone sobre esa capa, no sobre el texto. Por eso exportar video no cuesta
 * N veces el costo de exportar la imagen.
 */

import { composeFrame } from './slide-compositor';
import {
  MOTION_SCOPES,
  buildTimeline,
  clamp01,
  type MotionScope,
} from './slide-motion';
import {
  renderSlideToCanvas,
  type SlideAspectRatio,
  type SlideData,
} from './slide-studio-core';

export interface SequenceSource {
  slides: SlideData[];
  aspectRatio: SlideAspectRatio;
  scope: MotionScope;
  seed: number;
  /** El sistema pidió movimiento reducido. */
  reduced?: boolean;
  /** Sustrato generativo ya animado. */
  substrateCanvas?: HTMLCanvasElement | null;
  /** Avanza el sustrato un cuadro. */
  advanceSubstrate?: () => void;
}

export interface SequenceRenderer {
  fps: number;
  durationMs: number;
  totalFrames: number;
  /** Dibuja el cuadro pedido en el contexto destino. */
  renderFrame: (ctx: CanvasRenderingContext2D, frameIndex: number) => Promise<void>;
}

export const DEFAULT_SEQUENCE_FPS = 30;

export function createSequenceRenderer(source: SequenceSource): SequenceRenderer {
  const spec = MOTION_SCOPES[source.scope];
  const fps = DEFAULT_SEQUENCE_FPS;
  const durationMs = spec.slideDurationMs * Math.max(1, source.slides.length);
  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
  const timeline = buildTimeline(spec, source.slides.length);
  const reduced = source.reduced ?? false;

  const slideCache = new Map<number, HTMLCanvasElement>();

  async function slideCanvasAt(index: number): Promise<HTMLCanvasElement> {
    const cached = slideCache.get(index);
    if (cached) return cached;
    const slide = source.slides[index];
    if (!slide) throw new Error('La lámina solicitada no existe.');
    const canvas = await renderSlideToCanvas(slide, index + 1, source.slides.length, {
      aspectRatio: source.aspectRatio,
    });
    slideCache.set(index, canvas);
    return canvas;
  }

  /**
   * La disolvencia necesita la lámina anterior en pantalla. En corte seco no:
   * el corte es un corte.
   */
  const keepsPreviousOnScreen = spec.transition === 'disolvencia';

  return {
    fps,
    durationMs,
    totalFrames,
    renderFrame: async (ctx, frameIndex) => {
      source.advanceSubstrate?.();

      const timestampMs = (frameIndex / fps) * 1000;
      const slotIndex = Math.min(
        source.slides.length - 1,
        Math.max(0, Math.floor(timestampMs / spec.slideDurationMs)),
      );
      const slot = timeline[slotIndex];
      const elapsedMs = timestampMs - (slot?.startMs ?? 0);

      const transitionProgress =
        slot && slot.transitionInMs > 0 ? clamp01(elapsedMs / slot.transitionInMs) : 0;

      const slideCanvas = await slideCanvasAt(slotIndex);

      let fromCanvas: HTMLCanvasElement | null = null;
      if (keepsPreviousOnScreen && transitionProgress > 0 && transitionProgress < 1 && slotIndex > 0) {
        fromCanvas = await slideCanvasAt(slotIndex - 1);
      }

      composeFrame(ctx.canvas, {
        slideCanvas,
        substrateCanvas: source.substrateCanvas ?? null,
        fromCanvas,
        scope: source.scope,
        spec,
        elapsedMs,
        transitionProgress,
        seed: source.seed,
        reduced,
        substrateOpacity: spec.substrateOpacity,
      });
    },
  };
}

export interface StaticRenderOptions {
  aspectRatio: SlideAspectRatio;
  scope?: MotionScope;
  seed?: number;
  substrateCanvas?: HTMLCanvasElement | null;
  reduced?: boolean;
}

/**
 * Dibuja una lámina como imagen fija: revelada por completo, sin transición.
 * Es el camino que usan los formatos de imagen.
 */
export async function renderStaticSlide(
  ctx: CanvasRenderingContext2D,
  slide: SlideData,
  index: number,
  total: number,
  options: StaticRenderOptions,
): Promise<void> {
  const scope = options.scope ?? 'estatico';
  const spec = MOTION_SCOPES[scope];
  const slideCanvas = await renderSlideToCanvas(slide, index + 1, total, {
    aspectRatio: options.aspectRatio,
  });

  composeFrame(ctx.canvas, {
    slideCanvas,
    substrateCanvas: options.substrateCanvas ?? null,
    scope,
    spec,
    elapsedMs: Number.MAX_SAFE_INTEGER,
    transitionProgress: 0,
    seed: options.seed ?? 0,
    reduced: options.reduced ?? false,
    substrateOpacity: spec.substrateOpacity,
  });
}
