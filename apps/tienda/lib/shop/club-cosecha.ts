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

export function statusLabel(s: CosechaStatus, locale: string = 'es'): string {
  const en = locale === 'en';
  switch (s) {
    case 'en_ventana':
      return en ? 'In harvest window' : 'En ventana de recolección';
    case 'proxima':
      return en ? 'Upcoming' : 'Próxima';
    default:
      return en ? 'In reserve / maturing' : 'En reserva / maduración';
  }
}

/**
 * Override editorial de una tarjeta de floración (viene del CMS
 * club_page_settings: flor_1..4_*). Vacío = ocultar esa parte;
 * nombre vacío = ocultar la tarjeta completa.
 */
export type FloracionCardOverride = {
  nombre: string;
  cientifico: string | null;
  tagline: string;
  cata: string[];
  maridaje: string;
  origenPath: string | null;
};

/** Textarea del CMS (una nota por línea) → lista de notas de cata. */
export function splitCataLines(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Fila botánica de la Biblioteca de Floraciones (BFF /api/floraciones-publicas).
 * Fuente única de nombre común, científico y ventana — el club no inventa
 * dato botánico en código.
 */
export type FuenteBotanica = {
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  ventana_ini: number | null;
  ventana_fin: number | null;
  fuente?: string;
};

/** ventana_ini/fin (1–12) → meses en ventana. Soporta cruce de año. null si inválida. */
export function expandVentanaBotanica(
  ini: number | null,
  fin: number | null,
): number[] | null {
  if (!Number.isInteger(ini) || !Number.isInteger(fin)) return null;
  const a = ini as number;
  const b = fin as number;
  if (a < 1 || a > 12 || b < 1 || b > 12) return null;
  const out: number[] = [];
  let m = a;
  for (let i = 0; i < 12; i++) {
    out.push(m);
    if (m === b) break;
    m = (m % 12) + 1;
  }
  return out;
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
 * `florOverrides` (del CMS club_page_settings) aporta el copy editorial de cada
 * tarjeta; nombre vacío = la tarjeta no se muestra.
 * `botanica` (Biblioteca de Floraciones) manda en nombre común, científico y
 * ventana cuando hay match por slug; el CMS queda como fallback editorial.
 */
export function getClubCosechaContext(
  now: Date = new Date(),
  overrides?: SeasonalOverrides,
  locale: string = 'es',
  florOverrides?: Partial<Record<CosechaKey, FloracionCardOverride>>,
  botanica?: FuenteBotanica[],
): ClubCosechaContext {
  const seasonal = getSeasonalContext(overrides, locale);
  // getSeasonalContext uses real Date internally — for tests we need seasonal aligned.
  // Re-derive season labels from `now` via month for destacada only; seasonal message
  // may lag if fake timers not set before import. Callers in tests should set timers
  // before calling getClubCosechaContext (and getSeasonalContext reads Date).

  const cosechas = CLUB_COSECHAS.flatMap((c) => {
    const esp = botanica?.find((e) => e.slug === c.key);
    const ventanaMeses =
      (esp ? expandVentanaBotanica(esp.ventana_ini, esp.ventana_fin) : null) ??
      c.ventanaMeses;
    const conBotanica: CosechaClub = {
      ...c,
      nombre: esp?.nombre_comun.trim() || c.nombre,
      nombreCientifico: esp?.nombre_cientifico.trim() || c.nombreCientifico,
      ventanaMeses,
    };
    const status = statusForCosecha(conBotanica, now);
    const florMatch = seasonal.availableFloraciones.some(
      (f) => f.toLowerCase() === conBotanica.nombre.toLowerCase(),
    );
    const base = {
      ...conBotanica,
      status,
      statusLabel: statusLabel(status, locale),
      destacada: status === 'en_ventana' || florMatch,
    };
    const o = florOverrides?.[c.key];
    if (!o) return [base];
    if (!o.nombre.trim()) return [];
    return [
      {
        ...base,
        // Sin match botánico (ej. multifloral) el CMS define nombre y científico.
        nombre: esp ? base.nombre : o.nombre,
        nombreCientifico: esp ? base.nombreCientifico : o.cientifico,
        tagline: o.tagline,
        cata: o.cata,
        maridaje: o.maridaje,
        origenPath: o.origenPath,
      },
    ];
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
