import { describe, expect, it } from 'vitest';
import { resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from './cms';

describe('resolveLegal*', () => {
  it('cae al fallback si body/title están vacíos o solo espacios', () => {
    const empty = { title: '  ', body: '\n\n', last_updated: '' };
    expect(resolveLegalTitle(empty, 'Términos')).toBe('Términos');
    expect(resolveLegalBody(empty, '<p>repo</p>')).toBe('<p>repo</p>');
    expect(resolveLegalLastUpdated(empty, '19 de mayo de 2026')).toBe('19 de mayo de 2026');
  });

  it('usa el CMS cuando hay cuerpo publicado', () => {
    const published = {
      title: 'Privacidad 2026',
      body: '<p>Cuerpo CMS</p>',
      last_updated: '2026-08-14',
    };
    expect(resolveLegalTitle(published, 'Política de Privacidad')).toBe('Privacidad 2026');
    expect(resolveLegalBody(published, '<p>repo</p>')).toBe('<p>Cuerpo CMS</p>');
    expect(resolveLegalLastUpdated(published, '19 de mayo de 2026')).toBe('2026-08-14');
  });
});
