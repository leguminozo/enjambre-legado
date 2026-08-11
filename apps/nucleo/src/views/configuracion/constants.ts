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
};

export const DEFAULT_CONFIG_SECTIONS: readonly Section[] = ['personal', 'seguridad', 'preferencias'];

export function getConfigSectionsForRole(role: string | undefined | null): readonly Section[] {
  if (!role) return DEFAULT_CONFIG_SECTIONS;
  return CONFIG_SECTIONS_BY_ROLE[role] ?? DEFAULT_CONFIG_SECTIONS;
}
