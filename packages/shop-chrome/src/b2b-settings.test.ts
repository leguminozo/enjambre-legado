import { describe, expect, it } from 'vitest';
import {
  B2B_SEGMENT_SLUGS,
  DEFAULT_B2B_CAFETERIAS,
  DEFAULT_B2B_HOTELES,
  DEFAULT_B2B_TIENDAS_GOURMET,
  DEFAULT_B2B_FERIAS,
  DEFAULT_B2B_REVENDEDORES,
  DEFAULT_B2B_SEGMENTS,
  DEFAULT_B2B_HUB_SETTINGS,
  parseB2BHubSettings,
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
      expect(parsed.material_badge).toBeTruthy();
      expect(parsed.material_title).toBeTruthy();
      expect(parsed.material_description).toBeTruthy();
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

  it('cada segmento canónico incluye entre 2 y 5 kits listos con estructura completa', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.kits).toBeDefined();
      expect(parsed.kits!.length).toBeGreaterThanOrEqual(2);
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
        expect(kit.integraciones_digitales.length).toBeGreaterThan(0);
        expect(kit.sales_strategy).toBeTruthy();
      }
    }
  });

  it('cada segmento canónico incluye una estrategia comercial con pasos de acción', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.commercial_strategy).toBeDefined();
      const strat = parsed.commercial_strategy!;
      expect(strat.titulo).toBeTruthy();
      expect(strat.bajada).toBeTruthy();
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

  it('cada segmento canónico incluye soporte de material físico y herramientas tangibles', () => {
    for (const slug of B2B_SEGMENT_SLUGS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.material_badge).toBeTruthy();
      expect(parsed.material_badge_en).toBeTruthy();
      expect(parsed.material_title).toBeTruthy();
      expect(parsed.material_title_en).toBeTruthy();
      expect(parsed.material_description).toBeTruthy();
      expect(parsed.material_description_en).toBeTruthy();
      expect(parsed.tabletop_title).toBeTruthy();
      expect(parsed.tabletop_title_en).toBeTruthy();
      expect(parsed.tabletop_subtitle).toBeTruthy();
      expect(parsed.tabletop_subtitle_en).toBeTruthy();
      expect(parsed.staff_title).toBeTruthy();
      expect(parsed.staff_title_en).toBeTruthy();
    }
  });

  it('permite sobrescribir material físico y herramientas tangibles vía raw JSON', () => {
    const raw = {
      material_badge: 'Material Custom de Sala',
      material_title: 'Herramientas Custom para el Espacio',
      material_description: 'Descripción custom de material físico para servicio.',
      tabletop_title: 'Tarjeta Custom de Mesa',
      tabletop_subtitle: 'Bajada custom de mesa.',
      staff_title: 'Pitch Custom de Ventas',
    };

    const parsed = parseB2BSegmentContent(raw, 'hoteles');
    expect(parsed.material_badge).toBe('Material Custom de Sala');
    expect(parsed.material_title).toBe('Herramientas Custom para el Espacio');
    expect(parsed.material_description).toBe('Descripción custom de material físico para servicio.');
    expect(parsed.tabletop_title).toBe('Tarjeta Custom de Mesa');
    expect(parsed.tabletop_subtitle).toBe('Bajada custom de mesa.');
    expect(parsed.staff_title).toBe('Pitch Custom de Ventas');
  });

  it('ignora raw contaminado de otro segmento cuando raw.slug no coincide con fallbackSlug', () => {
    const contaminatedFromCafeterias = {
      ...DEFAULT_B2B_CAFETERIAS,
      slug: 'cafeterias',
      hero_image: 'https://example.com/cafeterias.webp',
    };
    const parsedHoteles = parseB2BSegmentContent(contaminatedFromCafeterias, 'hoteles');
    expect(parsedHoteles.slug).toBe('hoteles');
    expect(parsedHoteles.headline).toBe(DEFAULT_B2B_HOTELES.headline);
    expect(parsedHoteles.hero_image).toBe(DEFAULT_B2B_HOTELES.hero_image);

    const parsedGourmet = parseB2BSegmentContent(contaminatedFromCafeterias, 'tiendas-gourmet');
    expect(parsedGourmet.slug).toBe('tiendas-gourmet');
    expect(parsedGourmet.headline).toBe(DEFAULT_B2B_TIENDAS_GOURMET.headline);
    expect(parsedGourmet.hero_image).toBe(DEFAULT_B2B_TIENDAS_GOURMET.hero_image);
  });
});

