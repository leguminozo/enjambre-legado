import type { usePerfil } from '../perfil/use-perfil';

/** Todo el estado que devuelve usePerfil() — se reparte a los fragmentos del hub. */
export type PerfilFragmentProps = ReturnType<typeof usePerfil>;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  apicultor: 'Apicultor · patio',
  cliente: 'Cliente',
  creador: 'Creador',
  rep_ventas: 'Representante de Ventas',
  territorial: 'Territorial',
  institucion_municipal: 'Institución Municipal',
};

export const CANONICAL_GUARDIAN_TIERS = ['OBRERA', 'ZÁNGANO', 'REINA', 'COLMENA'] as const;
export type CanonicalGuardianTier = (typeof CANONICAL_GUARDIAN_TIERS)[number];

export const GUARDIAN_LEVELS: Record<string, { label: string; description: string; icon: string }> = {
  OBRERA: { label: 'Obrera', description: 'Inicio del camino regenerativo. Cada compra genera impacto.', icon: '🐝' },
  'ZÁNGANO': { label: 'Zángano', description: 'Conexión profunda con el territorio y reservas anticipadas.', icon: '🍯' },
  REINA: { label: 'Reina', description: 'Impacto regenerativo consolidado y reservas exclusivas.', icon: '👑' },
  COLMENA: { label: 'Colmena', description: 'Guardiana del legado y custodia del patrimonio forestal.', icon: '🏛️' },
  // Compatibilidad con cuentas previas a unificación
  brotes: { label: 'Obrera', description: 'Inicio del camino regenerativo', icon: '🐝' },
  raices: { label: 'Zángano', description: 'Profundizando en el territorio', icon: '🍯' },
  canopia: { label: 'Reina', description: 'Guardián del bosque maduro', icon: '👑' },
  legado: { label: 'Colmena', description: 'Sembrador de futuros', icon: '🏛️' },
};

export type Section =
  | 'personal'
  | 'seguridad'
  | 'empresas'
  | 'territorio'
  | 'preferencias';

export type SectionGroupId = 'cuenta' | 'territorio';

export interface SectionDef {
  key: Section;
  label: string;
  description: string;
  groupId: SectionGroupId;
}

export const SECTION_GROUPS: readonly { id: SectionGroupId; label: string }[] = [
  { id: 'cuenta', label: 'Cuenta y Seguridad' },
  { id: 'territorio', label: 'Territorio y Red' },
] as const;

export const SECTION_DEFS: Record<Section, SectionDef> = {
  personal: {
    key: 'personal',
    label: 'Datos Personales',
    description: 'Nombre, avatar e invitaciones',
    groupId: 'cuenta',
  },
  seguridad: {
    key: 'seguridad',
    label: 'Seguridad',
    description: 'Contraseña y protección de cuenta',
    groupId: 'cuenta',
  },
  preferencias: {
    key: 'preferencias',
    label: 'Preferencias',
    description: 'Apariencia, interfaz y notificaciones',
    groupId: 'cuenta',
  },
  territorio: {
    key: 'territorio',
    label: 'Territorio y Privacidad',
    description: 'Registro territorial y consentimientos',
    groupId: 'territorio',
  },
  empresas: {
    key: 'empresas',
    label: 'Empresas',
    description: 'Empresas vinculadas y roles',
    groupId: 'territorio',
  },
};

/**
 * Tabs del hub de configuración por platform role.
 * Patio/territorial: sin empresas (docs/ROLES_Y_ACCESO.md §4).
 */
export const CONFIG_SECTIONS_BY_ROLE: Record<string, readonly Section[]> = {
  admin: [
    'personal',
    'seguridad',
    'empresas',
    'territorio',
    'preferencias',
  ],
  apicultor: ['personal', 'seguridad', 'preferencias'],
  territorial: ['personal', 'seguridad', 'territorio', 'preferencias'],
  institucion_municipal: ['personal', 'seguridad', 'territorio', 'preferencias'],
};

export const DEFAULT_CONFIG_SECTIONS: readonly Section[] = ['personal', 'seguridad', 'preferencias'];

export function getConfigSectionsForRole(role: string | undefined | null): readonly Section[] {
  if (!role) return DEFAULT_CONFIG_SECTIONS;
  return CONFIG_SECTIONS_BY_ROLE[role] ?? DEFAULT_CONFIG_SECTIONS;
}

