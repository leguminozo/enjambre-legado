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
export type TerritorialMenuFamily =
  | 'api'
  | 'institucion'
  | 'tecnico'
  | 'agri'
  | 'predio'
  | 'comercial'
  | 'minimo';

export const TERRITORIAL_ROL_LABELS: Record<TerritorialRol, string> = {
  api_residente: 'Apicultor/a residente',
  api_trashumante: 'Apicultor/a trashumante',
  api_mixto: 'Apicultor/a mixto',
  agri_fitosanitario: 'Agricultor/a (aplica fitosanitarios)',
  agri_aplicador: 'Empresa aplicadora / contratista',
  prop_facilitador: 'Propietario/a facilitador de terreno',
  institucion_publica: 'Funcionario/a municipal / SAG / INDAP',
  tecnico_inspector: 'Técnico / Inspector / Investigador',
  comercial_acopio: 'Comercializador / Sala de extracción',
};

export const TERRITORIAL_ROL_OPTIONS: ReadonlyArray<{ value: TerritorialRol; label: string }> =
  TERRITORIAL_ROLES.filter(
    // institucion_publica: alta vía flujo institucional validado.
    (value) => value !== 'institucion_publica'
  ).map((value) => ({
    value,
    label: TERRITORIAL_ROL_LABELS[value],
  }));

export function isTerritorialRol(value: unknown): value is TerritorialRol {
  return typeof value === 'string' && (TERRITORIAL_ROLES as readonly string[]).includes(value);
}

export function territorialRolLabel(rol: string | null | undefined): string {
  if (rol && isTerritorialRol(rol)) return TERRITORIAL_ROL_LABELS[rol];
  return rol ?? '';
}

export function isApiActivityRol(value: unknown): value is ApiActivityRol {
  return typeof value === 'string' && (API_ACTIVITY_ROLES as readonly string[]).includes(value);
}

/** Agricultores y aplicadores: emiten avisos fitosanitarios y resguardan apicultores. */
export function isAgriRol(rol: string | null | undefined): boolean {
  return rol === 'agri_fitosanitario' || rol === 'agri_aplicador';
}

/** Propietario que cede terreno para colmenas (pecoreo en predio facilitador). */
export function isPredioRol(rol: string | null | undefined): boolean {
  return rol === 'prop_facilitador';
}

/** Técnicos, inspectores e investigadores: censo comunal y sanidad apícola. */
export function isTecnicoRol(rol: string | null | undefined): boolean {
  return rol === 'tecnico_inspector';
}

/** Comercializadores y salas de extracción: acopio de la red. */
export function isComercialRol(rol: string | null | undefined): boolean {
  return rol === 'comercial_acopio';
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
  if (isTecnicoRol(rol)) return 'tecnico';
  if (isAgriRol(rol)) return 'agri';
  if (isPredioRol(rol)) return 'predio';
  if (isComercialRol(rol)) return 'comercial';
  return 'minimo';
}

/**
 * Keys de sidebar por familia 2b. Sin herencia de herramientas apícolas
 * (colmenas/cuaderno) — cada sub-rol ve solo lo suyo. `tecnico_inspector`
 * queda en `minimo` (oleada 2b, solo lectura + censo comunal).
 */
export const TERRITORIAL_AGRI_VISIBLE_KEYS = [
  'inicio',
  'alertas-red',
  'mapa-red',
  'registro-comunal',
  'territorio',
  'fenologia',
] as const;

export const TERRITORIAL_PREDIO_VISIBLE_KEYS = [
  'inicio',
  'territorio',
  'trashumancia',
  'registro-comunal',
  'mapa-red',
  'alertas-red',
  'fenologia',
] as const;

export const TERRITORIAL_COMERCIAL_VISIBLE_KEYS = [
  'inicio',
  'registro-comunal',
  'declaracion-sag',
  'mapa-red',
  'alertas-red',
  'territorio',
  'fenologia',
] as const;

/** Set compartido: residente, trashumante y mixto ven las mismas herramientas (patio + red). */
export const TERRITORIAL_API_TOOL_KEYS = [
  'inicio',
  'colmenas',
  'cuaderno-campo',
  'ciclo-bosque',
  'territorio',
  'mapa-red',
  'alertas-red',
  'trashumancia',
  'declaracion-sag',
  'fenologia',
] as const;

