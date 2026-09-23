import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLUB_LEGADO_SETTINGS,
  DEFAULT_CLUB_PAGE_SETTINGS,
  parseClubLegadoSettings,
  parseClubPageSettings,
  parseB2BHubSettings,
  parseExperienciasSettings,
  parseCienciaSettings,
  parseNosotrosSettings,
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
    expect(s.hero_kicker).toBe(DEFAULT_CLUB_PAGE_SETTINGS.hero_kicker);
    expect(s.hero_badge).toBe(DEFAULT_CLUB_PAGE_SETTINGS.hero_badge);
    expect(s.hero_image).toBe('/assets/editorial/hero-bosque-apertura.jpg');
    expect(s.how_it_works_title).toBe('Cómo funciona');
    expect(s.custodia_badge).toBe(DEFAULT_CLUB_PAGE_SETTINGS.custodia_badge);
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
    expect(s.how_it_works_title).toBe(DEFAULT_CLUB_PAGE_SETTINGS.how_it_works_title);
    expect(s.hero_image_opacity).toBe(35);
  });

  it('preserva cadenas vacías cuando el usuario borra un campo (sin forzar fallback)', () => {
    const s = parseClubPageSettings({
      hero_badge: '',
      hero_kicker: '',
      hero_image_opacity: 80,
      show_hero_card: false,
      beneficios_title: 'Nuevos privilegios',
    });
    expect(s.hero_badge).toBe('');
    expect(s.hero_kicker).toBe('');
    expect(s.hero_image_opacity).toBe(80);
    expect(s.show_hero_card).toBe(false);
    expect(s.beneficios_title).toBe('Nuevos privilegios');
  });
});

describe('Editorial Heroes Opacity & Empty Fields Unification', () => {
  it('B2BHubSettings soporta hero_image_opacity y preservación de campos', () => {
    const s = parseB2BHubSettings(null);
    expect(s.hero_image_opacity).toBe(35);
    expect(s.show_garantias).toBe(true);

    const custom = parseB2BHubSettings({
      hero_image_opacity: 60,
      hero_kicker: '',
      show_garantias: false,
    });
    expect(custom.hero_image_opacity).toBe(60);
    expect(custom.hero_kicker).toBe('');
    expect(custom.show_garantias).toBe(false);
  });

  it('ExperienciasSettings soporta hero_image_opacity y show_flagship_card', () => {
    const s = parseExperienciasSettings(null);
    expect(s.hero_image_opacity).toBe(45);
    expect(s.show_flagship_card).toBe(true);

    const custom = parseExperienciasSettings({
      hero_image_opacity: 20,
      show_flagship_card: false,
    });
    expect(custom.hero_image_opacity).toBe(20);
    expect(custom.show_flagship_card).toBe(false);
  });

  it('CienciaSettings y NosotrosSettings procesan hero_image_opacity', () => {
    const c = parseCienciaSettings(null);
    expect(c.hero_image_opacity).toBe(25);

    const n = parseNosotrosSettings(null);
    expect(n.hero_image_opacity).toBe(100);

    const customC = parseCienciaSettings({ hero_image_opacity: 50 });
    expect(customC.hero_image_opacity).toBe(50);
  });
});

