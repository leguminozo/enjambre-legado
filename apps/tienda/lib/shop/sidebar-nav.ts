import type { LucideIcon } from 'lucide-react';
import type { ParticipacionActiva } from './participacion';
import { PERFIL_NAV_ICONS } from './perfil-nav-icons';
import {
  buildPerfilNavSections,
  type PerfilNavLinkKey,
  type PerfilSectionKey,
} from './store-routes';

export type SidebarLink = {
  href: string;
  labelKey: PerfilNavLinkKey;
  icon: LucideIcon;
};

export type SidebarSectionConfig = {
  key: PerfilSectionKey;
  titleKey: PerfilSectionKey;
  links: SidebarLink[];
};

/** Ensambla secciones del sidebar desde el contrato canónico + iconos locales. */
export function buildSidebarSections(participacion: ParticipacionActiva): SidebarSectionConfig[] {
  return buildPerfilNavSections(participacion).map((section) => ({
    key: section.key,
    titleKey: section.titleKey,
    links: section.links.map((link) => ({
      href: link.href,
      labelKey: link.labelKey,
      icon: PERFIL_NAV_ICONS[link.labelKey],
    })),
  }));
}