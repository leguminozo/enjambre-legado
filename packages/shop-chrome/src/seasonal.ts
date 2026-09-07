/**
 * Contenido estacional editable (Club Legado del Bosque + copy de temporada).
 * Campos vacíos = la tienda usa el contenido por temporada calculado por mes
 * (antes hardcodeado en apps/tienda/lib/shop/seasonal.ts).
 */

export const SEASON_KEYS = ['primavera', 'verano', 'otono', 'invierno'] as const;
export type SeasonKey = (typeof SEASON_KEYS)[number];

export interface SeasonalSeasonContent {
  label_es: string;
  label_en: string;
  message_es: string;
  message_en: string;
  /** Floraciones separadas por coma; '' = default por temporada. */
  floraciones: string;
}

export type SeasonalSettings = Record<SeasonKey, SeasonalSeasonContent>;

export interface SeasonalOverride {
  label?: string;
  label_en?: string;
  message?: string;
  message_en?: string;
  floraciones?: string[];
}

export type SeasonalOverrides = Partial<Record<SeasonKey, SeasonalOverride>>;

function emptySeason(): SeasonalSeasonContent {
  return { label_es: '', label_en: '', message_es: '', message_en: '', floraciones: '' };
}

export const DEFAULT_SEASONAL_SETTINGS: SeasonalSettings = {
  primavera: emptySeason(),
  verano: emptySeason(),
  otono: emptySeason(),
  invierno: emptySeason(),
};

/** Plantilla para el editor (mismo shape que el content guardado). */
export const SEASONAL_SETTINGS_TEMPLATE: SeasonalSettings = DEFAULT_SEASONAL_SETTINGS;

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 600) : '';
}

/** Defensivo: árbol siempre fresco (nunca muta DEFAULT_SEASONAL_SETTINGS). */
export function parseSeasonalSettings(
  raw: Record<string, unknown> | null | undefined,
): SeasonalSettings {
  const out: SeasonalSettings = {
    primavera: emptySeason(),
    verano: emptySeason(),
    otono: emptySeason(),
    invierno: emptySeason(),
  };
  if (!raw || typeof raw !== 'object') return out;
  for (const key of SEASON_KEYS) {
    const s = raw[key];
    if (!s || typeof s !== 'object') continue;
    const obj = s as Record<string, unknown>;
    out[key] = {
      label_es: sanitizeString(obj.label_es),
      label_en: sanitizeString(obj.label_en),
      message_es: sanitizeString(obj.message_es),
      message_en: sanitizeString(obj.message_en),
      floraciones: sanitizeString(obj.floraciones),
    };
  }
  return out;
}

/** Overrides no vacíos por temporada — listos para merge en la tienda. */
export function parseSeasonalOverrides(settings: SeasonalSettings): SeasonalOverrides {
  const out: SeasonalOverrides = {};
  for (const key of SEASON_KEYS) {
    const s = settings[key];
    const override: SeasonalOverride = {};
    if (s.label_es.trim()) override.label = s.label_es.trim();
    if (s.label_en.trim()) override.label_en = s.label_en.trim();
    if (s.message_es.trim()) override.message = s.message_es.trim();
    if (s.message_en.trim()) override.message_en = s.message_en.trim();
    if (s.floraciones.trim()) {
      override.floraciones = s.floraciones
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
    }
    if (Object.keys(override).length > 0) out[key] = override;
  }
  return out;
}
