import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLUB_LEGADO_SETTINGS,
  DEFAULT_CLUB_PAGE_SETTINGS,
  parseClubLegadoSettings,
  parseClubPageSettings,
  DEFAULT_LANDING_SECTIONS,
  LANDING_SECTION_LABELS,
  LANDING_SECTION_EDITOR_KEY,
} from './store-chrome';

describe('ClubLegadoSettings (Home)', () => {
  it('usa defaults canónicos cuando raw es nulo o vacío', () => {
    const s = parseClubLegadoSettings(null);
    expect(s.title).toBe(DEFAULT_CLUB_LEGADO_SETTINGS.title);
    expect(s.kicker).toBe('Club Legado del Bosque');
    expect(s.button_href).toBe('/club-legado-del-bosque');
  });

  it('aplica overrides válidos y sanitiza el href', () => {
    const s = parseClubLegadoSettings({
      title: 'Nuevo título club',
      button_href: '/contacto',
      kicker_en: 'Legacy Club',
    });
    expect(s.title).toBe('Nuevo título club');
    expect(s.button_href).toBe('/contacto');
    expect(s.kicker_en).toBe('Legacy Club');
  });

  it('está registrado en DEFAULT_LANDING_SECTIONS y mapeos', () => {
    const found = DEFAULT_LANDING_SECTIONS.find((sec) => sec.id === 'club_legado');
    expect(found).toBeDefined();
    expect(found?.enabled).toBe(true);
    expect(LANDING_SECTION_LABELS.club_legado).toBe('Club Legado');
    expect(LANDING_SECTION_EDITOR_KEY.club_legado).toBe('club_legado_settings');
  });
});

describe('ClubPageSettings (/club-legado-del-bosque)', () => {
  it('usa defaults canónicos cuando raw es nulo', () => {
    const s = parseClubPageSettings(null);
    expect(s.hero_title).toBe(DEFAULT_CLUB_PAGE_SETTINGS.hero_title);
    expect(s.hero_kicker).toBe('Círculo de Guardianes');
    expect(s.hero_badge).toBe('Recolección Estacional Activa');
    expect(s.hero_image).toBe('/assets/editorial/hero-bosque-apertura.jpg');
    expect(s.how_it_works_title).toBe('Cómo funciona');
    expect(s.custodia_badge).toBe('Presencia Territorial Activa');
  });

  it('aplica overrides correctamente', () => {
    const s = parseClubPageSettings({
      hero_kicker: 'Alianza Nativa',
      hero_badge: 'Edición 2026',
      hero_title: 'Membresía del Bosque',
      step1_text: 'Paso 1 personalizado',
      custodia_title: 'Título de custodia nuevo',
    });
    expect(s.hero_kicker).toBe('Alianza Nativa');
    expect(s.hero_badge).toBe('Edición 2026');
    expect(s.hero_title).toBe('Membresía del Bosque');
    expect(s.step1_text).toBe('Paso 1 personalizado');
    expect(s.custodia_title).toBe('Título de custodia nuevo');
    expect(s.how_it_works_title).toBe(DEFAULT_CLUB_PAGE_SETTINGS.how_it_works_title);
  });
});
