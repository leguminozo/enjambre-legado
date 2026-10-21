/**
 * slide-motion.ts — Alcances de movimiento de la pieza editorial.
 *
 * Tres alcances, no tres "estilos sueltos": cada uno es una decisión sobre
 * cuánto se mueve la marca. El alcance decide transiciones, revelado, cámara
 * y densidad de sustrato. Todo lo que hay debajo (compositor, export) es
 * agnóstico al alcance.
 *
 *   estatico    La lámina respira, no se mueve. Pieza de archivo.
 *   elegante    El contenido aparece con ritmo. Lujo silencioso.
 *   rupturista  La grilla se rompe a propósito. Zona experimental.
 */

export type MotionScope = 'estatico' | 'elegante' | 'rupturista';

export type TransitionKind = 'corte' | 'disolvencia' | 'barrido' | 'ruptura';

export interface MotionSpec {
  id: MotionScope;
  label: string;
  sublabel: string;
  description: string;
  /** Duración de cada lámina en pantalla, sin contar la transición. */
  slideDurationMs: number;
  /** Duración del cambio entre láminas. */
  transitionMs: number;
  transition: TransitionKind;
  /** Revelado progresivo de la lámina por bandas. */
  revealBands: number;
  /** Amplitud del Ken Burns (0 = apagado). */
  kenBurns: number;
  /** Opacidad del sustrato generativo sobre la lámina. */
  substrateOpacity: number;
  /** Desplazamiento máximo en px de las bandas (ruptura de grilla). */
  bandOffset: number;
  /** Número de tiras de glitch por transición (0 = sin glitch). */
  glitchBands: number;
  /** Tope de eventos de glitch por pieza. */
  glitchBudget: number;
  /** Comportamiento cuando el sistema pide movimiento reducido. */
  reducedFallback: 'estatico' | 'primera_lamina';
  /** Si el alcance puede imprimirse (kit de mesa). */
  printable: boolean;
}

export const MOTION_SCOPES: Record<MotionScope, MotionSpec> = {
  estatico: {
    id: 'estatico',
    label: 'Estático',
    sublabel: 'Pieza de archivo',
    description:
      'La lámina se publica tal cual. Sin movimiento, sin sustrato, sin bandas de glitch. Es la forma legal del archivo.',
    slideDurationMs: 3000,
    transitionMs: 0,
    transition: 'corte',
    revealBands: 0,
    kenBurns: 0,
    substrateOpacity: 0,
    bandOffset: 0,
    glitchBands: 0,
    glitchBudget: 0,
    reducedFallback: 'estatico',
    printable: true,
  },
  elegante: {
    id: 'elegante',
    label: 'Elegante',
    sublabel: 'Lujo silencioso',
    description:
      'El contenido llega por bandas con retardo medido, la fotografía respira y las láminas se disuelven. Nada grita, todo respira.',
    slideDurationMs: 4200,
    transitionMs: 700,
    transition: 'disolvencia',
    revealBands: 28,
    kenBurns: 0.05,
    substrateOpacity: 0.12,
    bandOffset: 0,
    glitchBands: 0,
    glitchBudget: 0,
    reducedFallback: 'primera_lamina',
    printable: true,
  },
  rupturista: {
    id: 'rupturista',
    label: 'Rupturista',
    sublabel: 'Zona experimental',
    description:
      'La grilla se sale del marco, el corte es seco y el glitch aparece solo en la transición. El dato nunca se oculta para que el efecto resalte.',
    slideDurationMs: 3200,
    transitionMs: 260,
    transition: 'ruptura',
    revealBands: 12,
    kenBurns: 0.08,
    substrateOpacity: 0.2,
    bandOffset: 46,
    glitchBands: 7,
    glitchBudget: 3,
    reducedFallback: 'primera_lamina',
    printable: false,
  },
};

export const MOTION_SCOPE_ORDER: MotionScope[] = ['estatico', 'elegante', 'rupturista'];

