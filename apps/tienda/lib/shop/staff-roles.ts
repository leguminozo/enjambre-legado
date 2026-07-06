import { LEGACY_ROLE_MAP } from '@enjambre/auth/role-redirect';

/** Roles de `profiles.role` / `app_metadata.role` que operan en Núcleo, no en tienda pública. */
export const NUCLEO_STAFF_PROFILE_ROLES = new Set([
  'admin',
  'gerente',
  'apicultor',
  'vendedor',
  'logistica',
  'marketing',
  'tienda_admin',
]);

export function normalizeStaffRole(role: string | null | undefined): string {
  if (!role) return 'cliente';
  return LEGACY_ROLE_MAP[role] ?? role;
}

export function isNucleoStaffRole(role: string | null | undefined): boolean {
  if (!role) return false;
  if (NUCLEO_STAFF_PROFILE_ROLES.has(role)) return true;
  return normalizeStaffRole(role) === 'admin';
}