/**
 * Mismo set, distinto orden. El orden es el énfasis de la actividad.
 * Residente: colmenas, cuaderno, censo y alertas primero.
 * Trashumante: movimientos y colmenas primero.
 * Mixto: colmenas, cuaderno, censo + trashumancia juntos.
 */
export const TERRITORIAL_API_KEY_ORDER: Record<ApiActivityRol, readonly string[]> = {
  api_residente: [
    'inicio',
    'colmenas',
    'cuaderno-campo',
    'territorio',
    'alertas-red',
    'mapa-red',
    'trashumancia',
    'declaracion-sag',
    'ciclo-bosque',
    'fenologia',
  ],
  api_trashumante: [
    'inicio',
    'trashumancia',
    'colmenas',
    'cuaderno-campo',
    'alertas-red',
    'mapa-red',
    'territorio',
    'declaracion-sag',
    'ciclo-bosque',
    'fenologia',
  ],
  api_mixto: [
    'inicio',
    'colmenas',
    'cuaderno-campo',
    'territorio',
    'trashumancia',
    'alertas-red',
    'mapa-red',
    'declaracion-sag',
    'ciclo-bosque',
    'fenologia',
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
  /** Censo comunal + mapa + floración + alertas + declaración SAG + trashumancia. Sin planes de venta. */
  institucion: [
    'inicio',
    'territorio',
    'registro-comunal',
    'mapa-red',
    'alertas-red',
    'declaracion-sag',
    'trashumancia',
    'fenologia',
  ],
  /** Inspectores / técnicos sanitarios SAG: declaraciones, censo, mapa, alertas, trashumancia, floración. */
  tecnico: [
    'inicio',
    'territorio',
    'declaracion-sag',
    'registro-comunal',
    'trashumancia',
    'mapa-red',
    'alertas-red',
    'fenologia',
  ],
  agri: TERRITORIAL_AGRI_VISIBLE_KEYS,
  predio: TERRITORIAL_PREDIO_VISIBLE_KEYS,
  comercial: TERRITORIAL_COMERCIAL_VISIBLE_KEYS,
  /** Sin sub-rol (fallback): home + entrada al registro. */
  minimo: ['inicio', 'territorio', 'colmenas', 'cuaderno-campo'],
};

export function getTerritorialVisibleKeys(
  rol: string | null | undefined,
): readonly string[] {
  if (isApiActivityRol(rol)) return TERRITORIAL_API_KEY_ORDER[rol];
  const family = resolveTerritorialMenuFamily(rol);
  return TERRITORIAL_FAMILY_VISIBLE_KEYS[family];
}

export function getTerritorialBottomNavKeys(
  rol: string | null | undefined,
): readonly string[] {
  if (rol === 'api_trashumante') return ['inicio', 'trashumancia', 'colmenas', 'alertas-red'];
  if (rol === 'api_mixto') return ['inicio', 'colmenas', 'territorio', 'trashumancia'];
  const family = resolveTerritorialMenuFamily(rol);
  if (family === 'api') return ['inicio', 'colmenas', 'territorio', 'alertas-red'];
  if (family === 'institucion') return ['inicio', 'registro-comunal', 'alertas-red'];
  if (family === 'tecnico') return ['inicio', 'declaracion-sag', 'registro-comunal', 'alertas-red'];
  if (family === 'agri') return ['inicio', 'alertas-red', 'territorio'];
  if (family === 'predio') return ['inicio', 'registro-comunal', 'territorio'];
  if (family === 'comercial') return ['inicio', 'mapa-red', 'alertas-red'];
  // minimo (sin sub-rol): navegación mínima.
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
  colmenas: {
    href: '/colmenas',
    title: 'Mis colmenas',
    desc: 'Apiarios, colmenas, fichas y sanidad de tu patio.',
  },
  cuaderno: {
    href: '/colmenas/cuaderno',
    title: 'Cuaderno y bitácora',
    desc: 'Bitácora de voz, inspecciones y red semántica del apiario.',
  },
  calendario: {
    href: '/calendario',
    title: 'Calendario de campo',
    desc: 'Ciclo de temporada: floración, inspecciones y manejo.',
  },
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
    desc: 'Avisos preventivos de vecinos en tu zona. Resguardar colmenas no es fiscalizar.',
  },
  sag: {
    href: '/declaracion-sag',
    title: 'Declaración SAG',
    desc: 'Apoyo para el registro anual (Res. 8.196/2015). Tú firmas ante el SAG.',
  },
  fenologia: {
    href: '/fenologia',
    title: 'Oráculo fenológico',
    desc: 'Floración nativa y calor acumulado para anticipar mieladas.',
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

  // Agricultores / aplicadores: emitir avisos fitosanitarios y resguardar apicultores.
  if (isAgriRol(rol)) {
    return [
      {
        href: '/territorio/alertas',
        title: 'Emitir aviso fitosanitario',
        desc: 'Programa aplicaciones y avisa a los apicultores vecinos (radio 3 km).',
        primary: true,
      },
      {
        href: '/territorio/mapa',
        title: 'Apicultores en tu zona',
        desc: 'Mapa de la red apícola en tu radio de influencia.',
      },
      {
        href: '/registro-territorial',
        title: 'Censo y red comunal',
        desc: 'Directorio de contacto de apicultores de la comuna.',
      },
      {
        href: '/territorio',
        title: 'Tu perfil agrícola',
        desc: 'Datos de contacto y ubicación para alertas tempranas.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'Floración y ventanas de pecoreo para coordinar aplicaciones.',
      },
    ];
  }

  // Propietarios facilitadores: ceder predios y acoger colmenas.
  if (isPredioRol(rol)) {
    return [
      {
        href: '/registro-territorial',
        title: 'Catastro de predios',
        desc: 'Publica y gestiona tus terrenos disponibles para colmenas.',
        primary: true,
      },
      {
        href: '/territorio/trashumancia',
        title: 'Trashumancia y acuerdos',
        desc: 'Gestiona acuerdos de acogida y distancias de apoyo.',
      },
      {
        href: '/territorio/mapa',
        title: 'Colmenas acogidas',
        desc: 'Apiarios en predios de tu comuna.',
      },
      {
        href: '/territorio/alertas',
        title: 'Alertas fitosanitarias',
        desc: 'Avisos preventivos para resguardar las colmenas acogidas.',
      },
      {
        href: '/territorio',
        title: 'Tu perfil de propietario',
        desc: 'Estado de tu inscripción y consentimiento de mapa.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'Floración en tus predios y ventanas de pecoreo.',
      },
    ];
  }

  // Técnicos / inspectores: censo comunal, declaraciones SAG y monitoreo sanitario.
  if (isTecnicoRol(rol)) {
    return [
      {
        href: '/registro-territorial',
        title: 'Censo y red comunal',
        desc: 'Consulta el censo y monitorea apiarios de la comuna.',
        primary: true,
      },
      {
        href: '/declaracion-sag',
        title: 'Declaraciones SAG',
        desc: 'Informes anuales, RUP y fiscalización sanitaria.',
      },
      {
        href: '/territorio/alertas',
        title: 'Alertas fitosanitarias',
        desc: 'Seguimiento de avisos y aplicaciones en el territorio.',
      },
      {
        href: '/territorio/trashumancia',
        title: 'Trashumancia',
        desc: 'Movimientos de colmenas y distancias sanitarias.',
      },
      {
        href: '/territorio/mapa',
        title: 'Mapa de la red',
        desc: 'Distribución de apiarios y predios facilitadores.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'Floración y ventanas para inspecciones.',
      },
    ];
  }

  // Comercializadores / salas de extracción: acopio de la red.
  if (isComercialRol(rol)) {
    return [
      {
        href: '/territorio',
        title: 'Tu perfil de acopio',
        desc: 'Inscripción y datos de tu sala de extracción.',
        primary: true,
      },
      {
        href: '/registro-territorial',
        title: 'Censo y oferta apícola',
        desc: 'Directorio de apicultores y oferta de miel de la comuna.',
      },
      {
        href: '/declaracion-sag',
        title: 'Verificación sanitaria SAG',
        desc: 'Verificación de RUP y estado sanitario de apicultores.',
      },
      {
        href: '/territorio/mapa',
        title: 'Mapa de la red',
        desc: 'Apicultores y centros de acopio cercanos.',
      },
      {
        href: '/territorio/alertas',
        title: 'Alertas fitosanitarias',
        desc: 'Avisos que afectan la miel que acopias.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'Ventanas de floración para planificar acopio.',
      },
    ];
  }

  if (family === 'institucion') {
    return [
      {
        href: '/registro-territorial',
        title: 'Censo y red comunal',
        desc: 'Actores, apiarios y agregados del territorio.',
        primary: true,
      },
      {
        href: '/declaracion-sag',
        title: 'Declaraciones SAG',
        desc: 'Consulta de registros anuales del territorio.',
      },
      {
        href: '/territorio/trashumancia',
        title: 'Trashumancia comunal',
        desc: 'Control de ingresos de colmenas y distancias de resguardo.',
      },
      {
        href: '/territorio/alertas',
        title: 'Alertas fitosanitarias',
        desc: 'Seguimiento de aplicaciones cerca de zonas apícolas comunales.',
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
          toolFromCatalog('colmenas'),
          toolFromCatalog('cuaderno'),
          toolFromCatalog('alertas'),
          toolFromCatalog('sag'),
        ];
      }
      return [
        toolFromCatalog('trashumancia', true),
        toolFromCatalog('colmenas'),
        toolFromCatalog('cuaderno'),
        toolFromCatalog('alertas'),
        toolFromCatalog('censo'),
        toolFromCatalog('sag'),
      ];
    }
    if (rol === 'api_mixto') {
      return [
        toolFromCatalog('censo', censoPendiente),
        toolFromCatalog('colmenas', !censoPendiente),
        toolFromCatalog('cuaderno'),
        toolFromCatalog('trashumancia'),
        toolFromCatalog('alertas'),
        toolFromCatalog('sag'),
      ];
    }
    return [
      toolFromCatalog('censo', censoPendiente),
      toolFromCatalog('colmenas', !censoPendiente),
      toolFromCatalog('cuaderno'),
      toolFromCatalog('alertas'),
      toolFromCatalog('sag'),
      toolFromCatalog('fenologia'),
    ];
  }

  return [
    {
      href: '/territorio',
      title: 'Completar mi censo',
      desc: 'Declarar tu rol y datos del censo apícola de Chiloé.',
      primary: true,
    },
    toolFromCatalog('colmenas'),
    toolFromCatalog('cuaderno'),
  ];
}

