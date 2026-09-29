import { describe, expect, it } from 'vitest';
import { resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle, preferLocale } from './cms';

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

describe('preferLocale', () => {
  it('no descarta ítems distintos que comparten item_order en el mismo idioma', () => {
    const rows = [
      { id: '1', section_key: 'menu_links', item_order: 1, content: { label: 'Inicio' } },
      { id: '8a', section_key: 'menu_links', item_order: 8, content: { label: 'Contacto' } },
      { id: '8b', section_key: 'menu_links', item_order: 8, content: { label: 'Nosotros' } },
    ];
    const out = preferLocale(rows, 'es');
    expect(out.map((r) => (r.content as { label: string }).label)).toEqual([
      'Inicio',
      'Contacto',
      'Nosotros',
    ]);
  });

  it('selecciona la variante solicitada cuando existe par bilingüe es/en', () => {
    const rows = [
      { id: '1es', section_key: 'menu_links', item_order: 1, locale: 'es', content: { label: 'Inicio' } },
      { id: '1en', section_key: 'menu_links', item_order: 1, locale: 'en', content: { label: 'Home' } },
    ];
    const outEn = preferLocale(rows, 'en');
    expect((outEn[0].content as { label: string }).label).toBe('Home');

    const outEs = preferLocale(rows, 'es');
    expect((outEs[0].content as { label: string }).label).toBe('Inicio');
  });
});

