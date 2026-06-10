import { LEGACY_ROLE_MAP, type RoleKey } from '@enjambre/auth/role-redirect';

export type TiendaUserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  arboles_personal: number | null;
};

const VALID_ROLES = new Set<RoleKey>([
  'admin',
  'cliente',
  'creador',
  'rep_ventas',
]);

export function toTiendaUserProfile(data: unknown): TiendaUserProfile | null {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object' || Array.isArray(data)) return null;

  const record = data as Record<string, unknown>;
  const rawRole = typeof record.role === 'string' ? record.role : '';
  const normalizedRole = (LEGACY_ROLE_MAP[rawRole] ?? rawRole) as RoleKey;

  return {
    id: typeof record.id === 'string' ? record.id : '',
    full_name: typeof record.full_name === 'string' ? record.full_name : null,
    email: typeof record.email === 'string' ? record.email : null,
    role: VALID_ROLES.has(normalizedRole) ? normalizedRole : null,
    arboles_personal: typeof record.arboles_personal === 'number' ? record.arboles_personal : null,
  };
}
