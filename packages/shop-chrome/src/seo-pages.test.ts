import { describe, it, expect } from 'vitest';
import {
  parseSeoDefaults,
  resolvePageSeoMetadata,
  DEFAULT_SEO_DEFAULTS,
  STORE_SEO_PAGES,
  type SeoDefaults,
} from './store-chrome';

describe('Page SEO and Store SEO Pages', () => {
  it('includes canonical store pages in STORE_SEO_PAGES', () => {
    expect(STORE_SEO_PAGES.length).toBeGreaterThanOrEqual(10);
    const paths = STORE_SEO_PAGES.map((p) => p.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/catalogo');
    expect(paths).toContain('/nosotros');
    expect(paths).toContain('/experiencias');
    expect(paths).toContain('/club-legado-del-bosque');
    expect(paths).toContain('/envio');
    expect(paths).toContain('/terminos');
  });

  it('parses empty or null seo_defaults safely', () => {
    const parsed = parseSeoDefaults(null);
    expect(parsed.default_title).toBe(DEFAULT_SEO_DEFAULTS.default_title);
    expect(parsed.pages).toEqual({});
  });

  it('parses custom pages correctly', () => {
    const raw = {
      default_title: 'Tienda Oficial',
      pages: {
        '/envio': {
          title: 'Envíos a todo Chile · La Obrera y el Zángano',
          description: 'Despacho en 24-48 horas con Blue Express desde Chiloé.',
          noindex: false,
          keywords: ['envíos', 'despacho chiloé'],
        },
        '/terminos': {
          title: 'Términos y Condiciones',
          description: 'Normas de uso del sitio web.',
          noindex: true,
        },
      },
    };

    const parsed = parseSeoDefaults(raw as unknown as Record<string, unknown>);
    expect(parsed.pages?.['/envio']?.title).toBe('Envíos a todo Chile · La Obrera y el Zángano');
    expect(parsed.pages?.['/envio']?.keywords).toEqual(['envíos', 'despacho chiloé']);
    expect(parsed.pages?.['/terminos']?.noindex).toBe(true);
  });

  it('resolves metadata fallback when page is not configured in CMS', () => {
    const seo: SeoDefaults = {
      ...DEFAULT_SEO_DEFAULTS,
      pages: {},
    };

    const fallback = {
      title: 'Título Fallback',
      description: 'Descripción Fallback',
    };

    const resolved = resolvePageSeoMetadata('/nosotros', seo, fallback);
    expect(resolved.title).toBe('Título Fallback');
    expect(resolved.description).toBe('Descripción Fallback');
    expect(resolved.robots).toBeUndefined();
    expect(resolved.keywords).toBeUndefined();
  });

  it('resolves custom metadata and noindex directive when configured in CMS', () => {
    const seo: SeoDefaults = {
      ...DEFAULT_SEO_DEFAULTS,
      pages: {
        '/privacidad': {
          title: 'Privacidad y Protección de Datos',
          description: 'Cuidamos la confidencialidad de tus datos.',
          noindex: true,
          keywords: ['privacidad', 'datos'],
        },
      },
    };

    const fallback = {
      title: 'Título Fallback',
      description: 'Descripción Fallback',
    };

    const resolved = resolvePageSeoMetadata('/privacidad', seo, fallback);
    expect(resolved.title).toBe('Privacidad y Protección de Datos');
    expect(resolved.description).toBe('Cuidamos la confidencialidad de tus datos.');
    expect(resolved.robots).toEqual({ index: false, follow: false });
    expect(resolved.keywords).toEqual(['privacidad', 'datos']);
  });
});