export function resolveMotionScope(scope?: string): MotionSpec {
  if (scope && scope in MOTION_SCOPES) {
    return MOTION_SCOPES[scope as MotionScope];
  }
  return MOTION_SCOPES.estatico;
}

// ── Curvas ────────────────────────────────────────────────────────────────
// Curvas propias de la casa. No son las de un framework: son la cadencia
// con la que la editorial entra en pantalla.

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function bezierComponent(t: number, a1: number, a2: number): number {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
}

function bezierSlope(t: number, a1: number, a2: number): number {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return (3 * a * t + 2 * b) * t + c;
}

/** Curva cúbica-bezier evaluada por Newton-Raphson con respaldo por bisección. */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  return (input: number): number => {
    const t = clamp01(input);
    if (t === 0 || t === 1) return t;

    let estimate = t;
    for (let i = 0; i < 6; i++) {
      const slope = bezierSlope(estimate, x1, x2);
      if (Math.abs(slope) < 1e-6) break;
      const error = bezierComponent(estimate, x1, x2) - t;
      if (Math.abs(error) < 1e-6) return bezierComponent(estimate, y1, y2);
      estimate -= error / slope;
    }

    let low = 0;
    let high = 1;
    estimate = t;
    for (let i = 0; i < 12; i++) {
      const value = bezierComponent(estimate, x1, x2);
      if (Math.abs(value - t) < 1e-6) break;
      if (value > t) high = estimate;
      else low = estimate;
      estimate = (low + high) / 2;
    }
    return bezierComponent(estimate, y1, y2);
  };
}

/** Entrada editorial: arranca con decisión, frena largo. */
export const EASE_EDITORIAL = cubicBezier(0.16, 1, 0.3, 1);

/** Ruptura: entra rápido, se asienta con un rebote mínimo. */
export const EASE_RUPTURE = cubicBezier(0.85, 0, 0.15, 1);

/** Salida: se va sin estruendo. */
export const EASE_EXIT = cubicBezier(0.4, 0, 1, 1);

export type EaseFunction = (t: number) => number;

export function easeForScope(scope: MotionScope, phase: 'in' | 'out'): EaseFunction {
  if (scope === 'rupturista') return EASE_RUPTURE;
  return phase === 'in' ? EASE_EDITORIAL : EASE_EXIT;
}

// ── Línea de tiempo ───────────────────────────────────────────────────────

export interface SlideSlot {
  index: number;
  startMs: number;
  endMs: number;
  transitionInMs: number;
  transitionOutMs: number;
}

/**
 * Reparte las láminas en una línea de tiempo continua.
 * La transición se cuenta dentro de la lámina siguiente: no hay huecos muertos.
 */
export function buildTimeline(spec: MotionSpec, totalSlides: number): SlideSlot[] {
  const slots: SlideSlot[] = [];
  const step = spec.slideDurationMs;

  for (let index = 0; index < totalSlides; index++) {
    const startMs = index * step;
    const transitionInMs = index === 0 ? 0 : spec.transitionMs;
    const transitionOutMs = index === totalSlides - 1 ? 0 : spec.transitionMs;
    slots.push({
      index,
      startMs,
      endMs: startMs + step,
      transitionInMs,
      transitionOutMs,
    });
  }

  return slots;
}

export function totalDurationMs(spec: MotionSpec, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  return spec.slideDurationMs * totalSlides;
}

/**
 * Progreso de revelado de una banda concreta (0..1).
 * Las bandas salen escalonadas: la última tarda más.
 */
export function bandRevealProgress(
  bandIndex: number,
  totalBands: number,
  elapsedMs: number,
  revealMs: number,
  ease: EaseFunction = EASE_EDITORIAL,
): number {
  if (totalBands <= 0) return 1;
  const stagger = 26;
  const delay = bandIndex * stagger;
  const local = clamp01((elapsedMs - delay) / Math.max(1, revealMs));
  return ease(local);
}
