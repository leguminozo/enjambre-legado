import type { ComponentType } from 'react';
import {
  Sprout,
  Leaf,
  Flower2,
  TreePine,
  Trees,
  Droplets,
  Hexagon,
  Sparkles,
  Shield,
  ShieldCheck,
  Award,
  Compass,
  Crown,
  Feather,
  Landmark,
  Gem,
} from 'lucide-react';

export interface ClubTierIconOption {
  slug: string;
  label: string;
  category: 'botanica' | 'nectar' | 'distincion' | 'maestria';
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const CLUB_TIER_ICONS: readonly ClubTierIconOption[] = [
  { slug: 'sprout', label: 'Brote Nativo', category: 'botanica', icon: Sprout },
  { slug: 'leaf', label: 'Hoja de Bosque', category: 'botanica', icon: Leaf },
  { slug: 'flower-2', label: 'Flor de Ulmo', category: 'botanica', icon: Flower2 },
  { slug: 'tree-pine', label: 'Canelo Austral', category: 'botanica', icon: TreePine },
  { slug: 'trees', label: 'Dosel de Bosque', category: 'botanica', icon: Trees },
  { slug: 'droplets', label: 'Gota de Néctar', category: 'nectar', icon: Droplets },
  { slug: 'hexagon', label: 'Celda de Cera', category: 'nectar', icon: Hexagon },
  { slug: 'sparkles', label: 'Pureza de Origen', category: 'nectar', icon: Sparkles },
  { slug: 'compass', label: 'Rumbo Austral', category: 'distincion', icon: Compass },
  { slug: 'shield', label: 'Vínculo Territorial', category: 'distincion', icon: Shield },
  { slug: 'shield-check', label: 'Origen Verificado', category: 'distincion', icon: ShieldCheck },
  { slug: 'award', label: 'Sello Distinción', category: 'distincion', icon: Award },
  { slug: 'crown', label: 'Soberanía / Reina', category: 'maestria', icon: Crown },
  { slug: 'feather', label: 'Maestría de Autor', category: 'maestria', icon: Feather },
  { slug: 'landmark', label: 'Patrimonio de Chiloé', category: 'maestria', icon: Landmark },
  { slug: 'gem', label: 'Partida Singular', category: 'maestria', icon: Gem },
] as const;

export const CLUB_TIER_ICONS_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = Object.fromEntries(
  CLUB_TIER_ICONS.map((opt) => [opt.slug, opt.icon]),
);

export interface ClubTierIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export function ClubTierIcon({ icon, className = 'w-4 h-4', size = 16 }: ClubTierIconProps) {
  if (!icon) {
    return <Sprout size={size} className={className} />;
  }

  // Fallback si es un emoji unicode legacy guardado previamente
  if (/\p{Extended_Pictographic}/u.test(icon)) {
    return (
      <span className={className} style={{ fontSize: size }} aria-hidden>
        {icon}
      </span>
    );
  }

  const IconComp = CLUB_TIER_ICONS_MAP[icon] ?? Sprout;
  return <IconComp size={size} className={className} />;
}
