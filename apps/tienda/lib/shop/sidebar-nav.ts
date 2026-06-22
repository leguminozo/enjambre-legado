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
import type { ParticipacionActiva } from './participacion';

export type SidebarLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type SidebarSectionConfig = {
  key: string;
  title: string;
  links: SidebarLink[];
};

const BASE_SECTIONS: SidebarSectionConfig[] = [
  {
    key: 'identidad',
    title: 'Identidad Guardiana',
    links: [
      { href: '/perfil', label: 'El Legado', icon: Shield },
      { href: '/perfil/pasaporte', label: 'Pasaporte Colmena', icon: Compass },
    ],
  },
  {
    key: 'comercio',
    title: 'Comercio Ritual',
    links: [
      { href: '/perfil/ritual', label: 'Ritual Mensual', icon: Repeat },
      { href: '/perfil/reservas', label: 'Reserva Cosecha', icon: Calendar },
      { href: '/perfil/pedidos', label: 'Historial Ritual', icon: ShoppingBag },
      { href: '/perfil/resenas', label: 'Mis Reseñas', icon: Star },
    ],
  },
  {
    key: 'red',
    title: 'Red Biocultural',
    links: [
      { href: '/perfil/circular', label: 'Circular Colmena', icon: Users },
      { href: '/perfil/canje', label: 'Canje Impacto', icon: Gem },
      { href: '/perfil/alertas', label: 'Alertas Floración', icon: Bell },
    ],
  },
  {
    key: 'ajustes',
    title: 'Ajustes',
    links: [{ href: '/perfil/ajustes', label: 'Ajustes Guardián', icon: Settings }],
  },
];

const EMBAJADOR_SECTION: SidebarSectionConfig = {
  key: 'embajador',
  title: 'Embajador del Bosque',
  links: [{ href: '/perfil/creador', label: 'Mi Código y Comisiones', icon: Sparkles }],
};

const ALIADO_SECTION: SidebarSectionConfig = {
  key: 'aliado',
  title: 'Aliado Mayorista',
  links: [{ href: '/catalogo', label: 'Catálogo Mayorista', icon: Store }],
};

export function buildSidebarSections(participacion: ParticipacionActiva): SidebarSectionConfig[] {
  const sections = [...BASE_SECTIONS];
  const insertAt = 1;

  const extras: SidebarSectionConfig[] = [];

  if (participacion.esCreador) {
    extras.push(EMBAJADOR_SECTION);
  }

  if (participacion.esAliadoB2B && participacion.aliadoEstado === 'activo') {
    extras.push(ALIADO_SECTION);
  }

  if (extras.length > 0) {
    sections.splice(insertAt, 0, ...extras);
  }

  return sections;
}