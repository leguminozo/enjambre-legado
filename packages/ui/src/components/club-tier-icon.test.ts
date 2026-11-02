import { describe, it, expect } from 'vitest';
import { CLUB_TIER_ICONS, CLUB_TIER_ICONS_MAP, ClubTierIcon } from './club-tier-icon';

describe('ClubTierIcon', () => {
  it('contiene 16 iconos curados para el Club Legado', () => {
    expect(CLUB_TIER_ICONS.length).toBe(16);
    expect(Object.keys(CLUB_TIER_ICONS_MAP).length).toBe(16);
  });

  it('resuelve correctamente slugs clave de Lucide', () => {
    expect(CLUB_TIER_ICONS_MAP['sprout']).toBeDefined();
    expect(CLUB_TIER_ICONS_MAP['tree-pine']).toBeDefined();
    expect(CLUB_TIER_ICONS_MAP['crown']).toBeDefined();
    expect(CLUB_TIER_ICONS_MAP['shield-check']).toBeDefined();
  });

  it('exporta la función del componente ClubTierIcon', () => {
    expect(typeof ClubTierIcon).toBe('function');
  });
});
