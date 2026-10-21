/**
 * slide-compositor.ts — Composición de un cuadro de la pieza.
 *
 * Tres capas, en orden:
 *   1. Lámina   composición editorial (ya renderizada, opaca).
 *   2. Sustrato arte generativo, mezclado encima (screen en oscuro, no en claro).
 *   3. Efectos  transición y deformación, sobre el cuadro ya compuesto.
 *
 * El compositor no sabe de negocio: recibe lienzos y un alcance, y devuelve
 * un cuadro. Todo lo que el alcance exige vive en el registro de efectos.
 */

import {
  listEffects,
  resolveLayerState,
  type EffectFrame,
  type SlideLayerState,
} from './slide-effects';
import { MOTION_SCOPES, type MotionScope, type MotionSpec } from './slide-motion';

export type SubstrateBlend = 'screen' | 'lighter' | 'overlay' | 'source-over';

export interface CompositeInput {
  /** Lámina ya renderizada (opaca). */
  slideCanvas: HTMLCanvasElement;
  /** Arte generativo sobre la pieza. Opcional. */
  substrateCanvas?: HTMLCanvasElement | null;
  /** Lámina anterior, para transiciones. */
  fromCanvas?: HTMLCanvasElement | null;
  scope?: MotionScope;
  spec?: MotionSpec;
  /** ms dentro de la lámina actual. */
  elapsedMs?: number;
  /** 0..1 de la transición de entrada. 0 = sin transición. */
  transitionProgress?: number;
  seed?: number;
  reduced?: boolean;
  substrateOpacity?: number;
  substrateBlend?: SubstrateBlend;
  /** Fuerza el fondo visible bajo la lámina cuando la lámina no es opaca. */
  backgroundColor?: string;
}

export interface CompositeResult {
  width: number;
  height: number;
  /** Alcance efectivamente aplicado. */
  scope: MotionScope;
  /** Si el cuadro quedó en movimiento reducido. */
  reduced: boolean;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawLayerWithBands(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  state: SlideLayerState,
  width: number,
  height: number,
): void {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.translate(centerX + state.offsetX, centerY + state.offsetY);
  if (state.rotation !== 0) ctx.rotate(state.rotation);
  if (state.scale !== 1) ctx.scale(state.scale, state.scale);
  ctx.translate(-centerX, -centerY);

  if (!state.bands || state.bands.length === 0) {
    ctx.drawImage(source, 0, 0, width, height);
    ctx.restore();
    return;
  }

  for (const band of state.bands) {
    const reveal = Math.min(1, Math.max(0, band.reveal));
    if (reveal <= 0) continue;

    ctx.save();
    ctx.beginPath();
    const revealedTop = band.top + band.height * (1 - reveal);
    ctx.rect(band.offsetX, revealedTop, width, band.height * reveal + 1);
    ctx.clip();
    ctx.drawImage(source, 0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Compone un cuadro completo. El lienzo destino se dimensiona automáticamente
 * a partir de la lámina.
 */
export function composeFrame(
  target: HTMLCanvasElement,
  input: CompositeInput,
): CompositeResult {
  const width = input.slideCanvas.width;
  const height = input.slideCanvas.height;

  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;

  const ctx = target.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D');

  const scope = input.scope ?? 'estatico';
  const spec = input.spec ?? MOTION_SCOPES[scope];
  const reduced = input.reduced ?? false;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (input.backgroundColor) {
    ctx.fillStyle = input.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  ctx.restore();

  // 1. Lámina con las transformaciones del alcance.
  const frame: EffectFrame = {
    ctx,
    canvas: target,
    width,
    height,
    elapsedMs: input.elapsedMs ?? 0,
    transitionProgress: input.transitionProgress ?? 0,
    scope,
    spec,
    seed: input.seed ?? 0,
    reduced,
    fromCanvas: input.fromCanvas ?? null,
    snapshot: null,
  };

  const layerState = resolveLayerState(frame);
  drawLayerWithBands(ctx, input.slideCanvas, layerState, width, height);

  // 2. Sustrato: la vida vive sobre la pieza, nunca la tapa.
  const substrateOpacity = input.substrateOpacity ?? spec.substrateOpacity;
  if (input.substrateCanvas && substrateOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = substrateOpacity;
    ctx.globalCompositeOperation = input.substrateBlend ?? 'source-over';
    ctx.drawImage(input.substrateCanvas, 0, 0, width, height);
    ctx.restore();
  }

  // 3. Efectos de cuadro (disolvencia, corte, glitch).
  const frameEffects = listEffects(scope, 'frame');
  if (frameEffects.length > 0) {
    const snapshot = createCanvas(width, height);
    const snapshotCtx = snapshot.getContext('2d');
    if (snapshotCtx) {
      snapshotCtx.drawImage(target, 0, 0);
      frame.snapshot = snapshot;
    }
    for (const effect of frameEffects) {
      effect.apply(layerState, frame);
    }
  }

  return { width, height, scope, reduced };
}
