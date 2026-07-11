import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('mergea clases y resuelve conflictos tailwind', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toContain('text-sm');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toContain('font-bold');
  });
});
