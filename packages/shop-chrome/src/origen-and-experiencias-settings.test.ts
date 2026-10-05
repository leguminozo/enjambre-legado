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
  DEFAULT_EXPERIENCIAS_PUREO_SETTINGS,
  parseExperienciasPureoSettings,
  DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS,
  parseExperienciasTalleresSettings,
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

  it('parseBotanicalMonographs maneja arrays y devuelve lista segura de 7 especies', () => {
    const list = parseBotanicalMonographs(null);
    expect(list.length).toBe(7);
    expect(list[0].slug).toBe('ulmo');
    expect(list[1].slug).toBe('tiaca');
    expect(list[2].slug).toBe('meli');
    expect(list[3].slug).toBe('tepu');
    expect(list[4].slug).toBe('quillay');
    expect(list[5].slug).toBe('avellano');
    expect(list[6].slug).toBe('arrayan_tepa');
  });

  it('parseBotanicalMonographs aplana arrays anidados de migraciones legadas', () => {
    const legacyNested = [[{ slug: 'ulmo', common_name: 'Ulmo de Pureo' }]];
    const list = parseBotanicalMonographs(legacyNested);
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe('ulmo');
    expect(list[0].common_name).toBe('Ulmo de Pureo');
  });
});

describe('Experiencias Settings', () => {
  it('parseExperienciasSettings entrega catálogo de talleres por omisión', () => {
    const parsed = parseExperienciasSettings(null);
    expect(parsed.hero_kicker).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_kicker);
    expect(parsed.hero_title).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_title);
    expect(parsed.flagship_title).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.flagship_title);
    expect(parsed.flagship_href).toBe('/experiencias/degustaciones');
    expect(parsed.flagship_image).toBe('/assets/editorial/honey-jar.png');
    expect(parsed.card1_title).toBe('Territorio & Bosque Austral');
    expect(parsed.flagship_tag).toBe('02 · Cata Sensorial · Nacional');
    expect(parsed.flagship_format).toBe('Mieles de contraste: Atacama a Patagonia');
    expect(parsed.flagship_capacity).toBe('Aforo: Corporativo (10-20) | Íntimo (6-10)');
    expect(parsed.flagship_duration).toBe('Duración: 90 a 120 minutos continuos');
    expect(parsed.talleres_kicker).toBe('Agenda de Formación');
    expect(parsed.talleres_title).toBe('Próximos Talleres y Encuentros');
    expect(parsed.talleres_subtitle).toBe('Fechas confirmadas y programas especiales en Chiloé y Santiago.');
    expect(parsed.card3_title).toBe('Talleres de Técnica Apícola');
    expect(parsed.trilogia_title).toBe('Tres formas de conectar con el bosque');
    expect(parsed.specs_badge1_label).toBe('3 Vertientes');
  });

  it('parseExperienciasSettings admite overrides en tarjetas 1, 2 y 3', () => {
    const parsed = parseExperienciasSettings({
      card1_title: 'Estadía en Predio Pureo',
      card1_title_en: 'Pureo Estate Stay',
      flagship_tag: '02 · Degustación de Autor',
      flagship_tag_en: '02 · Signature Tasting',
      flagship_format: 'Mieles de Ulmo y Tiaca',
      flagship_format_en: 'Ulmo and Tiaca honeys',
      flagship_capacity: 'Exclusivo 8 personas',
      flagship_capacity_en: 'Exclusive 8 people',
      flagship_duration: '60 minutos',
      flagship_duration_en: '60 minutes',
      flagship_image: 'https://images.example.com/cata-degustacion.jpg',
      card3_title: 'Formación Apícola Austral',
      card3_title_en: 'Southern Beekeeping Training',
      talleres_kicker: 'Encuentros 2026',
      talleres_title: 'Talleres Presenciales',
      talleres_subtitle: 'Inscripción abierta',
    });
    expect(parsed.card1_title).toBe('Estadía en Predio Pureo');
    expect(parsed.card1_title_en).toBe('Pureo Estate Stay');
    expect(parsed.flagship_tag).toBe('02 · Degustación de Autor');
    expect(parsed.flagship_tag_en).toBe('02 · Signature Tasting');
    expect(parsed.flagship_format).toBe('Mieles de Ulmo y Tiaca');
    expect(parsed.flagship_format_en).toBe('Ulmo and Tiaca honeys');
    expect(parsed.flagship_capacity).toBe('Exclusivo 8 personas');
    expect(parsed.flagship_capacity_en).toBe('Exclusive 8 people');
    expect(parsed.flagship_duration).toBe('60 minutos');
    expect(parsed.flagship_duration_en).toBe('60 minutes');
    expect(parsed.flagship_image).toBe('https://images.example.com/cata-degustacion.jpg');
    expect(parsed.card3_title).toBe('Formación Apícola Austral');
    expect(parsed.card3_title_en).toBe('Southern Beekeeping Training');
    expect(parsed.talleres_kicker).toBe('Encuentros 2026');
    expect(parsed.talleres_title).toBe('Talleres Presenciales');
    expect(parsed.talleres_subtitle).toBe('Inscripción abierta');
    expect(parsed.card1_cta_href).toBe('/experiencias/territorio');
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

describe('Experiencias Pureo (Territorio) Settings', () => {
  it('parseExperienciasPureoSettings retorna defaults canónicos', () => {
    const parsed = parseExperienciasPureoSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_EXPERIENCIAS_PUREO_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_EXPERIENCIAS_PUREO_SETTINGS.title);
    expect(parsed.pilares_kicker).toBe('Ejes de la Estadía');
    expect(parsed.pilares_title).toBe('Tres dimensiones del territorio insular');
    expect(parsed.cabana_badge).toBe('Fogón y combustión lenta');
    expect(parsed.kayak_badge).toBe('Esteros y arrayanales costeros');
    expect(parsed.apiturismo_badge).toBe('Equipo de seguridad incluido');
    expect(parsed.solicitud_kicker).toBe('Reserva de Fechas');
    expect(parsed.solicitud_title).toBe('Solicitud de Inmersión Territorial');
  });

  it('parseExperienciasPureoSettings admite overrides de distintivos y formulario', () => {
    const parsed = parseExperienciasPureoSettings({
      pilares_kicker: 'Ejes de Experiencia',
      pilares_title: 'Dimensiones del Santuario',
      cabana_badge: 'Arquitectura vernácula y calor a leña',
      kayak_badge: 'Ruta marina entre cisnes',
      apiturismo_badge: 'Traje de protección integral',
      solicitud_kicker: 'Agenda Tu Visita',
      solicitud_title: 'Coordinación de Estadía',
    });
    expect(parsed.pilares_kicker).toBe('Ejes de Experiencia');
    expect(parsed.pilares_title).toBe('Dimensiones del Santuario');
    expect(parsed.cabana_badge).toBe('Arquitectura vernácula y calor a leña');
    expect(parsed.kayak_badge).toBe('Ruta marina entre cisnes');
    expect(parsed.apiturismo_badge).toBe('Traje de protección integral');
    expect(parsed.solicitud_kicker).toBe('Agenda Tu Visita');
    expect(parsed.solicitud_title).toBe('Coordinación de Estadía');
  });
});

describe('Experiencias Talleres Settings', () => {
  it('parseExperienciasTalleresSettings retorna defaults canónicos', () => {
    const parsed = parseExperienciasTalleresSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS.title);
    expect(parsed.curatoria_kicker).toBe('Curatoria Pedagógica');
    expect(parsed.curatoria_title).toBe('Líneas de aprendizaje e inmersión');
    expect(parsed.programa1_tag).toBe('Metodología de Cata');
    expect(parsed.programa1_spec1).toBe('Rueda de descriptores y fichas técnicas');
    expect(parsed.programa1_spec2).toBe('Duración: 2.5 horas');
    expect(parsed.programa2_tag).toBe('Manejo Respetuoso');
    expect(parsed.programa3_tag).toBe('Ecología del Bosque');
    expect(parsed.convocatorias_kicker).toBe('Convocatorias Abiertas');
    expect(parsed.convocatorias_title).toBe('Próximas fechas programadas');
  });

  it('parseExperienciasTalleresSettings admite overrides de programas y especificaciones', () => {
    const parsed = parseExperienciasTalleresSettings({
      curatoria_kicker: 'Malla Curricular',
      curatoria_title: 'Programas de Formación',
      programa1_tag: 'Módulo Sensorial I',
      programa1_spec1: 'Set de 6 mieles nativas',
      programa1_spec2: 'Duración: 3 horas',
      convocatorias_kicker: 'Fechas 2026',
      convocatorias_title: 'Agenda Abierta',
    });
    expect(parsed.curatoria_kicker).toBe('Malla Curricular');
    expect(parsed.curatoria_title).toBe('Programas de Formación');
    expect(parsed.programa1_tag).toBe('Módulo Sensorial I');
    expect(parsed.programa1_spec1).toBe('Set de 6 mieles nativas');
    expect(parsed.programa1_spec2).toBe('Duración: 3 horas');
    expect(parsed.convocatorias_kicker).toBe('Fechas 2026');
    expect(parsed.convocatorias_title).toBe('Agenda Abierta');
  });
});
