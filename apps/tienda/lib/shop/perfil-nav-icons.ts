import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Compass,
  Repeat,
  Calendar,
  ShoppingBag,
  Users,
  Gem,
  Bell,
  Settings,
  Sparkles,
  Store,
  Star,
} from 'lucide-react';
import type { PerfilNavLinkKey } from './store-routes';

/** Mapa de iconos por contrato — solo presentación; rutas viven en store-routes. */
export const PERFIL_NAV_ICONS: Record<PerfilNavLinkKey, LucideIcon> = {
  legado: Shield,
  pasaporte: Compass,
  reposicion: Repeat,
  reservas: Calendar,
  pedidos: ShoppingBag,
  resenas: Star,
  circular: Users,
  canje: Gem,
  alertas: Bell,
  ajustes: Settings,
  creadorPortal: Sparkles,
  mayoristaPortal: Store,
  catalogoMayorista: Store,
};