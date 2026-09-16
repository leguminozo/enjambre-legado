import { describe, expect, it } from 'vitest';
import {
  B2B_SEGMENT_SLUGS,
  DEFAULT_B2B_CAFETERIAS,
  DEFAULT_B2B_HOTELES,
  DEFAULT_B2B_TIENDAS_GOURMET,
  DEFAULT_B2B_FERIAS,
  DEFAULT_B2B_REVENDEDORES,
  DEFAULT_B2B_SEGMENTS,
  parseB2BSegmentContent,
} from './store-chrome';

describe('B2B Segment Settings', () => {
  it('contiene los 5 slugs canónicos de alianzas', () => {
    expect(B2B_SEGMENT_SLUGS).toEqual([
      'cafeterias',
      'hoteles',
      'tiendas-gourmet',
      'ferias',
      'revendedores',
    ]);
  });

  it('retorna defaults canónicos intactos para cada segmento cuando raw es null', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.kicker).toBe(DEFAULT_B2B_SEGMENTS[slug].kicker);
      expect(parsed.headline).toBe(DEFAULT_B2B_SEGMENTS[slug].headline);
      expect(parsed.subheadline).toBe(DEFAULT_B2B_SEGMENTS[slug].subheadline);
      expect(parsed.value_props.length).toBeGreaterThan(0);
      expect(parsed.stats.length).toBeGreaterThan(0);
      expect(parsed.process.length).toBe(3);
      expect(parsed.faq.length).toBeGreaterThan(0);
    }
  });

  it('permite sobrescribir titular, bajada y listas personalizadas', () => {
    const raw = {
      headline: 'Miel de Bosque para Cafeterías de Especialidad',
      subheadline: 'Servicio exclusivo para baristas.',
      kicker: 'Alianza Especializada',
      value_props: [
        {
          title: 'Origen Puro',
          description: 'Recolección directa sin intermediarios.',
        },
      ],
      stats: [
        { value: '100%', label: 'Puro', note: 'Certificado' },
      ],
      process: [
        { step: '01', title: 'Cata', description: 'Evaluación de perfiles.' },
      ],
      faq: [
        { question: '¿Tienen formato barista?', answer: 'Sí, bidón de 5kg.' },
      ],
    };

    const parsed = parseB2BSegmentContent(raw, 'cafeterias');
    expect(parsed.headline).toBe('Miel de Bosque para Cafeterías de Especialidad');
    expect(parsed.subheadline).toBe('Servicio exclusivo para baristas.');
    expect(parsed.kicker).toBe('Alianza Especializada');
    expect(parsed.value_props[0].title).toBe('Origen Puro');
    expect(parsed.value_props[0].description).toBe('Recolección directa sin intermediarios.');
    expect(parsed.stats[0].value).toBe('100%');
    expect(parsed.process[0].title).toBe('Cata');
    expect(parsed.faq[0].question).toBe('¿Tienen formato barista?');
    // Campos no proporcionados usan fallback canónico
    expect(parsed.cta_text).toBe(DEFAULT_B2B_CAFETERIAS.cta_text);
    expect(parsed.cta_href).toBe(DEFAULT_B2B_CAFETERIAS.cta_href);
  });

  it('sanitiza rutas maliciosas en los CTAs', () => {
    const raw = {
      cta_href: 'javascript:alert(1)',
    };
    const parsed = parseB2BSegmentContent(raw, 'hoteles');
    expect(parsed.cta_href).toBe(DEFAULT_B2B_HOTELES.cta_href);
  });
});
