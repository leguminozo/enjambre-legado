import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLUB_LEGADO_SETTINGS,
  DEFAULT_CLUB_PAGE_SETTINGS,
  DEFAULT_IDENTIDAD_SETTINGS,
  DEFAULT_MAP_SETTINGS,
  parseClubLegadoSettings,
  parseClubPageSettings,
  parseB2BHubSettings,
  parseExperienciasSettings,
  parseCienciaSettings,
  parseNosotrosSettings,
  parseIdentidadSettings,
  parseMapSettings,
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
    expect(s.card_image).toBe('/assets/editorial/experiencias.jpg');
    expect(s.show_card).toBe(true);
  });

  it('aplica overrides válidos y sanitiza el href', () => {
    const s = parseClubLegadoSettings({
      title: 'Nuevo título club',
      button_href: '/contacto',
      kicker_en: 'Legacy Club',
      card_image: '/uploads/club-nueva.jpg',
      card_benefit_1: 'Beneficio a medida',
    });
    expect(s.title).toBe('Nuevo título club');
    expect(s.button_href).toBe('/contacto');
    expect(s.kicker_en).toBe('Legacy Club');
    expect(s.card_image).toBe('/uploads/club-nueva.jpg');
    expect(s.card_benefit_1).toBe('Beneficio a medida');
  });

  it('preserva cadenas vacías (vacío = no se muestra nada) y respeta show_card', () => {
    const s = parseClubLegadoSettings({
      trust_label: '',
      card_kicker: '',
      card_benefit_1: '',
      card_title: '',
      show_card: false,
    });
    expect(s.trust_label).toBe('');
    expect(s.card_kicker).toBe('');
    expect(s.card_benefit_1).toBe('');
    expect(s.card_title).toBe('');
    expect(s.show_card).toBe(false);
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

  it('expone tarjetas de privilegios y ciclos editables con defaults actuales', () => {
    const s = parseClubPageSettings(null);
    expect(s.beneficio_1_tag).toBe('01 · Reposición a Medida');
    expect(s.beneficio_6_title).toBe('Tu perfil como credencial viva');
    expect(s.tiers_kicker).toBe('Comunidad de Clientes');
    expect(s.tier_1_title).toBe('Guardián Obrera');
    expect(s.tier_4_foot).toBe('Microlotes de autor y prioridad en estadías Pureo');
    expect(s.wallet_kicker).toBe('Credencial Digital');
    expect(s.retorno_kicker).toBe('Economía Circular');
  });

  it('preserva vacíos en tarjetas (vacío = la tarjeta no se muestra)', () => {
    const s = parseClubPageSettings({
      beneficio_1_tag: '',
      beneficio_1_title: '',
      beneficio_1_desc: '',
      tier_2_title: '',
      tier_2_foot: '',
      wallet_kicker: '',
    });
    expect(s.beneficio_1_tag).toBe('');
    expect(s.beneficio_1_title).toBe('');
    expect(s.beneficio_1_desc).toBe('');
    expect(s.tier_2_title).toBe('');
    expect(s.tier_2_foot).toBe('');
    expect(s.wallet_kicker).toBe('');
    expect(s.beneficio_2_tag).toBe(DEFAULT_CLUB_PAGE_SETTINGS.beneficio_2_tag);
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

describe('ClubPageSettings floraciones (Catálogo Estacional)', () => {
  it('usa el copy actual como defaults', () => {
    const s = parseClubPageSettings(null);
    expect(s.flor_1_nombre).toBe('Ulmo');
    expect(s.flor_1_cientifico).toBe('Eucryphia cordifolia');
    expect(s.flor_1_cata).toContain('Floral delicado');
    expect(s.flor_4_nombre).toBe('Multifloral del bosque');
    expect(s.seasons_note).toContain('plan trimestral');
  });

  it('preserva vacíos (nombre vacío = ocultar tarjeta)', () => {
    const s = parseClubPageSettings({
      flor_2_nombre: '',
      flor_2_cata: '',
      seasons_note: '',
    });
    expect(s.flor_2_nombre).toBe('');
    expect(s.flor_2_cata).toBe('');
    expect(s.seasons_note).toBe('');
    expect(s.flor_1_nombre).toBe('Ulmo');
  });
});

describe('MapSettings (Home / Origen)', () => {
  it('usa defaults editoriales cuando raw es nulo', () => {
    const s = parseMapSettings(null);
    expect(s.kicker).toBe('Ubicación');
    expect(s.title).toBe(DEFAULT_MAP_SETTINGS.title);
    expect(s.subtitle).toBe('Pureo Rural km 8560 — Queilén — Chiloé');
    expect(s.card_label).toBe('Pureo rural km 8560 · Queilén');
    expect(s.cta_href).toBe('/nosotros');
  });

  it('preserva vacíos (vacío = no se muestra nada)', () => {
    const s = parseMapSettings({
      kicker: '',
      title: '',
      subtitle: '',
      popup_title: '',
      popup_body: '',
      card_label: '',
      quote: '',
      cta_label: '',
    });
    expect(s.kicker).toBe('');
    expect(s.title).toBe('');
    expect(s.subtitle).toBe('');
    expect(s.popup_title).toBe('');
    expect(s.popup_body).toBe('');
    expect(s.card_label).toBe('');
    expect(s.quote).toBe('');
    expect(s.cta_label).toBe('');
  });
});

describe('IdentidadSettings (Home)', () => {
  it('expone alt editable y recorta espacios', () => {
    const s = parseIdentidadSettings({ image_alt: '  Apiarios  ', kicker: '  Hola  ' });
    expect(s.image_alt).toBe('Apiarios');
    expect(s.kicker).toBe('Hola');
    expect(s.image_alt_en).toBe(DEFAULT_IDENTIDAD_SETTINGS.image_alt_en);
  });

  it('preserva vacíos (vacío = no se muestra nada)', () => {
    const s = parseIdentidadSettings({ kicker: '', title: '', desc: '', body: '' });
    expect(s.kicker).toBe('');
    expect(s.title).toBe('');
    expect(s.desc).toBe('');
    expect(s.body).toBe('');
  });
});

