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

export const GUARDIAN_LEVELS: Record<string, { label: string; description: string; icon: string }> = {
  brotes: { label: 'Brotes', description: 'Inicio del camino regenerativo', icon: '🌱' },
  raices: { label: 'Raíces', description: 'Profundizando en el territorio', icon: '🌿' },
  canopia: { label: 'Canopía', description: 'Guardián del bosque maduro', icon: '🌳' },
  legado: { label: 'Legado', description: 'Sembrador de futuros', icon: '🏆' },
};

export type Section =
  | 'personal'
  | 'seguridad'
  | 'empresas'
  | 'territorio'
  | 'guardian'
  | 'preferencias'
  | 'sistema';

export type SectionGroupId = 'cuenta' | 'territorio' | 'sistema';

export interface SectionDef {
  key: Section;
  label: string;
  description: string;
  groupId: SectionGroupId;
}

export const SECTION_GROUPS: readonly { id: SectionGroupId; label: string }[] = [
  { id: 'cuenta', label: 'Cuenta y Seguridad' },
  { id: 'territorio', label: 'Territorio y Red' },
  { id: 'sistema', label: 'Plataforma y Sistema' },
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
  guardian: {
    key: 'guardian',
    label: 'Nivel Guardián',
    description: 'Puntos acumulados y biocultura',
    groupId: 'territorio',
  },
  sistema: {
    key: 'sistema',
    label: 'Sistema',
    description: 'Ajustes del enjambre y plataforma',
    groupId: 'sistema',
  },
};

/**
 * Tabs del hub de configuración por platform role.
 * Patio/territorial: sin empresas ni sistema admin (docs/ROLES_Y_ACCESO.md §4).
 */
export const CONFIG_SECTIONS_BY_ROLE: Record<string, readonly Section[]> = {
  admin: [
    'personal',
    'seguridad',
    'empresas',
    'territorio',
    'guardian',
    'preferencias',
    'sistema',
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