describe('B2B Hub Settings — Garantías del Canal Directo', () => {
  it('retorna defaults canónicos para las 4 garantías en ES y EN cuando raw es null', () => {
    const s = parseB2BHubSettings(null);
    expect(s.garantia1_title).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia1_title);
    expect(s.garantia1_title_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia1_title_en);
    expect(s.garantia1_desc).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia1_desc);
    expect(s.garantia1_desc_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia1_desc_en);

    expect(s.garantia2_title).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia2_title);
    expect(s.garantia2_title_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia2_title_en);
    expect(s.garantia2_desc).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia2_desc);
    expect(s.garantia2_desc_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia2_desc_en);

    expect(s.garantia3_title).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia3_title);
    expect(s.garantia3_title_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia3_title_en);
    expect(s.garantia3_desc).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia3_desc);
    expect(s.garantia3_desc_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia3_desc_en);

    expect(s.garantia4_title).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia4_title);
    expect(s.garantia4_title_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia4_title_en);
    expect(s.garantia4_desc).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia4_desc);
    expect(s.garantia4_desc_en).toBe(DEFAULT_B2B_HUB_SETTINGS.garantia4_desc_en);
  });

  it('permite personalizar y traducir los 4 bloques de garantías', () => {
    const s = parseB2BHubSettings({
      garantia1_title: 'Análisis Certificado',
      garantia1_title_en: 'Lab Certified',
      garantia1_desc: 'Control estricto de humedad.',
      garantia1_desc_en: 'Strict moisture control.',
      garantia2_title: 'Despacho Seguro',
      garantia2_desc: 'Reposición 100% garantizada.',
      garantia3_title: 'Facturación Rápida',
      garantia3_desc: 'Factura inmediata.',
      garantia4_title: 'Soporte Comercial',
      garantia4_desc: 'Material gráfico de apoyo.',
    });

    expect(s.garantia1_title).toBe('Análisis Certificado');
    expect(s.garantia1_title_en).toBe('Lab Certified');
    expect(s.garantia1_desc).toBe('Control estricto de humedad.');
    expect(s.garantia1_desc_en).toBe('Strict moisture control.');
    expect(s.garantia2_title).toBe('Despacho Seguro');
    expect(s.garantia2_desc).toBe('Reposición 100% garantizada.');
    expect(s.garantia3_title).toBe('Facturación Rápida');
    expect(s.garantia3_desc).toBe('Factura inmediata.');
    expect(s.garantia4_title).toBe('Soporte Comercial');
    expect(s.garantia4_desc).toBe('Material gráfico de apoyo.');
  });

  it('retorna defaults canónicos para Hero pills, Segmentos, Formulario y SEO', () => {
    const s = parseB2BHubSettings(null);
    expect(s.hero_secondary_cta_label).toBe(DEFAULT_B2B_HUB_SETTINGS.hero_secondary_cta_label);
    expect(s.hero_secondary_cta_href).toBe(DEFAULT_B2B_HUB_SETTINGS.hero_secondary_cta_href);
    expect(s.show_hero_pills).toBe(true);
    expect(s.pill1_title).toBe(DEFAULT_B2B_HUB_SETTINGS.pill1_title);
    expect(s.pill1_subtitle).toBe(DEFAULT_B2B_HUB_SETTINGS.pill1_subtitle);
    expect(s.pill2_title).toBe(DEFAULT_B2B_HUB_SETTINGS.pill2_title);
    expect(s.pill3_title).toBe(DEFAULT_B2B_HUB_SETTINGS.pill3_title);

    expect(s.segmentos_kicker).toBe(DEFAULT_B2B_HUB_SETTINGS.segmentos_kicker);
    expect(s.segmentos_title).toBe(DEFAULT_B2B_HUB_SETTINGS.segmentos_title);
    expect(s.segmentos_subtitle).toBe(DEFAULT_B2B_HUB_SETTINGS.segmentos_subtitle);
    expect(s.segmentos_cta_label).toBe(DEFAULT_B2B_HUB_SETTINGS.segmentos_cta_label);

    expect(s.seg_cafeterias_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_cafeterias_title);
    expect(s.seg_cafeterias_badge).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_cafeterias_badge);
    expect(s.seg_cafeterias_h1).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_cafeterias_h1);

    expect(s.seg_hoteles_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_hoteles_title);
    expect(s.seg_gourmet_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_gourmet_title);
    expect(s.seg_ferias_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_ferias_title);
    expect(s.seg_revendedores_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seg_revendedores_title);

    expect(s.form_kicker).toBe(DEFAULT_B2B_HUB_SETTINGS.form_kicker);
    expect(s.form_title).toBe(DEFAULT_B2B_HUB_SETTINGS.form_title);
    expect(s.form_subtitle).toBe(DEFAULT_B2B_HUB_SETTINGS.form_subtitle);

    expect(s.seo_title).toBe(DEFAULT_B2B_HUB_SETTINGS.seo_title);
    expect(s.seo_description).toBe(DEFAULT_B2B_HUB_SETTINGS.seo_description);
  });

  it('permite sobrescribir Hero pills, Segmentos, Formulario y SEO vía raw JSON', () => {
    const s = parseB2BHubSettings({
      hero_secondary_cta_label: 'Ver Formatos',
      hero_secondary_cta_label_en: 'See Formats',
      show_hero_pills: false,
      pill1_title: 'Pureza Absoluta',
      pill1_title_en: 'Absolute Purity',
      segmentos_title: 'Formatos para cada rubro',
      segmentos_title_en: 'Formats for every industry',
      seg_cafeterias_title: 'Cafeterías de Autor',
      seg_cafeterias_badge: 'Especialidad',
      seg_cafeterias_h1: 'Sachets biodegradables',
      form_title: 'Contáctanos hoy',
      form_title_en: 'Contact us today',
      seo_title: 'Alianzas B2B Exclusivas',
    });

    expect(s.hero_secondary_cta_label).toBe('Ver Formatos');
    expect(s.hero_secondary_cta_label_en).toBe('See Formats');
    expect(s.show_hero_pills).toBe(false);
    expect(s.pill1_title).toBe('Pureza Absoluta');
    expect(s.pill1_title_en).toBe('Absolute Purity');
    expect(s.segmentos_title).toBe('Formatos para cada rubro');
    expect(s.segmentos_title_en).toBe('Formats for every industry');
    expect(s.seg_cafeterias_title).toBe('Cafeterías de Autor');
    expect(s.seg_cafeterias_badge).toBe('Especialidad');
    expect(s.seg_cafeterias_h1).toBe('Sachets biodegradables');
    expect(s.form_title).toBe('Contáctanos hoy');
    expect(s.form_title_en).toBe('Contact us today');
    expect(s.seo_title).toBe('Alianzas B2B Exclusivas');
  });
});


