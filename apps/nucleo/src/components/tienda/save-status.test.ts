import { describe, expect, it, vi } from 'vitest';
import { deriveAggregateStatus, flushRegistered } from './save-status';

describe('flushRegistered', () => {
  it('llama a cada flush (no hace allSettled de las funciones sin ejecutarlas)', async () => {
    const a = vi.fn(async () => undefined);
    const b = vi.fn(async () => undefined);
    await flushRegistered({ theme_settings: a, brand_assets: b });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('un flush que falla no cancela a los demás', async () => {
    const ok = vi.fn(async () => undefined);
    const boom = vi.fn(async () => {
      throw new Error('red');
    });
    await flushRegistered({ a: boom, b: ok });
    expect(ok).toHaveBeenCalledOnce();
  });
});

describe('deriveAggregateStatus', () => {
  it('prioriza error > saving > pending > saved > idle', () => {
    expect(deriveAggregateStatus({})).toBe('idle');
    expect(deriveAggregateStatus({ a: 'saved' })).toBe('saved');
    expect(deriveAggregateStatus({ a: 'saved', b: 'pending' })).toBe('pending');
    expect(deriveAggregateStatus({ a: 'pending', b: 'saving' })).toBe('saving');
    expect(deriveAggregateStatus({ a: 'saving', b: 'error' })).toBe('error');
  });
});
