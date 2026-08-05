import { describe, expect, it } from 'vitest';
import {
  appendCosechaId,
  mergeCosechaIds,
  removeCosechaId,
  sumCosechaKg,
} from './link-cosecha-lote';

describe('appendCosechaId', () => {
  it('añade sin duplicar', () => {
    expect(appendCosechaId(['a'], 'b')).toEqual(['a', 'b']);
    expect(appendCosechaId(['a'], 'a')).toEqual(['a']);
    expect(appendCosechaId(null, 'x')).toEqual(['x']);
  });
});

describe('removeCosechaId', () => {
  it('quita id', () => {
    expect(removeCosechaId(['a', 'b'], 'a')).toEqual(['b']);
    expect(removeCosechaId(undefined, 'a')).toEqual([]);
  });
});

describe('mergeCosechaIds', () => {
  it('fusiona listas', () => {
    expect(mergeCosechaIds(['a'], ['b', 'a'])).toEqual(['a', 'b']);
  });
});

describe('sumCosechaKg', () => {
  it('suma kg válidos', () => {
    expect(sumCosechaKg([{ kg: 10 }, { kg: 2.5 }, { kg: null }])).toBe(12.5);
  });
});
