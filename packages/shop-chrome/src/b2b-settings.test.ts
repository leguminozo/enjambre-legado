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

  it('cada segmento canónico incluye entre 3 y 5 kits listos con estructura completa', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.kits).toBeDefined();
      expect(parsed.kits!.length).toBeGreaterThanOrEqual(3);
      expect(parsed.kits!.length).toBeLessThanOrEqual(5);

      for (const kit of parsed.kits!) {
        expect(kit.id).toBeTruthy();
        expect(kit.nombre).toBeTruthy();
        expect(kit.tagline).toBeTruthy();
        expect(kit.descripcion).toBeTruthy();
        expect(kit.precio_neto_clp).toBeGreaterThan(0);
        expect(kit.pvp_estimado_clp).toBeGreaterThan(kit.precio_neto_clp);
        expect(kit.margen_estimado_pct).toBeGreaterThan(0);
        expect(kit.componentes_fisicos.length).toBeGreaterThan(0);
        expect(kit.herramientas_servicio.length).toBeGreaterThan(0);
        expect(kit.materiales_exhibicion.length).toBeGreaterThan(0);
        expect(kit.integraciones_digitales.length).toBeGreaterThan(0);
        expect(kit.sales_strategy).toBeTruthy();
      }
    }
  });

  it('cada segmento canónico incluye 3 herramientas territoriales de madera nativa', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.tools).toBeDefined();
      expect(parsed.tools!.length).toBe(3);

      for (const tool of parsed.tools!) {
        expect(tool.nombre).toBeTruthy();
        expect(tool.material).toBeTruthy();
        expect(tool.rol).toBeTruthy();
        expect(tool.descripcion).toBeTruthy();
        expect(tool.impacto_ventas).toBeTruthy();
      }
    }
  });

  it('cada segmento canónico incluye una estrategia comercial con ticket boost y pasos de acción', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.commercial_strategy).toBeDefined();
      const strat = parsed.commercial_strategy!;
      expect(strat.titulo).toBeTruthy();
      expect(strat.bajada).toBeTruthy();
      expect(strat.aumento_ticket).toBeTruthy();
      expect(strat.herramienta_clave).toBeTruthy();
      expect(strat.mecanica_ventas.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('permite sobrescribir kits, herramientas y estrategia comercial vía raw JSON', () => {
    const raw = {
      kits: [
        {
          id: 'kit-custom',
          nombre: 'Kit Personalizado',
          badge: 'Exclusivo',
          tier: 'starter',
          tagline: 'Para cafeterías de autor',
          descripcion: 'Descripción del kit',
          precio_neto_clp: 150000,
          pvp_estimado_clp: 260000,
          margen_estimado_pct: 42,
          moq_summary: 'Mínimo 1 kit',
          sales_strategy: 'Estrategia personalizada',
          componentes_fisicos: ['12x Miel Ulmo 300g'],
          herramientas_servicio: ['1x Cuchara madera'],
          materiales_exhibicion: ['1x Atril roble'],
          integraciones_digitales: ['QR trazabilidad'],
          recomendado_para: 'Nuevos socios',
        },
      ],
      tools: [
        {
          nombre: 'Tótem Personalizado',
          material: 'Madera de canelo',
          rol: 'Servicio',
          descripcion: 'Grabado a láser',
          impacto_ventas: '+20% ticket promedio',
        },
      ],
      commercial_strategy: {
        titulo: 'Estrategia de Prueba',
        bajada: 'Resumen de prueba',
        aumento_ticket: '+$2.000 CLP',
        mecanica_ventas: ['Paso 1', 'Paso 2', 'Paso 3'],
        herramienta_clave: 'Tótem Personalizado',
      },
    };

    const parsed = parseB2BSegmentContent(raw, 'cafeterias');
    expect(parsed.kits).toHaveLength(1);
    expect(parsed.kits![0].id).toBe('kit-custom');
    expect(parsed.kits![0].nombre).toBe('Kit Personalizado');
    expect(parsed.kits![0].precio_neto_clp).toBe(150000);
    expect(parsed.tools).toHaveLength(1);
    expect(parsed.tools![0].material).toBe('Madera de canelo');
    expect(parsed.commercial_strategy?.titulo).toBe('Estrategia de Prueba');
    expect(parsed.commercial_strategy?.aumento_ticket).toBe('+$2.000 CLP');
  });

  it('cada segmento canónico incluye 4 módulos de código local (@enjambre) con beneficio comercial', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.code_modules).toBeDefined();
      expect(parsed.code_modules!.length).toBe(4);

      for (const mod of parsed.code_modules!) {
        expect(mod.id).toBeTruthy();
        expect(mod.package_name).toMatch(/^(@enjambre\/|apps\/)/);
        expect(mod.titulo).toBeTruthy();
        expect(mod.descripcion).toBeTruthy();
        expect(mod.badge).toBeTruthy();
        expect(mod.beneficio_comercial).toBeTruthy();
      }
    }
  });

  it('permite sobrescribir módulos de código local vía raw JSON', () => {
    const raw = {
      code_modules: [
        {
          id: 'modulo-custom',
          package_name: '@enjambre/sale-qr',
          titulo: 'Módulo Custom QR',
          descripcion: 'Descripción custom',
          badge: 'Innovación',
          beneficio_comercial: 'Retorno comercial custom',
        },
      ],
    };

    const parsed = parseB2BSegmentContent(raw, 'hoteles');
    expect(parsed.code_modules).toHaveLength(1);
    expect(parsed.code_modules![0].id).toBe('modulo-custom');
    expect(parsed.code_modules![0].package_name).toBe('@enjambre/sale-qr');
    expect(parsed.code_modules![0].titulo).toBe('Módulo Custom QR');
    expect(parsed.code_modules![0].beneficio_comercial).toBe('Retorno comercial custom');
  });
});

