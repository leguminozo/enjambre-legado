import { describe, expect, it } from 'vitest';
import { AUTO_PUBLISH_SECTIONS, CMS_SECTION_KEYS } from '@/lib/editor-tienda-sections';
import { EDITOR_SECTIONS, SECTION_SCHEMA_BY_KEY } from '@/lib/editor-tienda-schema';

describe('registro de schemas del editor', () => {
  it('cubre todas las section_keys del CMS (sin huérfanas)', () => {
    for (const key of CMS_SECTION_KEYS) {
      expect(SECTION_SCHEMA_BY_KEY[key], `schema faltante para ${key}`).toBeDefined();
    }
    const registryKeys = new Set(EDITOR_SECTIONS.map((s) => s.id));
    expect(registryKeys.size).toBe(EDITOR_SECTIONS.length); // sin ids duplicados
  });

  it('publishMode del registro coincide con AUTO_PUBLISH_SECTIONS (contrato del BFF)', () => {
    const autoByRegistry = new Set(
      EDITOR_SECTIONS.filter((s) => s.publishMode === 'auto').map((s) => s.id),
    );
    const autoByBff = new Set(AUTO_PUBLISH_SECTIONS);
    expect(autoByRegistry).toEqual(autoByBff);
  });

  it('los customEditor tienen editor real en ChromeSettingsEditor o rama propia', () => {
    const customs = EDITOR_SECTIONS.filter((s) => s.customEditor).map((s) => s.id);
    // menu_settings se maneja aparte (MenuSettingsEditor); el resto son cases
    // del switch de ChromeSettingsEditor (theme, brand, products, seasonal,
    // typography, landing_layout).
    for (const id of customs) {
      expect(
        id === 'menu_settings' ||
          ['theme_settings', 'brand_assets', 'products_settings', 'seasonal_settings', 'typography_settings', 'landing_layout'].includes(id),
        `customEditor sin editor conocido: ${id}`,
      ).toBe(true);
    }
  });

  it('los items/pair no entran en SETTINGS_SECTION_KEYS (rama de fichas)', () => {
    // SETTINGS_SECTION_KEYS vive en un componente 'use client' (no importable
    // en test puro) — validamos el invariante inverso: todo *_settings del
    // registro es kind settings.
    for (const s of EDITOR_SECTIONS) {
      if (s.id.endsWith('_settings')) {
        expect(s.kind.kind, `${s.id} debería ser settings`).toBe('settings');
      }
    }
  });
});
