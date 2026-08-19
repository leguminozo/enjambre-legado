/**
 * Sub-roles territoriales (eje B) — docs/ROLES_Y_ACCESO.md.
 *
 * Fuente de verdad en runtime (orden):
 * 1. `actores_registro.rol` (si el actor está inscrito)
 * 2. `user_metadata.territorial_rol` (signup / invitación, pre-inscripción)
 *
 * Tres ejes, un mismo actor. No se mezclan:
 *
 * 1. Actividad (`api_residente` | `api_trashumante` | `api_mixto`)
 *    Mismo set de herramientas. Cambia orden, énfasis y destino primario.
 * 2. Cumplimiento (`actores_registro.completo`)
 *    Candado de escrituras (trashumancia / predios). No abre ni cierra menú.
 * 3. Plan (`red` gratis | `trazabilidad` | `apiario_pro`)
 *    Módulos de pago. Censo, mapa, alertas y declaración SAG siguen en Red.
 *
 * `nivel_acreditacion` es credencial de la red (copy). Nunca es permiso.
 * Patio (`profiles.role = apicultor`) es otra puerta — no se mezcla aquí.
 */

export const TERRITORIAL_ROLES = [
  'api_residente',
  'api_trashumante',
  'api_mixto',
  'prop_facilitador',
  'agri_fitosanitario',
  'agri_aplicador',
  'comercial_acopio',
  'tecnico_inspector',
  'institucion_publica',
] as const;

export type TerritorialRol = (typeof TERRITORIAL_ROLES)[number];

export const API_ACTIVITY_ROLES = ['api_residente', 'api_trashumante', 'api_mixto'] as const;
export type ApiActivityRol = (typeof API_ACTIVITY_ROLES)[number];

/** Familias de menú de la oleada 2a (+ fallback mínimo). */
export type TerritorialMenuFamily = 'api' | 'institucion' | 'minimo';

export const TERRITORIAL_ROL_LABELS: Record<TerritorialRol, string> = {
  api_residente: 'Apicultor/a residente',
  api_trashumante: 'Apicultor/a trashumante',
  api_mixto: 'Apicultor/a mixto',
  prop_facilitador: 'Propietario/a facilitador',
  agri_fitosanitario: 'Agricultor/a (fitosanitarios)',
  agri_aplicador: 'Aplicador/a agrícola',
  comercial_acopio: 'Comercializador/a o acopio',
  tecnico_inspector: 'Inspector/a técnico',
  institucion_publica: 'Institución pública',
};

export const TERRITORIAL_ROL_OPTIONS: ReadonlyArray<{ value: TerritorialRol; label: string }> =
  TERRITORIAL_ROLES.map((value) => ({ value, label: TERRITORIAL_ROL_LABELS[value] }));

export function isTerritorialRol(value: string | null | undefined): value is TerritorialRol {
  return !!value && (TERRITORIAL_ROLES as readonly string[]).includes(value);
}

export function territorialRolLabel(rol: string | null | undefined): string {
  if (rol && isTerritorialRol(rol)) return TERRITORIAL_ROL_LABELS[rol];
  return rol ?? '';
}

export function isApiActivityRol(value: string | null | undefined): value is ApiActivityRol {
  return !!value && (API_ACTIVITY_ROLES as readonly string[]).includes(value);
}

/**
 * Resuelve la familia de menú (oleada 2a).
 * - api_* → red apícola (registro propio, planes, fenología)
 * - institucion_publica → censo/agregados
 * - resto (2b) o ausente → mínimo (inicio + inscripción)
 */
export function resolveTerritorialMenuFamily(
  rol: string | null | undefined,
): TerritorialMenuFamily {
  if (!rol) return 'minimo';
  if (rol === 'institucion_publica') return 'institucion';
  if (rol.startsWith('api_')) return 'api';
  return 'minimo';
}

/** Set compartido: residente, trashumante y mixto ven las mismas herramientas. */
export const TERRITORIAL_API_TOOL_KEYS = [
  'inicio',
  'territorio',
  'mapa-red',
  'alertas-red',
  'trashumancia',
  'declaracion-sag',
  'mis-planes',
  'fenologia',
] as const;

/**
 * Mismo set, distinto orden. El orden es el énfasis de la actividad.
 * Residente: censo y alertas primero.
 * Trashumante: movimientos primero.
 * Mixto: censo + trashumancia juntos.
 */
