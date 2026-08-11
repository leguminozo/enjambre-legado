import { describe, expect, it } from 'vitest';
import {
  INVITABLE_PLATFORM_ROLES,
  INVITABLE_ROLE_META,
  isInvitablePlatformRole,
} from '../invitation-roles';

describe('invitation-roles (PR4)', () => {
  it('incluye apicultor patio y territorial red como roles distintos', () => {
    expect(INVITABLE_PLATFORM_ROLES).toContain('apicultor');
    expect(INVITABLE_PLATFORM_ROLES).toContain('territorial');
    expect(INVITABLE_PLATFORM_ROLES).toContain('admin');
    expect(INVITABLE_ROLE_META.apicultor.label.toLowerCase()).toMatch(/patio/);
    expect(INVITABLE_ROLE_META.territorial.label.toLowerCase()).toMatch(/territorial|censo|red/);
  });

  it('cada rol invitable tiene label y desc', () => {
    for (const role of INVITABLE_PLATFORM_ROLES) {
      expect(INVITABLE_ROLE_META[role].label.length).toBeGreaterThan(2);
      expect(INVITABLE_ROLE_META[role].desc.length).toBeGreaterThan(8);
    }
  });

  it('isInvitablePlatformRole es fail-closed', () => {
    expect(isInvitablePlatformRole('apicultor')).toBe(true);
    expect(isInvitablePlatformRole('gerente')).toBe(false);
    expect(isInvitablePlatformRole('')).toBe(false);
  });
});
