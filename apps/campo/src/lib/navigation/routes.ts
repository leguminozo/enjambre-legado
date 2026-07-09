import { Store, Tent, WalletCards, TrendingUp, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CampoNavRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const CAMPO_NAV_ROUTES: CampoNavRoute[] = [
  {
    href: '/pos',
    label: 'Punto de Venta',
    icon: Store,
    description: 'Catálogo y carrito',
  },
  {
    href: '/mi-feria',
    label: 'Mi Feria',
    icon: Tent,
    description: 'Gestión de tu puesto',
  },
  {
    href: '/caja',
    label: 'Control de Caja',
    icon: WalletCards,
    description: 'Apertura y cierre',
  },
  {
    href: '/comisiones',
    label: 'Comisiones',
    icon: TrendingUp,
    description: 'Tus ganancias',
  },
  {
    href: '/leaderboard',
    label: 'Ranking',
    icon: Trophy,
    description: 'Leaderboard del enjambre',
  },
];
