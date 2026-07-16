/**
 * Prefijos de app Campo protegidos (rep_ventas / admin).
 * Sin iconos — seguro para Edge middleware.
 */
export const CAMPO_PROTECTED_PREFIXES = [
  '/pos',
  '/mi-feria',
  '/caja',
  '/comisiones',
  '/leaderboard',
] as const;

export type CampoProtectedPrefix = (typeof CAMPO_PROTECTED_PREFIXES)[number];

export function isCampoProtectedPath(pathname: string): boolean {
  return CAMPO_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
