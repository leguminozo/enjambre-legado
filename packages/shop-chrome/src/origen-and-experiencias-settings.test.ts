import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ORIGEN_SETTINGS,
  parseOrigenSettings,
  DEFAULT_ULMO_MONOGRAPH,
  DEFAULT_BOTANICAL_MONOGRAPHS,
  parseBotanicalMonograph,
  parseBotanicalMonographs,
  DEFAULT_EXPERIENCIAS_SETTINGS,
  parseExperienciasSettings,
  DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS,
  parseFloracionesExperienceSettings,
  DEFAULT_QR_SCAN_SETTINGS,
  parseQrScanSettings,
} from './store-chrome';

describe('Origen & Botanical Monographs Settings', () => {
  it('parseOrigenSettings retorna defaults canónicos cuando raw es null', () => {
    const parsed = parseOrigenSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_ORIGEN_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_ORIGEN_SETTINGS.title);
    expect(parsed.description).toBe(DEFAULT_ORIGEN_SETTINGS.description);
  });

  it('parseOrigenSettings aplica overrides válidos', () => {
    const parsed = parseOrigenSettings({
      kicker: 'Chiloé Ancestral',
      title: 'Territorio de Bosque Nativo',
    });
    expect(parsed.kicker).toBe('Chiloé Ancestral');
    expect(parsed.title).toBe('Territorio de Bosque Nativo');
    expect(parsed.description).toBe(DEFAULT_ORIGEN_SETTINGS.description);
  });

  it('parseBotanicalMonograph retorna la monografía canónica de Ulmo', () => {
    const parsed = parseBotanicalMonograph(null, 'ulmo');
    expect(parsed.common_name).toBe(DEFAULT_ULMO_MONOGRAPH.common_name);
    expect(parsed.scientific_name).toBe(DEFAULT_ULMO_MONOGRAPH.scientific_name);
    expect(parsed.sensory_profile).toBe(DEFAULT_ULMO_MONOGRAPH.sensory_profile);
  });

  it('parseBotanicalMonograph admite overrides en fichas botánicas', () => {
    const parsed = parseBotanicalMonograph(
      {
        slug: 'ulmo',
        common_name: 'Ulmo del Fiordo',
        sensory_profile: 'Blanco cremoso puro con vainilla silvestre',
      },
      'ulmo',
    );
    expect(parsed.common_name).toBe('Ulmo del Fiordo');
    expect(parsed.sensory_profile).toBe('Blanco cremoso puro con vainilla silvestre');
    expect(parsed.scientific_name).toBe(DEFAULT_ULMO_MONOGRAPH.scientific_name);
    expect(parsed.faqs?.[0]?.question).toBe(DEFAULT_ULMO_MONOGRAPH.faqs?.[0]?.question);
  });

  it('parseBotanicalMonograph admite FAQs propias', () => {
    const parsed = parseBotanicalMonograph(
      {
        slug: 'tiaca',
        common_name: 'Tiaca',
        faqs: [{ question: '¿Cuándo florece la tiaca?', answer: 'En primavera austral.' }],
      },
      'ulmo',
    );
    expect(parsed.faqs).toEqual([
      { question: '¿Cuándo florece la tiaca?', answer: 'En primavera austral.', question_en: undefined, answer_en: undefined },
    ]);
  });

  it('parseBotanicalMonographs maneja arrays y devuelve lista segura', () => {
    const list = parseBotanicalMonographs(null);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].slug).toBe('ulmo');
  });
});

