import { describe, expect, it } from 'vitest';
import { MODAL_FOCUSABLE_SELECTOR } from '@enjambre/ui';

describe('modal focus trap (shared @enjambre/ui)', () => {
  it('exports selector for enabled interactive elements', () => {
    expect(MODAL_FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(MODAL_FOCUSABLE_SELECTOR).toContain('textarea:not([disabled])');
  });
});