export function getTerritorialPrimaryHref(
  rol: string | null | undefined,
  opts?: { inscrito?: boolean; censoCompleto?: boolean | null },
): string {
  if (isAgriRol(rol)) return '/territorio/alertas';
  if (isPredioRol(rol) || isTecnicoRol(rol)) return '/registro-territorial';
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
  if (isAgriRol(rol)) {
    return {
      eyebrow: 'Red territorial · agricultura',
      subtitleFallback:
        'Emite avisos fitosanitarios y resguarda a los apicultores de tu zona.',
    };
  }
  if (isPredioRol(rol)) {
    return {
      eyebrow: 'Red territorial · predios',
      subtitleFallback: 'Cede tus terrenos y acoge colmenas de la red apícola de Chiloé.',
    };
  }
  if (isTecnicoRol(rol)) {
    return {
      eyebrow: 'Red territorial · sanidad',
      subtitleFallback: 'Monitorea el censo comunal y la sanidad apícola del territorio.',
    };
  }
  if (isComercialRol(rol)) {
    return {
      eyebrow: 'Red territorial · acopio',
      subtitleFallback: 'Conecta con apicultores y planifica el acopio de miel.',
    };
  }
  if (rol === 'api_residente') {
    return {
      eyebrow: 'Red apícola · residente',
      subtitleFallback: 'Tu territorio, tus herramientas y el resguardo de la colmena en Chiloé.',
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
      subtitleFallback: 'Tu censo, alertas de pecoreo y el mapa del territorio.',
    };
  }
  return {
    eyebrow: 'Registro apícola territorial',
    subtitleFallback: 'Inscribe tus apiarios y activa la red de pecoreo.',
  };
}

// ---------------------------------------------------------------------------
// Eje 2 — cumplimiento (censo legal). Único candado de escritura territorial.
// ---------------------------------------------------------------------------

export const CENSO_WRITE_LOCK_CODE = 'censo_incompleto';

export const CENSO_WRITE_LOCK_MESSAGE =
  'Para registrar movimientos de colmenas o inscribir tu predio, primero completa los datos de tu censo apícola.';

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