export const TERRITORIAL_API_KEY_ORDER: Record<ApiActivityRol, readonly string[]> = {
  api_residente: [
    'inicio',
    'territorio',
    'alertas-red',
    'mapa-red',
    'trashumancia',
    'declaracion-sag',
    'fenologia',
    'mis-planes',
  ],
  api_trashumante: [
    'inicio',
    'trashumancia',
    'alertas-red',
    'mapa-red',
    'territorio',
    'declaracion-sag',
    'fenologia',
    'mis-planes',
  ],
  api_mixto: [
    'inicio',
    'territorio',
    'trashumancia',
    'alertas-red',
    'mapa-red',
    'declaracion-sag',
    'fenologia',
    'mis-planes',
  ],
};

/**
 * Keys de sidebar visibles por familia (ROLE_VISIBLE base territorial se refina aquí).
 * Keys deben existir en SIDEBAR_GROUPS / ACCOUNT_ITEMS.
 */
export const TERRITORIAL_FAMILY_VISIBLE_KEYS: Record<
  TerritorialMenuFamily,
  readonly string[]
> = {
  api: TERRITORIAL_API_TOOL_KEYS,
  /** Censo comunal + mapa + floración. Sin planes de venta. */
  institucion: ['inicio', 'territorio', 'mapa-red', 'registro-comunal', 'fenologia'],
  /** Sin sub-rol o 2b aún no abierto: solo home + entrada al registro */
  minimo: ['inicio', 'territorio'],
};

export function getTerritorialVisibleKeys(
  rol: string | null | undefined,
): readonly string[] {
  if (isApiActivityRol(rol)) return TERRITORIAL_API_KEY_ORDER[rol];
  return TERRITORIAL_FAMILY_VISIBLE_KEYS[resolveTerritorialMenuFamily(rol)];
}

export function getTerritorialBottomNavKeys(
  rol: string | null | undefined,
): readonly string[] {
  if (rol === 'api_trashumante') return ['inicio', 'trashumancia', 'alertas-red'];
  if (rol === 'api_mixto') return ['inicio', 'territorio', 'trashumancia'];
  if (rol === 'api_residente' || resolveTerritorialMenuFamily(rol) === 'api') {
    return ['inicio', 'territorio', 'alertas-red'];
  }
  if (resolveTerritorialMenuFamily(rol) === 'institucion') {
    return ['inicio', 'registro-comunal'];
  }
  return ['inicio', 'territorio'];
}

export type TerritorialHomeTool = {
  href: string;
  title: string;
  desc: string;
  primary?: boolean;
};

export type TerritorialTerritoryTabId = 'registro' | 'mapa' | 'alertas' | 'trashumancia';

export type TerritorialTerritoryTab = {
  id: TerritorialTerritoryTabId;
  label: string;
  href: string;
};

const TERRITORY_TAB_CATALOG: Record<TerritorialTerritoryTabId, TerritorialTerritoryTab> = {
  registro: { id: 'registro', label: 'Mi Censo Legal', href: '/territorio' },
  mapa: { id: 'mapa', label: 'Mapa Comunitario', href: '/territorio/mapa' },
  alertas: { id: 'alertas', label: 'Alertas Fitosanitarias', href: '/territorio/alertas' },
  trashumancia: {
    id: 'trashumancia',
    label: 'Trashumancia y Predios',
    href: '/territorio/trashumancia',
  },
};

const TERRITORY_TAB_ORDER: Record<ApiActivityRol, readonly TerritorialTerritoryTabId[]> = {
  api_residente: ['registro', 'alertas', 'mapa', 'trashumancia'],
  api_trashumante: ['trashumancia', 'alertas', 'mapa', 'registro'],
  api_mixto: ['registro', 'trashumancia', 'alertas', 'mapa'],
};

export function getTerritorialTerritoryTabs(
  rol: string | null | undefined,
): readonly TerritorialTerritoryTab[] {
  const order = isApiActivityRol(rol)
    ? TERRITORY_TAB_ORDER[rol]
    : (['registro', 'alertas', 'mapa', 'trashumancia'] as const);
  return order.map((id) => TERRITORY_TAB_CATALOG[id]);
}

const API_HOME_TOOL_CATALOG = {
  censo: {
    href: '/territorio',
    title: 'Mi censo legal',
    desc: 'Censo apícola, mapa de zonas y alertas. Red gratis: no reemplaza al SAG.',
  },
  trashumancia: {
    href: '/territorio/trashumancia',
    title: 'Trashumancia y predios',
    desc: 'Declarar ingresos, predios facilitadores y distancias de apoyo (Ley 21.489).',
  },
  alertas: {
    href: '/territorio/alertas',
    title: 'Alertas de la red',
    desc: 'Avisos fitosanitarios cerca de tu zona. Confirmar no es fiscalizar.',
  },
  sag: {
    href: '/declaracion-sag',
    title: 'Declaración SAG',
    desc: 'Apoyo para el registro anual (Res. 8.196/2015). Tú firmas ante el SAG.',
  },
  planes: {
    href: '/mis-planes',
    title: 'Planes',
    desc: 'QR ilimitados (Trazabilidad) y cuaderno Res. 4590 (Pro). El censo sigue gratis.',
  },
  fenologia: {
    href: '/fenologia',
    title: 'Oráculo fenológico',
    desc: 'GDD y floración para planificar pecoreo.',
  },
} as const;

