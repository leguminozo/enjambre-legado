import { describe, expect, it } from 'vitest';
import {
  extractBenefitLabel,
  normalizeIncludedItems,
  CATEGORY_CONFIG,
  CHANNEL_CONFIG,
  FREQUENCY_CONFIG,
  type PlanCategory,
  type PlanChannel,
} from '../SubscriptionPlanForm';

describe('SubscriptionPlanForm - Normalización de Beneficios', () => {
  it('extrae strings simples directamente', () => {
    expect(extractBenefitLabel('Envío mensual de miel')).toBe('Envío mensual de miel');
  });

  it('extrae notas de objetos estructurados de cata o trazabilidad', () => {
    expect(extractBenefitLabel({ type: 'cata', note: 'Guía de cata digital' })).toBe('Guía de cata digital');
    expect(extractBenefitLabel({ type: 'trazabilidad', note: 'Pasaporte de lote cuando esté publicado' })).toBe(
      'Pasaporte de lote cuando esté publicado'
    );
  });

  it('formatea correctamente beneficios de floración botánica', () => {
    expect(extractBenefitLabel({ type: 'floracion', value: 'ulmo' })).toBe('Floración selecta de Ulmo');
    expect(extractBenefitLabel({ type: 'floracion', value: 'tiaca' })).toBe('Floración selecta de Tiaca');
  });

  it('mapea identificadores técnicos de servicios digitales a etiquetas humanas', () => {
    expect(extractBenefitLabel({ type: 'digital', feature: 'pasaportes_qr_ilimitados' })).toBe(
      'Pasaportes QR ilimitados por lote'
    );
    expect(extractBenefitLabel({ type: 'digital', feature: 'estadisticas_escaneos' })).toBe(
      'Estadísticas y analítica de escaneos'
    );
    expect(extractBenefitLabel({ type: 'digital', feature: 'cuaderno_campo_res_4590' })).toBe(
      'Cuaderno de campo digital (Res. SAG 4590/2025)'
    );
  });

  it('normalizeIncludedItems produce un array no vacío de objetos con valor de texto', () => {
    const raw = [
      { type: 'floracion', value: 'ulmo' },
      'Guía impresa de cata',
      { type: 'digital', feature: 'pasaportes_qr_ilimitados' },
    ];
    const normalized = normalizeIncludedItems(raw);
    expect(normalized).toEqual([
      { value: 'Floración selecta de Ulmo' },
      { value: 'Guía impresa de cata' },
      { value: 'Pasaportes QR ilimitados por lote' },
    ]);
  });

  it('devuelve [{ value: "" }] ante inputs vacíos o inválidos', () => {
    expect(normalizeIncludedItems([])).toEqual([{ value: '' }]);
    expect(normalizeIncludedItems(null)).toEqual([{ value: '' }]);
  });
});

describe('SubscriptionPlanForm - Configuración de Canales y Categorías', () => {
  it('cada categoría define canales por defecto y estado digital canónico', () => {
    const categories: PlanCategory[] = ['reposicion', 'cosecha', 'territorial', 'pos_campo', 'corporativo'];
    for (const cat of categories) {
      const cfg = CATEGORY_CONFIG[cat];
      expect(cfg).toBeDefined();
      expect(cfg.label).toBeTruthy();
      expect(cfg.description).toBeTruthy();
      expect(cfg.defaultChannels.length).toBeGreaterThan(0);
    }

    // Territorial siempre es digital por defecto
    expect(CATEGORY_CONFIG.territorial.isDigitalDefault).toBe(true);
    expect(CATEGORY_CONFIG.territorial.defaultChannels).toContain('nucleo_territorial');

    // Despensa y Cosecha generan entregas físicas
    expect(CATEGORY_CONFIG.reposicion.isDigitalDefault).toBe(false);
    expect(CATEGORY_CONFIG.reposicion.defaultChannels).toContain('tienda_despensa');
    expect(CATEGORY_CONFIG.cosecha.isDigitalDefault).toBe(false);
    expect(CATEGORY_CONFIG.cosecha.defaultChannels).toContain('tienda_club');
  });

  it('todos los canales de publicación tienen superficie y badge asignados', () => {
    const channels: PlanChannel[] = [
      'tienda_despensa',
      'tienda_club',
      'nucleo_territorial',
      'campo_pos',
      'privado',
    ];
    for (const ch of channels) {
      const cfg = CHANNEL_CONFIG[ch];
      expect(cfg).toBeDefined();
      expect(cfg.label).toBeTruthy();
      expect(cfg.surface).toBeTruthy();
      expect(cfg.badge).toBeTruthy();
    }
  });

  it('soporta frecuencias mensuales, trimestrales, anuales y de temporada', () => {
    expect(FREQUENCY_CONFIG.monthly.periodUnit).toBe('mes');
    expect(FREQUENCY_CONFIG.quarterly.periodUnit).toBe('trimestre');
    expect(FREQUENCY_CONFIG.annual.periodUnit).toBe('año');
    expect(FREQUENCY_CONFIG.season.periodUnit).toBe('temporada');
  });
});
