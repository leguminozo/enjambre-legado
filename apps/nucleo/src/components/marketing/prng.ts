/**
 * prng.ts — Aleatoriedad reproducible.
 *
 * El estudio no usa azar irrepetible: una pieza con la misma semilla tiene
 * que volver a salir igual, porque la pieza se publica, se audita y se
 * reproduce. Los flujos van separados (campo, partículas, tinta) para que
 * cambiar un color no reubique todo lo demás.
 */

/** Hash FNV-1a de 32 bits. Convierte texto en semilla numérica. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Generador mulberry32: rápido, estable y suficiente para arte generativo. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RandomStream {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

/**
 * Abre un flujo independiente a partir de una semilla y una etiqueta.
 * Dos etiquetas distintas nunca comparten secuencia.
 */
export function createStream(seed: number, label: string): RandomStream {
  const next = mulberry32(hashString(`${seed}:${label}`));
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, maxInclusive) => Math.floor(min + next() * (maxInclusive - min + 1)),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length) % items.length],
  };
}

/** Semilla estable a partir de un contenido (código de lote, título, etc.). */
export function seedFromContent(...parts: Array<string | number | undefined>): number {
  const joined = parts.filter((part) => part !== undefined && part !== null).join('|');
  return hashString(joined || 'enjambre-legado');
}
