import { Store, Tent, WalletCards, TrendingUp, Trophy, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CAMPO_PROTECTED_PREFIXES,
  type CampoProtectedPrefix,
} from './paths';

export type CampoNavRoute = {
  href: CampoProtectedPrefix;
  label: string;
  icon: LucideIcon;
  description: string;
};

const ICONS: Record<CampoProtectedPrefix, LucideIcon> = {
  '/pos': Store,
  '/escuela': GraduationCap,
  '/mi-feria': Tent,
  '/caja': WalletCards,
  '/comisiones': TrendingUp,
  '/leaderboard': Trophy,
};

const LABELS: Record<CampoProtectedPrefix, { label: string; description: string }> = {
  '/pos': { label: 'Punto de Venta', description: 'Catálogo y carrito' },
  '/escuela': { label: 'Escuela de Venta', description: 'Argumentarios y cata' },
  '/mi-feria': { label: 'Mi Feria', description: 'Gestión de tu puesto' },
  '/caja': { label: 'Control de Caja', description: 'Apertura y cierre' },
  '/comisiones': { label: 'Comisiones', description: 'Tus ganancias' },
  '/leaderboard': { label: 'Ranking', description: 'Leaderboard del enjambre' },
};

/** Fuente única de herramientas del rol rep_ventas en Campo. */
export const CAMPO_NAV_ROUTES: CampoNavRoute[] = CAMPO_PROTECTED_PREFIXES.map((href) => ({
  href,
  icon: ICONS[href],
  label: LABELS[href].label,
  description: LABELS[href].description,
}));

export type CampoNavGroup = {
  key: string;
  label: string;
  routes: CampoNavRoute[];
};

/**
 * Taxonomía espejo de nucleo/sidebar-config: grupos semánticos con allowlist
 * futura por rol. Un grupo hoy; el crecimiento no rompe la ergonomía móvil.
 */
export const CAMPO_NAV_GROUPS: readonly CampoNavGroup[] = [
  { key: 'terreno', label: 'Herramientas de Terreno', routes: CAMPO_NAV_ROUTES },
];

export function getCampoNavGroupsForRole(role: string | null | undefined): readonly CampoNavGroup[] {
  if (!role) return [];
  if (role === 'rep_ventas' || role === 'admin') return CAMPO_NAV_GROUPS;
  return [];
}

export { CAMPO_PROTECTED_PREFIXES, isCampoProtectedPath } from './paths';
