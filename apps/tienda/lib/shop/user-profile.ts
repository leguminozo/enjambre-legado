export type TiendaUserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  arboles_personal: number | null;
};

const VALID_ROLES = new Set([
  'apicultor',
  'vendedor',
  'gerente',
  'logistica',
  'marketing',
  'tienda_admin',
  'cliente',
]);

export function toTiendaUserProfile(data: unknown): TiendaUserProfile | null {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object' || Array.isArray(data)) return null;

  const record = data as Record<string, unknown>;

  return {
    id: typeof record.id === 'string' ? record.id : '',
    full_name: typeof record.full_name === 'string' ? record.full_name : null,
    email: typeof record.email === 'string' ? record.email : null,
    role: typeof record.role === 'string' && VALID_ROLES.has(record.role) ? record.role : null,
    arboles_personal: typeof record.arboles_personal === 'number' ? record.arboles_personal : null,
  };
}
