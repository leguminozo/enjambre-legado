import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export type OyzRole = 'comprador' | 'suscriptor' | 'revendedor' | 'embajador';

const OYZ_ROLES = new Set<OyzRole>(['comprador', 'suscriptor', 'revendedor', 'embajador']);

function normalizeOyzRole(value: string | undefined | null): OyzRole | null {
  if (!value || !OYZ_ROLES.has(value as OyzRole)) return null;
  return value as OyzRole;
}

/** Resuelve rol comercial desde JWT validado (prioridad) o header de middleware. */
export async function resolveOyzRole(user: User | null): Promise<OyzRole> {
  const fromJwt = normalizeOyzRole(user?.app_metadata?.oyz_role as string | undefined);
  if (fromJwt) return fromJwt;

  const headersList = await headers();
  const fromHeader = normalizeOyzRole(headersList.get('x-oyz-role'));
  if (fromHeader) return fromHeader;

  return 'comprador';
}

/** @deprecated Usar resolveOyzRole(user) con getUser() cuando sea posible. */
export async function getOyzRole(): Promise<OyzRole> {
  const headersList = await headers();
  return normalizeOyzRole(headersList.get('x-oyz-role')) ?? 'comprador';
}