/**
 * substrate-field.ts — Campo vectorial de flujo libre de divergencia.
 *
 * El sustrato anterior movía las partículas con fuerzas trigonométricas
 * sueltas. Eso crea fuentes y sumideros: los grupos se acumulan en algunos
 * puntos y desaparecen en otros. Un campo de curl (Bridson, 2007) no puede
 * hacer eso: se construye a partir de un potencial escalar y se rota su
 * gradiente, de modo que la divergencia se anula por construcción.
 *
 * En la práctica: el flujo se lee como fluido, no como ruido.
 */

import { createStream, type RandomStream } from './prng';

// ── Ruido de gradiente 3D con semilla ─────────────────────────────────────

const GRADIENTS_3D = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
  [1, 1, 0], [0, -1, 1], [-1, 1, 0], [0, -1, -1],
] as const;

/**
 * Los gradientes del ruido 3D tienen longitud √2, así que el producto escalar
 * crudo con un desplazamiento de celda puede llegar a ±2. Este factor deja el
 * ruido dentro de [-1, 1] y hace comparables las capas del fractal.
 */
const NOISE_SCALE = 0.5;

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (t * (b - a));
}

/**
 * Ruido de gradiente 3D determinista.
 * La tabla de permutación se construye con la semilla: el mismo seed da
 * siempre el mismo ruido.
 */
export class GradientNoise {
  private readonly permutation: Uint8Array;

  constructor(seed: number) {
    const stream = createStream(seed, 'ruido');
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;

    for (let i = 255; i > 0; i--) {
      const j = stream.int(0, i);
      const swap = base[i];
      base[i] = base[j];
      base[j] = swap;
    }

    this.permutation = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = base[i & 255];
    }
  }

  private hash(x: number, y: number, z: number): number {
    return this.permutation[
      (this.permutation[(this.permutation[x & 255] + y) & 255] + z) & 255
    ];
  }

  /** Valor del ruido en el punto. Rango aproximado: [-1, 1]. */
  sample(x: number, y: number, z: number): number {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);

    const fx = x - floorX;
    const fy = y - floorY;
    const fz = z - floorZ;

    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);

    const ix = floorX & 255;
    const iy = floorY & 255;
    const iz = floorZ & 255;

    const corner = (dx: number, dy: number, dz: number): number => {
      const gradient = GRADIENTS_3D[this.hash(ix + dx, iy + dy, iz + dz) & 15];
      return (gradient[0] * fx + gradient[1] * fy + gradient[2] * fz) * NOISE_SCALE;
    };

    const n000 = corner(0, 0, 0);
    const n100 = corner(1, 0, 0);
    const n010 = corner(0, 1, 0);
    const n110 = corner(1, 1, 0);
    const n001 = corner(0, 0, 1);
    const n101 = corner(1, 0, 1);
    const n011 = corner(0, 1, 1);
    const n111 = corner(1, 1, 1);

    const x00 = lerp(n000, n100, u);
    const x10 = lerp(n010, n110, u);
    const x01 = lerp(n001, n101, u);
    const x11 = lerp(n011, n111, u);

    return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
  }

  /** Ruido fractal: capas de detalle que no rompen la coherencia grande. */
  fractal(x: number, y: number, z: number, octaves: number, lacunarity = 2, gain = 0.5): number {
    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let normalization = 0;

    for (let octave = 0; octave < Math.max(1, octaves); octave++) {
      total += this.sample(x * frequency, y * frequency, z * frequency) * amplitude;
      normalization += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return normalization > 0 ? total / normalization : 0;
  }
}

// ── Campo de curl ──────────────────────────────────────────────────────────

export interface CurlFieldConfig {
  seed: number;
  /** Celdas horizontales del potencial. */
  cols: number;
  /** Celdas verticales del potencial. */
  rows: number;
  /** Escala del ruido: cuántas células de ruido entran en el lienzo. */
  scale: number;
  /** Capas de fractal. */
  octaves: number;
  /** Velocidad de evolución del campo. */
  speed: number;
  /** Fuerza máxima de una celda. */
  maxStrength: number;
}

export const DEFAULT_CURL_FIELD: CurlFieldConfig = {
  seed: 42,
  cols: 36,
  rows: 44,
  scale: 2.4,
  octaves: 3,
  speed: 0.12,
  maxStrength: 2.6,
};

