/**
 * slide-effects.ts — Registro extensible de efectos.
 *
 * Un efecto no sabe de láminas: recibe el estado del lienzo y lo transforma.
 * Eso permite que la composición cresca sin que el compositor cambie: se
 * registra un efecto nuevo y aparece en el alcance que corresponda.
 *
 * Dos fases:
 *   layer  Modifica cómo se dibuja la lámina (escala, máscara, desplazamiento).
 *   frame  Se dibuja sobre el cuadro ya compuesto (disolvencia, corte, glitch).
 */

import {
  EASE_EDITORIAL,
  EASE_RUPTURE,
  bandRevealProgress,
  clamp01,
  type MotionScope,
  type MotionSpec,
} from './slide-motion';
import { createStream } from './prng';

export interface SlideBand {
  top: number;
  height: number;
  /** 0..1 — cuánto de la banda ya está revelado. */
  reveal: number;
  /** Desplazamiento horizontal en px (ruptura de grilla). */
  offsetX: number;
}

export interface SlideLayerState {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  /** Máscara por bandas. `null` = la lámina entra completa. */
  bands: SlideBand[] | null;
}

export interface EffectFrame {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  /** ms transcurridos dentro de la lámina actual. */
  elapsedMs: number;
  /** 0..1 de la transición de entrada. 0 = sin transición. */
  transitionProgress: number;
  scope: MotionScope;
  spec: MotionSpec;
  seed: number;
  /** El sistema pidió movimiento reducido. */
  reduced: boolean;
  /** Lámina anterior, para fundidos y cortes. */
  fromCanvas: HTMLCanvasElement | null;
  /** Copia del cuadro ya compuesto, para deformaciones por tiras. */
  snapshot: HTMLCanvasElement | null;
}

export type EffectKind = 'layer' | 'frame';

export interface Effect {
  id: string;
  label: string;
  description: string;
  kind: EffectKind;
  scopes: MotionScope[];
  apply(state: SlideLayerState, frame: EffectFrame): void;
}

function createBaseState(): SlideLayerState {
  return { scale: 1, offsetX: 0, offsetY: 0, rotation: 0, bands: null };
}

