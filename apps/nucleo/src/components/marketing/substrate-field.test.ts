import { describe, expect, it } from 'vitest';
import {
  CurlField,
  GradientNoise,
  distributeParticles,
  poissonDiskSample,
} from './substrate-field';
import { createStream } from './prng';

/**
 * Divergencia relativa de un campo, medida en dominio normalizado.
 *
 * Comparar campos exige la misma escala: la divergencia tiene unidades de
 * 1/longitud, así que un campo expresado en píxeles y otro en fracción del
 * lienzo no se pueden contrastar. Todo se mide sobre la misma grilla y con
 * la misma coordenada.
 */
function divergenceRatio(
  sample: (u: number, v: number) => { x: number; y: number },
  cols: number,
  rows: number,
): number {
  let divergenceSum = 0;
  let magnitudeSum = 0;

  const at = (col: number, row: number) => sample(col / (cols - 1), row / (rows - 1));

  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      const left = at(col - 1, row);
      const right = at(col + 1, row);
      const up = at(col, row - 1);
      const down = at(col, row + 1);
      const center = at(col, row);

      divergenceSum += Math.abs((right.x - left.x) / 2 - (down.y - up.y) / 2);
      magnitudeSum += Math.sqrt(center.x * center.x + center.y * center.y);
    }
  }

  return divergenceSum / Math.max(1e-9, magnitudeSum);
}

