import type { SeasonalOverrides } from './store-chrome';

export type Season =
  | 'primavera'
  | 'verano'
  | 'otono'
  | 'invierno';

export interface SeasonalContext {
  season: Season;
  seasonLabel: string;
  message: string;
  availableFloraciones: string[];
  harvestStatus: 'active' | 'upcoming' | 'resting' | 'preparing';
}

function getChileanSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 9 && month <= 11) return 'primavera';
  if (month >= 12 || month <= 2) return 'verano';
  if (month >= 3 && month <= 5) return 'otono';
  return 'invierno';
}

const SEASONAL_DATA: Record<Season, SeasonalContext> = {
  primavera: {
    season: 'primavera',
    seasonLabel: 'Primavera',
    message:
      'El bosque despierta. Las abejas inician sus primeros vuelos sobre las floraciones tempranas. Las colmenas se preparan para la gran cosecha del verano.',
    availableFloraciones: ['Melis', 'Luma', 'Tepu'],
    harvestStatus: 'preparing',
  },
  verano: {
    season: 'verano',
    seasonLabel: 'Verano',
    message:
      'Cosecha activa. El ulmo florece entre enero y marzo, la tiaca cierra la temporada. Cada frasco que llega a su puerta fue néctar hace semanas.',
    availableFloraciones: ['Ulmo', 'Tiaca', 'Coigue'],
    harvestStatus: 'active',
  },
  otono: {
    season: 'otono',
    seasonLabel: 'Otoño',
    message:
      'El bosque entra en reposo. Las últimas cosechas se envasan. La miel del verano alcanza su punto óptimo de maduración en el frasco.',
    availableFloraciones: ['Ulmo', 'Tiaca'],
    harvestStatus: 'upcoming',
  },
  invierno: {
    season: 'invierno',
    seasonLabel: 'Invierno',
    message:
      'Las colmenas descansan bajo la lluvia del sur. Es el momento de las reservas —las mieles que cosechamos en verano están en su esplendor ahora.',
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