describe('Experiencias Settings', () => {
  it('parseExperienciasSettings entrega catálogo de talleres por omisión', () => {
    const parsed = parseExperienciasSettings(null);
    expect(parsed.hero_kicker).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_kicker);
    expect(parsed.hero_title).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_title);
    expect(parsed.flagship_title).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.flagship_title);
    expect(parsed.flagship_href).toBe('/experiencias/degustaciones');
  });

  it('parseFloracionesExperienceSettings retorna ficha completa de cata sensorial', () => {
    const parsed = parseFloracionesExperienceSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS.title);
    expect(parsed.movements.length).toBe(4);
    expect(parsed.formats.length).toBe(3);
    expect(parsed.bio_name).toBe(DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS.bio_name);
    expect(parsed.faq.length).toBe(5);
  });

  it('parseFloracionesExperienceSettings aplica personalización de facilitadora y formatos', () => {
    const parsed = parseFloracionesExperienceSettings({
      bio_name: 'Cristina Miranda Pérez',
      bio_location: 'Pureo, Queilén · Chiloé Profundo',
      formats: [
        {
          id: 'vip',
          title: 'Sesión Privada Chiloé',
          capacity: 'Hasta 4 participantes',
          duration: '90 minutos',
          kicker: 'Exclusivo',
          context: 'En residencia privada',
          summary: 'Recorrido exclusivo con recolección directa.',
          includes: ['Muestras técnicas', 'Cata guiada'],
        },
      ],
    });
    expect(parsed.bio_name).toBe('Cristina Miranda Pérez');
    expect(parsed.bio_location).toBe('Pureo, Queilén · Chiloé Profundo');
    expect(parsed.formats.length).toBe(1);
    expect(parsed.formats[0].title).toBe('Sesión Privada Chiloé');
    expect(parsed.formats[0].includes).toEqual(['Muestras técnicas', 'Cata guiada']);
    expect(parsed.movements.length).toBe(4);
  });

  it('parseFloracionesExperienceSettings admite relato, métricas y elementos de movimiento', () => {
    const parsed = parseFloracionesExperienceSettings({
      bio_paragraphs: ['Maestría apícola en Pureo.', 'Lluvia casi todo el año.'],
      bio_metrics: [{ value: '22 años', label: 'De maestría' }],
      movements: [
        {
          step: 'I',
          title: 'Apertura',
          description: 'Silencio y copa.',
          elements: ['Copa ISO', 'Agua'],
        },
      ],
    });
    expect(parsed.bio_paragraphs).toEqual(['Maestría apícola en Pureo.', 'Lluvia casi todo el año.']);
    expect(parsed.bio_metrics).toEqual([{ value: '22 años', label: 'De maestría' }]);
    expect(parsed.movements).toHaveLength(1);
    expect(parsed.movements[0].elements).toEqual(['Copa ISO', 'Agua']);
    expect(parsed.formats.length).toBe(3);
  });

  it('listas vacías en Cata no borran el default público', () => {
    const parsed = parseFloracionesExperienceSettings({
      faq: [],
      movements: [],
      formats: [],
      bio_paragraphs: [],
      bio_metrics: [],
    });
    expect(parsed.faq.length).toBe(DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS.faq.length);
    expect(parsed.movements.length).toBe(4);
    expect(parsed.formats.length).toBe(3);
    expect(parsed.bio_paragraphs.length).toBeGreaterThan(0);
    expect(parsed.bio_metrics.length).toBeGreaterThan(0);
  });
});

describe('Trazabilidad QR Settings', () => {
  it('parseQrScanSettings retorna defaults canónicos', () => {
    const parsed = parseQrScanSettings(null);
    expect(parsed.title).toBe(DEFAULT_QR_SCAN_SETTINGS.title);
    expect(parsed.subtitle).toBe(DEFAULT_QR_SCAN_SETTINGS.subtitle);
    expect(parsed.search_label).toBe(DEFAULT_QR_SCAN_SETTINGS.search_label);
    expect(parsed.valid_title).toBe(DEFAULT_QR_SCAN_SETTINGS.valid_title);
  });

  it('parseQrScanSettings permite personalizar títulos y sellos de custodia', () => {
    const parsed = parseQrScanSettings({
      title: 'Consulta de Trazabilidad Apícola',
      valid_title: 'Sello Criptográfico de Origen',
    });
    expect(parsed.title).toBe('Consulta de Trazabilidad Apícola');
    expect(parsed.valid_title).toBe('Sello Criptográfico de Origen');
    expect(parsed.subtitle).toBe(DEFAULT_QR_SCAN_SETTINGS.subtitle);
  });
});
