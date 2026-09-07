import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('mergea clases y resuelve conflictos tailwind', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    const condition = false as boolean;
    expect(cn('text-sm', condition && 'hidden', 'font-bold')).toContain('text-sm');
    expect(cn('text-sm', condition && 'hidden', 'font-bold')).toContain('font-bold');
  });
});
