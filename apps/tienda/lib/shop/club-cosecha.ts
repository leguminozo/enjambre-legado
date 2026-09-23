/**
 * Club Legado del Bosque — suscripción por temporada melífera (mov. 13).
 * Contenido editorial + mapeo a planes de reposición existentes o dedicados.
 */

import { getSeasonalContext, type SeasonalContext } from './seasonal';
import type { SeasonalOverrides } from './store-chrome';

export type CosechaKey = 'ulmo' | 'tiaca' | 'quillay' | 'multifloral';

export type CosechaClub = {
  key: CosechaKey;
  /** key de subscription_plans (si existe en BD). */
  planKey: string;
  nombre: string;
  nombreCientifico: string | null;
  /** Meses 1–12 (hemisferio sur) en que la recolección está “en ventana”. */
  ventanaMeses: number[];
  tagline: string;
  cata: string[];
  maridaje: string;
  /** Ruta editorial en tienda. */
  origenPath: string | null;
  color: string;
};

export const CLUB_COSECHAS: CosechaClub[] = [
  {
    key: 'ulmo',
    planKey: 'club_ulmo',
    nombre: 'Ulmo',
    nombreCientifico: 'Eucryphia cordifolia',
    ventanaMeses: [1, 2, 3],
    tagline: 'La flor del bosque valdiviano — ámbar claro, vainilla y cuerpo ligero.',
    cata: ['Floral delicado', 'Notas de vainilla', 'Final limpio', 'Cuerpo ligero'],
    maridaje: 'Quesos blandos (brie, camembert), té blanco, postres de leche.',
    origenPath: '/origen/ulmo',
    color: '#c4a35a',
  },
  {
    key: 'tiaca',
    planKey: 'club_tiaca',
    nombre: 'Tiaca',
    nombreCientifico: 'Caldcluvia paniculata',
    ventanaMeses: [2, 3, 4],
    tagline: 'Cierra el verano: más ámbar, herbácea, con cuerpo y persistencia.',
    cata: ['Herbáceo', 'Ámbar medio', 'Cuerpo medio-alto', 'Final terroso'],
    maridaje: 'Yogur natural, panes de masa madre, queso de cabra.',
    origenPath: null,
    color: '#8b6914',
  },
  {
    key: 'quillay',
    planKey: 'club_quillay',
    nombre: 'Quillay',
    nombreCientifico: 'Quillaja saponaria',
    ventanaMeses: [10, 11, 12],
    tagline: 'Primavera del centro-sur: floral intenso, ideal para quien descubre el club.',
    cata: ['Floral intenso', 'Ligero amargor noble', 'Aroma jabonoso sutil', 'Fresco'],
    maridaje: 'Fruta fresca, yogurt griego, infusiones de hierbas.',
    origenPath: null,
    color: '#3d8b6e',
  },
  {
    key: 'multifloral',
    planKey: 'quarterly',
    nombre: 'Multifloral del bosque',
    nombreCientifico: null,
    ventanaMeses: [1, 2, 3, 4, 10, 11, 12],
    tagline: 'Selección curada de la estación — el plan trimestral del territorio.',
    cata: ['Perfil variable', 'Refleja la temporada', 'Ideal para descubrir'],
    maridaje: 'Tabla mixta: el sommelier eres tú cada trimestre.',
    origenPath: null,
    color: '#2d6a4f',
  },
];

export type CosechaStatus = 'en_ventana' | 'proxima' | 'reserva';

export function monthNow(now: Date = new Date()): number {
  return now.getMonth() + 1;
}

export function statusForCosecha(club: CosechaClub, now: Date = new Date()): CosechaStatus {
  const m = monthNow(now);
  if (club.ventanaMeses.includes(m)) return 'en_ventana';
  // Próxima si está a ≤2 meses del inicio de ventana
  const starts = club.ventanaMeses;
  for (const start of starts) {
    const dist = (start - m + 12) % 12;
    if (dist > 0 && dist <= 2) return 'proxima';
  }
  return 'reserva';
}

export function statusLabel(s: CosechaStatus): string {
  switch (s) {
    case 'en_ventana':
      return 'En ventana de recolección';
    case 'proxima':
      return 'Próxima';
    default:
      return 'En reserva / maduración';
  }
}

export type ClubCosechaContext = {
  seasonal: SeasonalContext;
  cosechas: Array<
    CosechaClub & {
      status: CosechaStatus;
      statusLabel: string;
      destacada: boolean;
    }
  >;
  /** planKey sugerido para CTA principal. */
  suggestedPlanKey: string;
  copy: {
    titulo: string;
    subtitulo: string;
    comoFunciona: string[];
  };
};

