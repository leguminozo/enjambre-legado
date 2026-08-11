/**
 * Roles de plataforma invitables por admin (códigos + crear cuenta directa).
 * docs/ROLES_Y_ACCESO.md · PR4
 *
 * - apicultor = patio / operación (colmenas, bitácora)
 * - territorial = red / censo (no confundir con patio)
 */

export const INVITABLE_PLATFORM_ROLES = [
  'apicultor',
  'territorial',
  'admin',
  'cliente',
  'rep_ventas',
  'creador',
] as const;

export type InvitablePlatformRole = (typeof INVITABLE_PLATFORM_ROLES)[number];

export const INVITABLE_ROLE_META: Record<
  InvitablePlatformRole,
  { label: string; desc: string }
> = {
  apicultor: {
    label: '🐝 Apicultor · patio',
    desc: 'Colmenas, cuaderno y bitácora propias (sin panel gerencial)',
  },
  territorial: {
    label: '🗺️ Territorial · red/censo',
    desc: 'Registro Territorial de Chiloé (actor de la red)',
  },
  admin: {
    label: '⚙️ Admin',
    desc: 'Acceso completo al sistema O&Z',
  },
  cliente: {
    label: '🛒 Cliente Tienda',
    desc: 'Acceso a la tienda pública',
  },
  rep_ventas: {
    label: '💼 Rep de Ventas',
    desc: 'Campo: POS feria y comisiones',
  },
  creador: {
    label: '✨ Creador',
    desc: 'Perfil de creador en tienda',
  },
};

export function isInvitablePlatformRole(value: string): value is InvitablePlatformRole {
  return (INVITABLE_PLATFORM_ROLES as readonly string[]).includes(value);
}
