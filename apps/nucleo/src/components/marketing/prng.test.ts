import { describe, expect, it } from 'vitest';
import { createStream, hashString, mulberry32, seedFromContent } from './prng';

describe('prng', () => {
  it('produce la misma secuencia con la misma semilla', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = Array.from({ length: 8 }, () => a());
    const second = Array.from({ length: 8 }, () => b());
    expect(first).toEqual(second);
  });

  it('produce secuencias distintas con semillas distintas', () => {
    const a = mulberry32(42);
    const b = mulberry32(43);
    expect(a()).not.toBe(b());
  });

  it('mantiene los valores dentro del rango abierto', () => {
    const next = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('separa los flujos por etiqueta', () => {
    const streamA = createStream(42, 'campo');
    const streamB = createStream(42, 'tinta');
    const a = Array.from({ length: 5 }, () => streamA.next());
    const b = Array.from({ length: 5 }, () => streamB.next());
    expect(a).not.toEqual(b);
  });

  it('reproduce el mismo flujo cuando se abre con la misma etiqueta', () => {
    const first = createStream(42, 'particulas');
    const second = createStream(42, 'particulas');
    expect(first.next()).toBe(second.next());
    expect(first.next()).toBe(second.next());
  });

  it('acota los rangos pedidos', () => {
    const stream = createStream(1, 'rango');
    for (let i = 0; i < 100; i++) {
      const value = stream.range(-5, 5);
      expect(value).toBeGreaterThanOrEqual(-5);
      expect(value).toBeLessThanOrEqual(5);
      const int = stream.int(1, 3);
      expect(Number.isInteger(int)).toBe(true);
      expect(int).toBeGreaterThanOrEqual(1);
      expect(int).toBeLessThanOrEqual(3);
    }
  });

  it('hashea texto de forma estable', () => {
    expect(hashString('lote-084')).toBe(hashString('lote-084'));
    expect(hashString('lote-084')).not.toBe(hashString('lote-085'));
  });

  it('deriva la semilla del contenido de la pieza', () => {
    const a = seedFromContent('slide-1', 'ulmo', 'estatico');
    const b = seedFromContent('slide-1', 'ulmo', 'estatico');
    const c = seedFromContent('slide-1', 'ulmo', 'elegante');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
