import { Store, Tent, WalletCards, TrendingUp, Trophy } from 'lucide-react';
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
  '/mi-feria': Tent,
  '/caja': WalletCards,
  '/comisiones': TrendingUp,
  '/leaderboard': Trophy,
};

const LABELS: Record<CampoProtectedPrefix, { label: string; description: string }> = {
  '/pos': { label: 'Punto de Venta', description: 'Catálogo y carrito' },
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

export { CAMPO_PROTECTED_PREFIXES, isCampoProtectedPath } from './paths';