export const EFFECT_REGISTRY: Record<string, Effect> = {
  ken_burns: {
    id: 'ken_burns',
    label: 'Respiración de imagen',
    description: 'La lámina crece apenas, como una fotografía empujada por el aire.',
    kind: 'layer',
    scopes: ['elegante', 'rupturista'],
    apply(state, frame) {
      if (frame.reduced) return;
      const amplitude = frame.spec.kenBurns;
      if (amplitude <= 0) return;
      const eased = EASE_EDITORIAL(clamp01(frame.elapsedMs / 6000));
      state.scale = 1 + amplitude * eased;
    },
  },

  revelado_bandas: {
    id: 'revelado_bandas',
    label: 'Revelado por bandas',
    description: 'El contenido emerge por franjas con retardo medido, de arriba hacia abajo.',
    kind: 'layer',
    scopes: ['elegante'],
    apply(state, frame) {
      if (frame.reduced) return;
      const total = frame.spec.revealBands;
      if (total <= 0) return;

      const bandHeight = frame.height / total;
      const revealMs = 520;
      const bands: SlideBand[] = [];

      for (let index = 0; index < total; index++) {
        bands.push({
          top: index * bandHeight,
          height: bandHeight + 1,
          reveal: bandRevealProgress(index, total, frame.elapsedMs, revealMs, EASE_EDITORIAL),
          offsetX: 0,
        });
      }
      state.bands = bands;
    },
  },

  ruptura_grilla: {
    id: 'ruptura_grilla',
    label: 'Ruptura de grilla',
    description: 'Franjas alternas se salen del marco. El eje se inclina un grado.',
    kind: 'layer',
    scopes: ['rupturista'],
    apply(state, frame) {
      const amplitude = frame.spec.bandOffset;
      if (amplitude <= 0) return;

      const total = Math.max(6, Math.round(frame.spec.revealBands));
      const bandHeight = frame.height / total;
      const ramp = frame.reduced ? 0 : EASE_RUPTURE(clamp01(frame.elapsedMs / 420));
      const stream = createStream(frame.seed, 'ruptura-grilla');

      const bands: SlideBand[] = [];
      for (let index = 0; index < total; index++) {
        const direction = index % 2 === 0 ? 1 : -1;
        const amount = amplitude * ramp * stream.range(0.35, 1);
        bands.push({
          top: index * bandHeight,
          height: bandHeight + 1,
          reveal: 1,
          offsetX: direction * amount,
        });
      }
      state.bands = bands;

      if (!frame.reduced) {
        state.rotation = 0.008 * ramp;
        state.scale = 1.015 * ramp + 1 * (1 - ramp);
      }
    },
  },

  disolvencia: {
    id: 'disolvencia',
    label: 'Disolvencia',
    description: 'La lámina anterior se apaga mientras la nueva llega.',
    kind: 'frame',
    scopes: ['elegante'],
    apply(_state, frame) {
      const { ctx, fromCanvas, width, height, transitionProgress } = frame;
      if (!fromCanvas) return;
      if (transitionProgress <= 0) return;

      const eased = EASE_EDITORIAL(clamp01(transitionProgress));
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      ctx.drawImage(fromCanvas, 0, 0, width, height);
      ctx.restore();
    },
  },

  corte_seco: {
    id: 'corte_seco',
    label: 'Corte seco',
    description: 'Dos cuadros de negro antes del cambio. Sin fundido, sin aviso.',
    kind: 'frame',
    scopes: ['rupturista'],
    apply(_state, frame) {
      const { ctx, width, height, transitionProgress } = frame;
      if (transitionProgress <= 0) return;

      const blackFrames = 2;
      const totalMs = frame.spec.transitionMs || 1;
      const blackMs = (totalMs / 60) * blackFrames;
      const elapsed = transitionProgress * totalMs;
      if (elapsed > blackMs) return;

      ctx.save();
      ctx.globalAlpha = 1 - clamp01(elapsed / blackMs);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
  },

  glitch_tiras: {
    id: 'glitch_tiras',
    label: 'Glitch de tiras',
    description: 'Franjas horizontales se desplazan un instante. Solo en la transición.',
    kind: 'frame',
    scopes: ['rupturista'],
    apply(_state, frame) {
      const { ctx, canvas, snapshot, width, height, transitionProgress, spec, seed } = frame;
      if (!snapshot) return;
      if (spec.glitchBands <= 0) return;
      if (transitionProgress <= 0 || transitionProgress >= 1) return;

      const intensity = Math.sin(transitionProgress * Math.PI);
      if (intensity <= 0.02) return;

      const stream = createStream(seed, `glitch-${Math.round(transitionProgress * 1000)}`);
      const bandCount = Math.max(1, Math.round(spec.glitchBands * intensity));

      ctx.save();
      for (let index = 0; index < bandCount; index++) {
        const bandHeight = stream.range(2, 16);
        const y = stream.range(0, Math.max(1, height - bandHeight));
        const shift = stream.range(-1, 1) * intensity * 28;
        ctx.drawImage(
          snapshot,
          0,
          y,
          width,
          bandHeight,
          shift,
          y,
          width,
          bandHeight,
        );
      }
      ctx.restore();

      void canvas;
    },
  },
};

export function listEffects(scope?: MotionScope, kind?: EffectKind): Effect[] {
  const all = Object.values(EFFECT_REGISTRY);
  return all.filter((effect) => {
    if (scope && !effect.scopes.includes(scope)) return false;
    if (kind && effect.kind !== kind) return false;
    return true;
  });
}

/**
 * Registra un efecto nuevo. Los alcances existentes lo toman automáticamente
 * en el próximo cuadro: no hay que tocar el compositor.
 */
export function registerEffect(effect: Effect): void {
  EFFECT_REGISTRY[effect.id] = effect;
}

export function createLayerState(): SlideLayerState {
  return createBaseState();
}

/**
 * Calcula el estado de la capa de lámina aplicando los efectos de alcance.
 */
export function resolveLayerState(frame: EffectFrame): SlideLayerState {
  const state = createBaseState();
  for (const effect of listEffects(frame.scope, 'layer')) {
    effect.apply(state, frame);
  }
  return state;
}