type ApiHomeToolId = keyof typeof API_HOME_TOOL_CATALOG;

function toolFromCatalog(id: ApiHomeToolId, primary = false): TerritorialHomeTool {
  return { ...API_HOME_TOOL_CATALOG[id], primary: primary || undefined };
}

export type TerritorialHomeOpts = {
  /** Eje 2: si el censo no está completo, el CTA primario vuelve al censo. */
  censoCompleto?: boolean | null;
};

export function getTerritorialHomeTools(
  rol: string | null | undefined,
  opts?: TerritorialHomeOpts,
): readonly TerritorialHomeTool[] {
  const family = resolveTerritorialMenuFamily(rol);
  const censoPendiente = opts?.censoCompleto === false;

  if (family === 'institucion') {
    return [
      {
        href: '/registro-territorial',
        title: 'Censo y red comunal',
        desc: 'Actores, apiarios y agregados del territorio.',
        primary: true,
      },
      {
        href: '/territorio',
        title: 'Mapa e impacto',
        desc: 'Vista territorial, alertas y ordenamiento.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'GDD y floración para planificar con la comuna.',
      },
    ];
  }

  if (family === 'api') {
    if (rol === 'api_trashumante') {
      if (censoPendiente) {
        return [
          toolFromCatalog('censo', true),
          toolFromCatalog('trashumancia'),
          toolFromCatalog('alertas'),
          toolFromCatalog('sag'),
        ];
      }
      return [
        toolFromCatalog('trashumancia', true),
        toolFromCatalog('alertas'),
        toolFromCatalog('censo'),
        toolFromCatalog('sag'),
      ];
    }
    if (rol === 'api_mixto') {
      return [
        toolFromCatalog('censo', true),
        toolFromCatalog('trashumancia', !censoPendiente),
        toolFromCatalog('alertas'),
        toolFromCatalog('sag'),
      ];
    }
    return [
      toolFromCatalog('censo', true),
      toolFromCatalog('alertas'),
      toolFromCatalog('sag'),
      toolFromCatalog('planes'),
    ];
  }

  return [
    {
      href: '/territorio',
      title: 'Completar mi censo',
      desc: 'Declarar tu rol y datos del censo apícola de Chiloé.',
      primary: true,
    },
  ];
}

export function getTerritorialPrimaryHref(
  rol: string | null | undefined,
  opts?: { inscrito?: boolean; censoCompleto?: boolean | null },
): string {
  if (resolveTerritorialMenuFamily(rol) === 'institucion') return '/registro-territorial';
  if (opts?.inscrito === false) return '/territorio';
  if (rol === 'api_trashumante' && opts?.censoCompleto !== false) {
    return '/territorio/trashumancia';
  }
  return '/territorio';
}

export function getTerritorialHomeCopy(rol: string | null | undefined): {
  eyebrow: string;
  subtitleFallback: string;
} {
  if (rol === 'api_residente') {
    return {
      eyebrow: 'Red apícola · residente',
      subtitleFallback: 'Tu censo, las alertas de tu zona y el pulso fenológico del territorio.',
    };
  }
  if (rol === 'api_trashumante') {
    return {
      eyebrow: 'Red apícola · trashumante',
      subtitleFallback: 'Tus movimientos, predios y las alertas del territorio.',
    };
  }
  if (rol === 'api_mixto') {
    return {
      eyebrow: 'Red apícola · mixto',
      subtitleFallback: 'Censo local y trashumancia, en el mismo menú.',
    };
  }
  const family = resolveTerritorialMenuFamily(rol);
  if (family === 'institucion') {
    return {
      eyebrow: 'Institución · red territorial',
      subtitleFallback: 'Vista comunal: censo, mapa y herramientas de gobernanza apícola.',
    };
  }
  if (family === 'api') {
    return {
      eyebrow: 'Red apícola · Chiloé',
      subtitleFallback: 'Tu registro, tus planes y el pulso fenológico del territorio.',
    };
  }
  return {
    eyebrow: 'Registro Territorial · Chiloé',
    subtitleFallback: 'Bienvenido al Registro Territorial Apícola de Chiloé.',
  };
}

// ---------------------------------------------------------------------------
// Eje 2 — cumplimiento (censo legal). Único candado de escritura territorial.
// ---------------------------------------------------------------------------

