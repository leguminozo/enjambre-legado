import type { usePerfil } from '../perfil/use-perfil';

/** Todo el estado que devuelve usePerfil() — se reparte a los fragmentos del hub. */
export type PerfilFragmentProps = ReturnType<typeof usePerfil>;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
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
