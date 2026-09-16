import { describe, expect, it } from 'vitest';
import {
  parseB2BSegmentContent,
  parseOrigenSettings,
  parseBotanicalMonographs,
  parseBotanicalMonograph,
  parseExperienciasSettings,
  parseFloracionesExperienceSettings,
  parseQrScanSettings,
  DEFAULT_B2B_CAFETERIAS,
  DEFAULT_ORIGEN_SETTINGS,
  DEFAULT_BOTANICAL_MONOGRAPHS,
  DEFAULT_EXPERIENCIAS_SETTINGS,
  DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS,
  DEFAULT_QR_SCAN_SETTINGS,
} from '@enjambre/shop-chrome';

describe('CMS Extended Pages - Parsers and Fallbacks', () => {
  describe('B2B Segments', () => {
    it('falls back to default cafeterias content on null/invalid input', () => {
      const parsed = parseB2BSegmentContent(null, 'cafeterias');
      expect(parsed.headline).toBe(DEFAULT_B2B_CAFETERIAS.headline);
      expect(parsed.value_props.length).toBe(DEFAULT_B2B_CAFETERIAS.value_props.length);
      expect(parsed.faq.length).toBe(DEFAULT_B2B_CAFETERIAS.faq.length);
    });

    it('parses customized B2B segment content cleanly', () => {
      const custom = {
        headline: 'Alianza Cafeterías de Especialidad',
        kicker: 'Miel nativa de autor en barra',
        subheadline: 'Perfil sensorial certificado de Chiloé.',
        cta_text: 'Solicitar Muestra',
      };
      const parsed = parseB2BSegmentContent(custom, 'cafeterias');
      expect(parsed.headline).toBe('Alianza Cafeterías de Especialidad');
      expect(parsed.kicker).toBe('Miel nativa de autor en barra');
      expect(parsed.subheadline).toBe('Perfil sensorial certificado de Chiloé.');
      expect(parsed.cta_text).toBe('Solicitar Muestra');
    });
  });

  describe('Origen and Botanical Monographs', () => {
    it('falls back to default origen settings on invalid input', () => {
      const parsed = parseOrigenSettings(undefined);
      expect(parsed.title).toBe(DEFAULT_ORIGEN_SETTINGS.title);
      expect(parsed.kicker).toBe(DEFAULT_ORIGEN_SETTINGS.kicker);
      expect(parsed.description).toBe(DEFAULT_ORIGEN_SETTINGS.description);
    });

    it('parses customized origen settings', () => {
      const custom = {
        title: 'El Santuario Territorial',
        description: 'Un refugio glaciar milenario en el archipiélago.',
      };
      const parsed = parseOrigenSettings(custom);
      expect(parsed.title).toBe('El Santuario Territorial');
      expect(parsed.description).toBe('Un refugio glaciar milenario en el archipiélago.');
      expect(parsed.kicker).toBe(DEFAULT_ORIGEN_SETTINGS.kicker);
    });

    it('parses botanical monographs list and falls back to default catalogue', () => {
      const parsed = parseBotanicalMonographs(null);
      expect(parsed.length).toBe(DEFAULT_BOTANICAL_MONOGRAPHS.length);
      expect(parsed[0].slug).toBe('ulmo');
      expect(parsed[0].common_name).toBe('Ulmo');
    });

    it('handles custom monograph items alongside defaults', () => {
      const customItems = [
        {
          slug: 'ulmo',
          common_name: 'Ulmo de Recolección Tardía',
          scientific_name: 'Eucryphia cordifolia',
          flowering_period: 'Marzo a Abril',
          sensory_profile: 'Aroma a jazmín y corteza húmeda',
          short_description: 'Recolectada exclusivamente en las laderas altas de Pureo.',
          full_description: 'Estudio botánico detallado de la floración tardía.',
          ecology: 'Bosque húmedo templado valdiviano.',
        },
      ];
      const parsed = parseBotanicalMonographs(customItems);
      expect(parsed.length).toBe(1);
      expect(parsed[0].common_name).toBe('Ulmo de Recolección Tardía');
      expect(parsed[0].flowering_period).toBe('Marzo a Abril');
    });

    it('parses individual monograph with fallback', () => {
      const parsed = parseBotanicalMonograph(null, 'ulmo');
      expect(parsed.slug).toBe('ulmo');
      expect(parsed.scientific_name).toContain('Eucryphia');
    });
  });

  describe('Experiencias and Floraciones', () => {
    it('falls back to default experiencias program settings', () => {
      const parsed = parseExperienciasSettings({});
      expect(parsed.hero_title).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_title);
      expect(parsed.hero_kicker).toBe(DEFAULT_EXPERIENCIAS_SETTINGS.hero_kicker);
    });

    it('parses custom floraciones experience settings', () => {
      const custom = {
        title: 'Cata Maestra de Floraciones Nativas',
        bio_name: 'Cristina Miranda Bahamonde',
        bio_trajectory_years: 20,
      };
      const parsed = parseFloracionesExperienceSettings(custom);
      expect(parsed.title).toBe('Cata Maestra de Floraciones Nativas');
      expect(parsed.bio_name).toBe('Cristina Miranda Bahamonde');
      expect(parsed.bio_trajectory_years).toBe(20);
      expect(parsed.kicker).toBe(DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS.kicker);
    });
  });

  describe('QR Scan Traceability Settings', () => {
    it('falls back to default QR scan settings', () => {
      const parsed = parseQrScanSettings(null);
      expect(parsed.title).toBe(DEFAULT_QR_SCAN_SETTINGS.title);
      expect(parsed.search_label).toBe(DEFAULT_QR_SCAN_SETTINGS.search_label);
      expect(parsed.valid_title).toBe(DEFAULT_QR_SCAN_SETTINGS.valid_title);
    });

    it('parses custom QR scan settings', () => {
      const custom = {
        title: 'Verificador de Autenticidad Territorial',
        subtitle: 'Ingresa el código grabado en la tapa o etiqueta de tu frasco.',
        search_button_label: 'Verificar Sello',
        valid_title: 'Sello de Autenticidad Verificado',
      };
      const parsed = parseQrScanSettings(custom);
      expect(parsed.title).toBe('Verificador de Autenticidad Territorial');
      expect(parsed.subtitle).toBe('Ingresa el código grabado en la tapa o etiqueta de tu frasco.');
      expect(parsed.search_button_label).toBe('Verificar Sello');
      expect(parsed.valid_title).toBe('Sello de Autenticidad Verificado');
      expect(parsed.search_placeholder).toBe(DEFAULT_QR_SCAN_SETTINGS.search_placeholder);
    });
  });
});
