'use client';

import {
  Map, Hexagon, TreePine, ShoppingBag, Truck, Megaphone, Calendar,
  Calculator, Sparkles, BarChart3, FileText, UserCog, Settings, Building2,
  CreditCard, GitMerge, Printer, Cpu, Shield, Wallet, Users, Ticket, Percent,
  Sliders, Trophy, FlaskConical, Factory, Contact, Network, TrendingUp,
} from 'lucide-react';
import type { SidebarItem, SidebarBadge } from '@/config/sidebar-config';
import type { SidebarNavItemData } from '@enjambre/ui';

export const LUCIDE_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  network: Network,
  map: Map,
  hexagon: Hexagon,
  'tree-pine': TreePine,
  'shopping-bag': ShoppingBag,
  truck: Truck,
  megaphone: Megaphone,
  sparkles: Sparkles,
  calculator: Calculator,
  'file-text': FileText,
  'building-2': Building2,
  'credit-card': CreditCard,
  'git-merge': GitMerge,
  printer: Printer,
  cpu: Cpu,
  'bar-chart-3': BarChart3,
  shield: Shield,
  wallet: Wallet,
  users: Users,
  ticket: Ticket,
  percent: Percent,
  sliders: Sliders,
  trophy: Trophy,
  'flask-conical': FlaskConical,
  factory: Factory,
  'user-cog': UserCog,
  settings: Settings,
  contact: Contact,
  calendar: Calendar,
  'trending-up': TrendingUp,
};

export function toNavItemDataFromItem(
  item: SidebarItem,
  badgeOverrides: Record<string, SidebarBadge>,
): SidebarNavItemData {
  const IconComp = LUCIDE_MAP[item.icon];
  return {
    key: item.key,
    label: item.label,
    icon: IconComp ? <IconComp size={18} /> : <span />,
    href: item.href,
    badge: badgeOverrides[item.key] ?? item.badge ?? null,
  };
}