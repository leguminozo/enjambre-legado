/**
 * Sub-roles territoriales (eje B) — docs/ROLES_Y_ACCESO.md · PR5 oleada 2a.
 *
 * Fuente de verdad en runtime (orden):
 * 1. `actores_registro.rol` (si el actor está inscrito)
 * 2. `user_metadata.territorial_rol` (signup / invitación, pre-inscripción)
 *
 * Oleada 2a: solo dos familias de menú.
 * Oleada 2b: resto de sub-roles con menús propios.
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

export function isTerritorialRol(value: string | null | undefined): value is TerritorialRol {
  return !!value && (TERRITORIAL_ROLES as readonly string[]).includes(value);
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

/**
 * Keys de sidebar visibles por familia (ROLE_VISIBLE base territorial se refina aquí).
 * Keys deben existir en SIDEBAR_GROUPS / ACCOUNT_ITEMS.
 */
export const TERRITORIAL_FAMILY_VISIBLE_KEYS: Record<
  TerritorialMenuFamily,
  readonly string[]
> = {
  /** Registro propio, mapa/consentimientos vía /territorio, planes, fenología */
  api: ['inicio', 'territorio', 'mis-planes', 'fenologia'],
  /** Censo/red comunitaria + mapa institucional + fenología */
  institucion: ['inicio', 'territorio', 'registro-comunal', 'fenologia'],
  /** Sin sub-rol o 2b aún no abierto: solo home + entrada al registro */
  minimo: ['inicio', 'territorio'],
};

export function getTerritorialVisibleKeys(
  rol: string | null | undefined,
): readonly string[] {
  return TERRITORIAL_FAMILY_VISIBLE_KEYS[resolveTerritorialMenuFamily(rol)];
}

export function getTerritorialBottomNavKeys(
  rol: string | null | undefined,
): readonly string[] {
  const family = resolveTerritorialMenuFamily(rol);
  if (family === 'institucion') return ['inicio', 'registro-comunal'];
  if (family === 'api') return ['inicio', 'territorio'];
  return ['inicio', 'territorio'];
}

export type TerritorialHomeTool = {
  href: string;
  title: string;
  desc: string;
  primary?: boolean;
};

export function getTerritorialHomeTools(
  rol: string | null | undefined,
): readonly TerritorialHomeTool[] {
  const family = resolveTerritorialMenuFamily(rol);

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
    return [
      {
        href: '/territorio',
        title: 'Mi registro',
        desc: 'Inscripción, apiarios, consentimientos y mapa.',
        primary: true,
      },
      {
        href: '/mis-planes',
        title: 'Mis planes',
        desc: 'Planes de temporada y herramientas de la red.',
      },
      {
        href: '/fenologia',
        title: 'Oráculo fenológico',
        desc: 'GDD y floración — ventana de trabajo en campo.',
      },
    ];
  }

  // mínimo / sin actor
  return [
    {
      href: '/territorio',
      title: 'Inscribirme en el registro',
      desc: 'Declará tu rol en la red territorial de Chiloé.',
      primary: true,
    },
  ];
}

export function getTerritorialHomeCopy(rol: string | null | undefined): {
  eyebrow: string;
  subtitleFallback: string;
} {
  const family = resolveTerritorialMenuFamily(rol);
  if (family === 'institucion') {
    return {
      eyebrow: 'Institución · red territorial',
      subtitleFallback:
        'Vista comunal: censo, mapa y herramientas de gobernanza apícola.',
    };
  }
  if (family === 'api') {
    return {
      eyebrow: 'Red apícola · Chiloé',
      subtitleFallback:
        'Tu registro, tus planes y el pulso fenológico del territorio.',
    };
  }
  return {
    eyebrow: 'Registro Territorial · Chiloé',
    subtitleFallback: 'Bienvenido al Registro Territorial Apícola de Chiloé.',
  };
}