/**
 * Campo de curl discreto sobre una grilla.
 *
 * El potencial se muestrea en la grilla; el campo se obtiene rotando el
 * gradiente: F = (∂ψ/∂y, −∂ψ/∂x). Esa es la razón por la que el campo no
 * tiene fuentes ni sumideros: la divergencia se cancela sola.
 */
export class CurlField {
  private readonly config: CurlFieldConfig;
  private noise: GradientNoise;
  private readonly potential: Float32Array;
  private readonly fieldX: Float32Array;
  private readonly fieldY: Float32Array;
  private width: number;
  private height: number;
  private time = 0;

  constructor(config: Partial<CurlFieldConfig> = {}) {
    this.config = { ...DEFAULT_CURL_FIELD, ...config };
    this.noise = new GradientNoise(this.config.seed);
    const size = this.config.cols * this.config.rows;
    this.potential = new Float32Array(size);
    this.fieldX = new Float32Array(size);
    this.fieldY = new Float32Array(size);
    this.width = 1;
    this.height = 1;
  }

  setBounds(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  setOctaves(octaves: number): void {
    this.config.octaves = Math.max(1, Math.min(5, Math.round(octaves)));
  }

  setScale(scale: number): void {
    this.config.scale = Math.max(0.2, scale);
  }

  setSeed(seed: number): void {
    this.config.seed = seed;
    this.noise = new GradientNoise(seed);
  }

  /**
   * Recalcula el campo para el instante dado.
   * El potencial evoluciona en la tercera dimensión: el flujo se desplaza en
   * el tiempo en vez de repetirse.
   */
  update(time: number): void {
    this.time = time;
    const { cols, rows, scale, octaves, speed } = this.config;
    const z = time * speed;

    for (let row = 0; row < rows; row++) {
      const ny = rows > 1 ? row / (rows - 1) : 0;
      for (let col = 0; col < cols; col++) {
        const nx = cols > 1 ? col / (cols - 1) : 0;
        this.potential[row * cols + col] = this.noise.fractal(
          nx * scale,
          ny * scale,
          z,
          octaves,
        );
      }
    }

    this.deriveField();
  }

  /**
   * Deriva el campo a partir del potencial por diferencias finitas.
   *
   * Las derivadas se toman en coordenadas normalizadas (0..1), no en píxeles:
   * así el campo no depende del tamaño del lienzo y la misma semilla produce
   * el mismo flujo en 4:5 que en 9:16.
   */
  private deriveField(): void {
    const { cols, rows, maxStrength } = this.config;
    const spanY = rows > 1 ? 2 / (rows - 1) : 0;
    const spanX = cols > 1 ? 2 / (cols - 1) : 0;

    for (let row = 0; row < rows; row++) {
      const rowUp = row > 0 ? row - 1 : row;
      const rowDown = row < rows - 1 ? row + 1 : row;

      for (let col = 0; col < cols; col++) {
        const colLeft = col > 0 ? col - 1 : col;
        const colRight = col < cols - 1 ? col + 1 : col;

        const index = row * cols + col;

        const dPsiDy =
          spanY > 0
            ? (this.potential[rowDown * cols + col] - this.potential[rowUp * cols + col]) / spanY
            : 0;
        const dPsiDx =
          spanX > 0
            ? (this.potential[row * cols + colRight] - this.potential[row * cols + colLeft]) / spanX
            : 0;

        let fx = dPsiDy;
        let fy = -dPsiDx;

        const magnitude = Math.sqrt(fx * fx + fy * fy);
        if (magnitude > maxStrength && magnitude > 0) {
          const scale = maxStrength / magnitude;
          fx *= scale;
          fy *= scale;
        }

        this.fieldX[index] = fx;
        this.fieldY[index] = fy;
      }
    }
  }

  /**
   * Muestreo bilineal del campo en coordenadas de lienzo.
   * Devuelve la dirección del flujo (no la velocidad).
   */
  sample(x: number, y: number, out: { x: number; y: number }): void {
    const { cols, rows } = this.config;

    const gx = (x / this.width) * (cols - 1) - 0.5;
    const gy = (y / this.height) * (rows - 1) - 0.5;

    const col0 = Math.min(cols - 1, Math.max(0, Math.floor(gx)));
    const row0 = Math.min(rows - 1, Math.max(0, Math.floor(gy)));
    const col1 = Math.min(cols - 1, col0 + 1);
    const row1 = Math.min(rows - 1, row0 + 1);

    const tx = Math.min(1, Math.max(0, gx - col0));
    const ty = Math.min(1, Math.max(0, gy - row0));

    const index00 = row0 * cols + col0;
    const index10 = row0 * cols + col1;
    const index01 = row1 * cols + col0;
    const index11 = row1 * cols + col1;

    const topX = lerp(this.fieldX[index00], this.fieldX[index10], tx);
    const bottomX = lerp(this.fieldX[index01], this.fieldX[index11], tx);
    const topY = lerp(this.fieldY[index00], this.fieldY[index10], tx);
    const bottomY = lerp(this.fieldY[index01], this.fieldY[index11], tx);

    out.x = lerp(topX, bottomX, ty);
    out.y = lerp(topY, bottomY, ty);
  }

  get currentTime(): number {
    return this.time;
  }

  get gridSize(): { cols: number; rows: number } {
    return { cols: this.config.cols, rows: this.config.rows };
  }

  /** Valor crudo de una celda. Diagnóstico: mide divergencia y magnitud. */
  cellAt(col: number, row: number): { x: number; y: number } {
    const index = row * this.config.cols + col;
    return { x: this.fieldX[index], y: this.fieldY[index] };
  }
}

// ── Blue noise: colocación estructurada ────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

/**
 * Muestreo de disco de Poisson (Bridson).
 * Devuelve puntos separados por al menos `minDistance`: una distribución
 * estructurada. El azar puro se ve como azar; el azar con distancia mínima se
 * ve como decisión.
 */
export function poissonDiskSample(
  width: number,
  height: number,
  minDistance: number,
  stream: RandomStream,
  maxAttempts = 24,
): Point[] {
  const points: Point[] = [];
  if (minDistance <= 0 || width <= 0 || height <= 0) return points;

  const cellSize = minDistance / Math.SQRT2;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid: number[] = new Array(cols * rows).fill(-1);

  const indexOf = (x: number, y: number): number => {
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x / cellSize)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(y / cellSize)));
    return row * cols + col;
  };

  const fits = (candidate: Point): boolean => {
    const col = Math.min(cols - 1, Math.max(0, Math.floor(candidate.x / cellSize)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(candidate.y / cellSize)));

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const neighborCol = col + dx;
        const neighborRow = row + dy;
        if (neighborCol < 0 || neighborCol >= cols || neighborRow < 0 || neighborRow >= rows) {
          continue;
        }
        const neighborIndex = grid[neighborRow * cols + neighborCol];
        if (neighborIndex === -1) continue;
        const neighbor = points[neighborIndex];
        const distanceX = candidate.x - neighbor.x;
        const distanceY = candidate.y - neighbor.y;
        if (distanceX * distanceX + distanceY * distanceY < minDistance * minDistance) {
          return false;
        }
      }
    }
    return true;
  };

  const seedPoint: Point = { x: stream.next() * width, y: stream.next() * height };
  points.push(seedPoint);
  grid[indexOf(seedPoint.x, seedPoint.y)] = 0;

  const active: number[] = [0];

  while (active.length > 0) {
    const activeIndex = stream.int(0, active.length - 1);
    const current = points[active[activeIndex]];

    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = stream.next() * Math.PI * 2;
      const radius = minDistance * (1 + stream.next());
      const candidate: Point = {
        x: current.x + Math.cos(angle) * radius,
        y: current.y + Math.sin(angle) * radius,
      };

      if (candidate.x < 0 || candidate.x >= width || candidate.y < 0 || candidate.y >= height) {
        continue;
      }
      if (!fits(candidate)) continue;

      points.push(candidate);
      grid[indexOf(candidate.x, candidate.y)] = points.length - 1;
      active.push(points.length - 1);
      placed = true;
      break;
    }

    if (!placed) {
      active.splice(activeIndex, 1);
    }
  }

  return points;
}

/**
 * Coloca `count` partículas con separación mínima.
 * Si el disco de Poisson no alcanza, el resto se completa con el flujo
 * aleatorio: la pieza nunca se queda corta de vida.
 */
export function distributeParticles(
  width: number,
  height: number,
  count: number,
  minDistance: number,
  stream: RandomStream,
): Point[] {
  const placed = poissonDiskSample(width, height, minDistance, stream);
  const points = placed.slice(0, count);

  while (points.length < count) {
    points.push({ x: stream.next() * width, y: stream.next() * height });
  }

  return points;
}
