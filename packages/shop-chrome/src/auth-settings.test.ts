import { describe, it, expect } from 'vitest';
import {
  parseAuthSettings,
  DEFAULT_AUTH_SETTINGS,
  type AuthSettings,
} from './store-chrome';

describe('Auth Settings Parser', () => {
  it('parses null or empty settings falling back to defaults', () => {
    const parsed = parseAuthSettings(null);
    expect(parsed.hero_title).toBe(DEFAULT_AUTH_SETTINGS.hero_title);
    expect(parsed.hero_subtitle).toBe('La Obrera y el Zángano');
    expect(parsed.tagline_phrase).toBe('Miel del Bosque Nativo · Chiloé');
    expect(parsed.show_tagline_badge).toBe(true);
    expect(parsed.back_button_label).toBe('Volver a la tienda');
    expect(parsed.login_card_title).toBe('Acceso al Club Legado');
    expect(parsed.login_card_subtitle).toBe('Ingresa tus credenciales para ver tus pedidos y membresía');
    expect(parsed.login_button_label).toBe('Iniciar Sesión');
    expect(parsed.register_card_title).toBe('Crear Cuenta en el Club Legado');
    expect(parsed.register_card_subtitle).toBe(
      'Únete para acumular puntos, recibir recolecciones exclusivas y proteger el bosque',
    );
    expect(parsed.register_button_label).toBe('Crear Cuenta');
    expect(parsed.show_birth_date).toBe(false);
    expect(parsed.birth_date_required).toBe(false);
    expect(parsed.birth_date_label).toBe('Fecha de cumpleaños');
    expect(parsed.birth_date_incentive).toBe(
      'Te enviaremos un detalle especial en el día de tu cumpleaños.',
    );
    // Verificación de traducciones bilingües oficiales
    expect(parsed.back_button_label_en).toBe('Back to the store');
    expect(parsed.login_button_label_en).toBe('Sign in');
    expect(parsed.register_button_label_en).toBe('Create account');
    expect(parsed.birth_date_label_en).toBe('Birthday');
  });

  it('preserves custom overrides for auth copy and toggles', () => {
    const custom: Partial<AuthSettings> = {
      back_button_label: 'Volver',
      back_button_label_en: 'Go back',
      login_card_title: 'Entrar',
      login_button_label: 'Entrar',
      show_tagline_badge: false,
      show_birth_date: true,
      birth_date_required: true,
      birth_date_incentive: 'Detalle de regalo en tu día.',
    };

    const parsed = parseAuthSettings(custom as Record<string, unknown>);
    expect(parsed.back_button_label).toBe('Volver');
    expect(parsed.back_button_label_en).toBe('Go back');
    expect(parsed.login_card_title).toBe('Entrar');
    expect(parsed.login_button_label).toBe('Entrar');
    expect(parsed.show_tagline_badge).toBe(false);
    expect(parsed.show_birth_date).toBe(true);
    expect(parsed.birth_date_required).toBe(true);
    expect(parsed.birth_date_incentive).toBe('Detalle de regalo en tu día.');
    // Los campos no tocados conservan sus defaults
    expect(parsed.register_card_title).toBe(DEFAULT_AUTH_SETTINGS.register_card_title);
    expect(parsed.hero_title).toBe(DEFAULT_AUTH_SETTINGS.hero_title);
  });

  it('coerces non-boolean toggles back to defaults', () => {
    const parsed = parseAuthSettings({
      show_tagline_badge: 'si',
      show_birth_date: 1,
      birth_date_required: null,
    } as unknown as Record<string, unknown>);
    expect(parsed.show_tagline_badge).toBe(true);
    expect(parsed.show_birth_date).toBe(false);
    expect(parsed.birth_date_required).toBe(false);
  });
});