export const CENSO_WRITE_LOCK_CODE = 'censo_incompleto';

export const CENSO_WRITE_LOCK_MESSAGE =
  'Completa tu censo legal para declarar trashumancia o predios. La credencial de la red no desbloquea escrituras.';

export function territorialWritesUnlocked(completo: boolean | null | undefined): boolean {
  return completo === true;
}

// ---------------------------------------------------------------------------
// Eje 3 — plan. El cobro vive en subscription_plans; esto es el catálogo.
// El gating de features de pago aún no se aplica en runtime (lanzamiento).
// ---------------------------------------------------------------------------

export const TERRITORIAL_PAID_PLAN_KEYS = ['trazabilidad', 'apiario_pro'] as const;
export type TerritorialPaidPlanKey = (typeof TERRITORIAL_PAID_PLAN_KEYS)[number];
export type TerritorialPlanTier = 'red' | TerritorialPaidPlanKey;

export const TERRITORIAL_PAID_FEATURE_LABELS: Record<string, string> = {
  pasaportes_qr_ilimitados: 'Pasaportes QR ilimitados por lote',
  estadisticas_escaneos: 'Estadísticas de escaneos',
  cuaderno_campo_res_4590: 'Cuaderno de campo digital conforme a Res. SAG 4590/2025',
};

const FEATURE_MIN_PLAN: Record<string, TerritorialPaidPlanKey> = {
  pasaportes_qr_ilimitados: 'trazabilidad',
  estadisticas_escaneos: 'trazabilidad',
  cuaderno_campo_res_4590: 'apiario_pro',
};

export function resolveTerritorialPlanTier(
  activePlanKeys: readonly string[] | null | undefined,
): TerritorialPlanTier {
  const keys = activePlanKeys ?? [];
  if (keys.includes('apiario_pro')) return 'apiario_pro';
  if (keys.includes('trazabilidad')) return 'trazabilidad';
  return 'red';
}

/** Pro incluye Trazabilidad. Red no abre features de pago. */
export function territorialPaidFeatureUnlocked(
  feature: string,
  activePlanKeys: readonly string[] | null | undefined,
): boolean {
  const min = FEATURE_MIN_PLAN[feature];
  if (!min) return true;
  const tier = resolveTerritorialPlanTier(activePlanKeys);
  if (tier === 'apiario_pro') return true;
  return tier === min;
}

export function isTerritorialPaidPlanKey(value: string | null | undefined): value is TerritorialPaidPlanKey {
  return !!value && (TERRITORIAL_PAID_PLAN_KEYS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Credencial — display. Nunca usar para allowlist, RLS ni write-lock.
// ---------------------------------------------------------------------------

export const TERRITORIAL_CREDENTIAL_LEVELS = [
  'base',
  'trazable',
  'comprometido',
  'referente',
] as const;

export type TerritorialCredentialLevel = (typeof TERRITORIAL_CREDENTIAL_LEVELS)[number];

export type TerritorialCredential = {
  level: TerritorialCredentialLevel;
  label: string;
  desc: string;
  className: string;
};

export const TERRITORIAL_CREDENTIALS: Record<TerritorialCredentialLevel, TerritorialCredential> = {
  base: {
    level: 'base',
    label: 'Base',
    desc: 'Inscripción en el registro comunal. No abre herramientas ni escrituras.',
    className: 'bg-surface-raised text-muted-foreground',
  },
  trazable: {
    level: 'trazable',
    label: 'Trazable',
    desc: 'Hay al menos un lote o una temporada documentada. Reconocimiento, no permiso.',
    className: 'bg-primary/10 text-primary',
  },
  comprometido: {
    level: 'comprometido',
    label: 'Comprometido',
    desc: 'Consentimiento de mapa comunitario y datos del censo al día.',
    className: 'bg-primary/20 text-primary',
  },
  referente: {
    level: 'referente',
    label: 'Referente',
    desc: 'Historial validado por pares en la plataforma. Sigue sin ser un permiso.',
    className: 'bg-primary/30 text-primary',
  },
};

export function getTerritorialCredential(
  nivel: string | null | undefined,
): TerritorialCredential {
  if (nivel && nivel in TERRITORIAL_CREDENTIALS) {
    return TERRITORIAL_CREDENTIALS[nivel as TerritorialCredentialLevel];
  }
  return TERRITORIAL_CREDENTIALS.base;
}

export function isTerritorialCredentialLevel(
  value: string | null | undefined,
): value is TerritorialCredentialLevel {
  return !!value && (TERRITORIAL_CREDENTIAL_LEVELS as readonly string[]).includes(value);
}