describe('ruido de gradiente', () => {
  it('es determinista con la misma semilla', () => {
    const a = new GradientNoise(42);
    const b = new GradientNoise(42);
    for (let i = 0; i < 20; i++) {
      expect(a.sample(i * 0.37, i * 0.11, i * 0.05)).toBe(b.sample(i * 0.37, i * 0.11, i * 0.05));
    }
  });

  it('cambia con otra semilla', () => {
    const a = new GradientNoise(42);
    const b = new GradientNoise(43);
    const samplesA = [0.3, 1.7, 2.9].map((v) => a.sample(v, v * 0.5, 0));
    const samplesB = [0.3, 1.7, 2.9].map((v) => b.sample(v, v * 0.5, 0));
    expect(samplesA).not.toEqual(samplesB);
  });

  it('queda dentro de [-1, 1]', () => {
    const noise = new GradientNoise(7);
    for (let i = 0; i < 2000; i++) {
      const value = noise.sample(i * 0.137, i * 0.291, i * 0.073);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('el fractal se mantiene acotado', () => {
    const noise = new GradientNoise(11);
    const value = noise.fractal(0.4, 0.6, 0.2, 3);
    expect(Number.isFinite(value)).toBe(true);
    expect(Math.abs(value)).toBeLessThanOrEqual(1);
  });
});

describe('campo de curl', () => {
  it('no tiene fuentes ni sumideros: su divergencia es despreciable', () => {
    const cols = 40;
    const rows = 40;
    const field = new CurlField({ seed: 42, cols, rows });
    field.setBounds(1080, 1080);
    field.update(0.5);

    const out = { x: 0, y: 0 };
    const curlRatio = divergenceRatio(
      (u, v) => {
        field.sample(u * 1080, v * 1080, out);
        return out;
      },
      cols,
      rows,
    );

    // Contraste: un sumidero radial sí acumula y sí tiene divergencia alta.
    const sinkRatio = divergenceRatio((u, v) => {
      const dx = u - 0.5;
      const dy = v - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      return { x: -dx / d, y: -dy / d };
    }, cols, rows);

    expect(sinkRatio).toBeGreaterThan(0.01);
    expect(curlRatio).toBeLessThan(sinkRatio * 0.05);
  });

  it('se parece a un remolino puro, que tampoco tiene divergencia', () => {
    const cols = 40;
    const rows = 40;
    const swirlRatio = divergenceRatio((u, v) => {
      const dx = u - 0.5;
      const dy = v - 0.5;
      return { x: -dy, y: dx };
    }, cols, rows);

    const field = new CurlField({ seed: 42, cols, rows });
    field.setBounds(1080, 1080);
    field.update(0.5);
    const out = { x: 0, y: 0 };
    const curlRatio = divergenceRatio(
      (u, v) => {
        field.sample(u * 1080, v * 1080, out);
        return out;
      },
      cols,
      rows,
    );

    expect(swirlRatio).toBeLessThan(0.001);
    expect(curlRatio).toBeLessThan(0.001);
  });

  it('es determinista con la misma semilla', () => {
    const a = new CurlField({ seed: 42, cols: 24, rows: 24 });
    const b = new CurlField({ seed: 42, cols: 24, rows: 24 });
    a.setBounds(1080, 1350);
    b.setBounds(1080, 1350);
    a.update(1.25);
    b.update(1.25);

    for (let row = 0; row < 24; row += 4) {
      for (let col = 0; col < 24; col += 4) {
        expect(a.cellAt(col, row)).toEqual(b.cellAt(col, row));
      }
    }
  });

  it('cambia con otra semilla', () => {
    const a = new CurlField({ seed: 42, cols: 24, rows: 24 });
    const b = new CurlField({ seed: 77, cols: 24, rows: 24 });
    a.setBounds(1080, 1350);
    b.setBounds(1080, 1350);
    a.update(1.25);
    b.update(1.25);

    expect(a.cellAt(6, 6)).not.toEqual(b.cellAt(6, 6));
  });

  it('el campo evoluciona con el tiempo', () => {
    const field = new CurlField({ seed: 42, cols: 24, rows: 24 });
    field.setBounds(1080, 1350);
    field.update(0);
    const before = field.cellAt(8, 8);
    field.update(4);
    const after = field.cellAt(8, 8);
    expect(before).not.toEqual(after);
  });

  it('acota la fuerza de cada celda', () => {
    const field = new CurlField({ seed: 3, cols: 24, rows: 24, maxStrength: 2.6 });
    field.setBounds(1080, 1350);
    field.update(2);
    for (let row = 0; row < 24; row++) {
      for (let col = 0; col < 24; col++) {
        const cell = field.cellAt(col, row);
        expect(Math.sqrt(cell.x * cell.x + cell.y * cell.y)).toBeLessThanOrEqual(2.6 + 1e-6);
      }
    }
  });

  it('el muestreo devuelve una dirección finita dentro del lienzo', () => {
    const field = new CurlField({ seed: 42, cols: 24, rows: 24 });
    field.setBounds(1080, 1350);
    field.update(1);
    const out = { x: 0, y: 0 };
    for (const [x, y] of [[0, 0], [540, 675], [1079, 1349], [-50, 2000]]) {
      field.sample(x, y, out);
      expect(Number.isFinite(out.x)).toBe(true);
      expect(Number.isFinite(out.y)).toBe(true);
    }
  });
});

describe('colocación estructurada', () => {
  it('respeta la distancia mínima', () => {
    const stream = createStream(42, 'disco');
    const points = poissonDiskSample(1080, 1350, 60, stream);
    expect(points.length).toBeGreaterThan(10);

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        expect(Math.sqrt(dx * dx + dy * dy)).toBeGreaterThanOrEqual(59.9);
      }
    }
  });

  it('es determinista con el mismo flujo', () => {
    const a = poissonDiskSample(1080, 1350, 60, createStream(42, 'disco'));
    const b = poissonDiskSample(1080, 1350, 60, createStream(42, 'disco'));
    expect(a).toEqual(b);
  });

  it('mantiene los puntos dentro del lienzo', () => {
    const points = poissonDiskSample(1080, 1350, 60, createStream(9, 'disco'));
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThan(1080);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThan(1350);
    }
  });

  it('reparte exactamente la cantidad pedida', () => {
    const points = distributeParticles(1080, 1350, 140, 55, createStream(42, 'disco'));
    expect(points).toHaveLength(140);
  });

  it('completa con el flujo aleatorio si el disco no alcanza', () => {
    const points = distributeParticles(400, 400, 300, 90, createStream(42, 'disco'));
    expect(points).toHaveLength(300);
  });
});
