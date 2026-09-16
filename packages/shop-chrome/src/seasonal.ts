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

export type Season = SeasonKey;

export interface SeasonalContext {
  season: Season;
  seasonLabel: string;
  message: string;
  availableFloraciones: string[];
  harvestStatus: 'active' | 'upcoming' | 'resting' | 'preparing';
}

export function getChileanSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 9 && month <= 11) return 'primavera';
  if (month >= 12 || month <= 2) return 'verano';
  if (month >= 3 && month <= 5) return 'otono';
  return 'invierno';
}

export const SEASONAL_DATA: Record<Season, SeasonalContext> = {
  primavera: {
    season: 'primavera',
    seasonLabel: 'Primavera',
    message:
      'El bosque despierta. Las abejas inician sus primeros vuelos sobre las floraciones tempranas. Las colmenas se preparan para la gran temporada de recolección del verano.',
    availableFloraciones: ['Melis', 'Luma', 'Tepu'],
    harvestStatus: 'preparing',
  },
  verano: {
    season: 'verano',
    seasonLabel: 'Verano',
    message:
      'Recolección activa. El ulmo florece entre enero y marzo, la tiaca cierra la temporada. Cada frasco que llega a su puerta fue néctar hace semanas.',
    availableFloraciones: ['Ulmo', 'Tiaca', 'Coigue'],
    harvestStatus: 'active',
  },
  otono: {
    season: 'otono',
    seasonLabel: 'Otoño',
    message:
      'El bosque entra en reposo. Las últimas recolecciones se envasan. La miel del verano alcanza su punto óptimo de maduración en el frasco.',
    availableFloraciones: ['Ulmo', 'Tiaca'],
    harvestStatus: 'upcoming',
  },
  invierno: {
    season: 'invierno',
    seasonLabel: 'Invierno',
    message:
      'Las colmenas descansan bajo la lluvia del sur. Es el momento de las reservas —las mieles que recolectamos en verano están en su esplendor ahora.',
    availableFloraciones: [],
    harvestStatus: 'resting',
  },
};

/**
 * Contexto de la temporada actual. Si el CMS define overrides para la temporada
 * vigente (sección seasonal_settings del editor de tienda), ganan sobre el
 * default calculado por mes; los campos vacíos caen al default.
 */
export function getSeasonalContext(
  overrides?: SeasonalOverrides,
  locale: string = 'es',
): SeasonalContext {
  const season = getChileanSeason();
  const base = SEASONAL_DATA[season];
  const o = overrides?.[season];
  if (!o) return base;
  const isEn = locale === 'en';
  return {
    ...base,
    seasonLabel: isEn && o.label_en ? o.label_en : (o.label ?? base.seasonLabel),
    message: isEn && o.message_en ? o.message_en : (o.message ?? base.message),
    ...(o.floraciones && o.floraciones.length > 0 ? { availableFloraciones: o.floraciones } : {}),
  };
}