/**
 * Contexto del club en la fecha actual (o inyectable en tests).
 * `overrides` (del CMS) ajusta label/mensaje/floraciones de la temporada vigente.
 */
export function getClubCosechaContext(
  now: Date = new Date(),
  overrides?: SeasonalOverrides,
  locale: string = 'es',
): ClubCosechaContext {
  const seasonal = getSeasonalContext(overrides, locale);
  // getSeasonalContext uses real Date internally — for tests we need seasonal aligned.
  // Re-derive season labels from `now` via month for destacada only; seasonal message
  // may lag if fake timers not set before import. Callers in tests should set timers
  // before calling getClubCosechaContext (and getSeasonalContext reads Date).

  const cosechas = CLUB_COSECHAS.map((c) => {
    const status = statusForCosecha(c, now);
    const florMatch = seasonal.availableFloraciones.some(
      (f) => f.toLowerCase() === c.nombre.toLowerCase(),
    );
    return {
      ...c,
      status,
      statusLabel: statusLabel(status),
      destacada: status === 'en_ventana' || florMatch,
    };
  });

  const destacadas = cosechas.filter((c) => c.destacada);
  const suggestedPlanKey =
    destacadas.find((c) => c.key !== 'multifloral')?.planKey ??
    cosechas.find((c) => c.key === 'multifloral')?.planKey ??
    'quarterly';

  return {
    seasonal,
    cosechas,
    suggestedPlanKey,
    copy: {
      titulo: 'Club Legado del Bosque',
      subtitulo:
        'Al registrarte en la tienda formas parte del Club Legado del Bosque. Tu cuenta activa un universo dedicado de privilegios: reposición periódica a tu medida, acceso prioritario a ediciones limitadas, trazabilidad botánica de cada frasco e invitaciones a catas privadas de autor.',
      comoFunciona: [
        'Registro libre en la tienda: Al crear tu cuenta quedas acreditado automáticamente en el Club Legado del Bosque, sin costos de membresía ni permanencias forzadas.',
        'Reposición y reservas a tu medida: Configura entregas periódicas para tus variedades favoritas a tu propio ritmo, o asegura cupos preferentes en floraciones limitadas.',
        'Entrega directa con pasaporte de lote: Cada frasco llega directamente desde Chiloé acompañado de su pasaporte digital, análisis de laboratorio y relato de colmena.',
        'Beneficios acumulables y economía circular: Suma ciclos de lealtad en cada compra, retorna tus frascos limpios con saldo a favor en tu cuenta y accede a catas privadas de autor.',
      ],
    },
  };
}

/** Resuelve plan de BD por planKey del club, con fallback a quarterly/monthly. */
export function resolveClubPlanId(
  planKey: string,
  plans: Array<{ id: string; key: string }>,
): string | null {
  const exact = plans.find((p) => p.key === planKey);
  if (exact) return exact.id;
  const quarterly = plans.find((p) => p.key === 'quarterly');
  if (quarterly) return quarterly.id;
  const monthly = plans.find((p) => p.key === 'monthly');
  return monthly?.id ?? plans[0]?.id ?? null;
}

/** ¿El lote público pertenece a esta cosecha del club? */
export function loteMatchesClub(
  variedadFloral: string | null | undefined,
  clubKey: CosechaKey,
): boolean {
  if (clubKey === 'multifloral') return true;
  const v = (variedadFloral ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const key = clubKey.toLowerCase();
  return v.includes(key);
}

export type LotePublicoResumen = {
  id: string;
  nombre_lote: string | null;
  variedad_floral: string;
  fecha: string | null;
  lab_nombre: string | null;
  humedad: number | null;
  relato_excerpt: string | null;
};

/** Agrupa lotes públicos por key de cosecha del club. */
export function groupLotesByClub(
  lotes: LotePublicoResumen[],
): Record<CosechaKey, LotePublicoResumen[]> {
  const out: Record<CosechaKey, LotePublicoResumen[]> = {
    ulmo: [],
    tiaca: [],
    quillay: [],
    multifloral: [],
  };
  for (const l of lotes) {
    let matched = false;
    for (const key of ['ulmo', 'tiaca', 'quillay'] as const) {
      if (loteMatchesClub(l.variedad_floral, key)) {
        out[key].push(l);
        matched = true;
        break;
      }
    }
    if (!matched) out.multifloral.push(l);
  }
  return out;
}
