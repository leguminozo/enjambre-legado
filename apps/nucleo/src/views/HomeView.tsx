'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import {
  getRoleRedirectPath,
  LEGACY_ROLE_MAP,
  type RoleKey,
} from '@enjambre/auth/role-redirect';
import { ViewLoading } from '@enjambre/ui';
import { LazyDashboardEjecutivo, LazyInicioTerritorialView } from '@/lib/navigation/lazy-views';

/**
 * Único home de Núcleo: `/inicio`.
 *
 * Rol canónico = `profiles.role` vía auth store (`user.role`), no solo
 * `app_metadata` (puede ir vacío o desfasado → territorial veía panel admin).
 *
 * - admin (+ legado gerente/apicultor/…): panel gerencial
 * - territorial: métricas + herramientas registro Chiloé
 * - resto: salen a tienda/campo (middleware ya acota /inicio; defensa en profundidad)
 *
 * Rutas legacy `/alma` y `/ejecutivo` solo redirigen aquí.
 */
function normalizeRole(raw: string): RoleKey | '' {
  if (!raw) return '';
  if (raw in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[raw]!;
  if (
    raw === 'admin' ||
    raw === 'territorial' ||
    raw === 'cliente' ||
    raw === 'creador' ||
    raw === 'rep_ventas'
  ) {
    return raw;
  }
  return '';
}

export function HomeView() {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  // profiles.role (SoT) — fallback app_metadata solo si store aún no hidrató user
  const profileRole = useAuthStore((s) => s.user?.role ?? '');
  const metaRole = useAuthStore((s) => {
    const r = s.session?.user?.app_metadata?.role;
    return typeof r === 'string' ? r : '';
  });
  const rawRole = profileRole || metaRole;
  const role = useMemo(() => normalizeRole(String(rawRole)), [rawRole]);

  const externalHome =
    !isLoading && role && role !== 'admin' && role !== 'territorial'
      ? getRoleRedirectPath(role, 'nucleo')
      : null;

  useEffect(() => {
    if (externalHome) router.replace(externalHome);
  }, [externalHome, router]);

  if (isLoading || !role) {
    return <ViewLoading label="Cargando inicio" variant="view" />;
  }

  if (role === 'territorial') return <LazyInicioTerritorialView />;
  if (role === 'admin') return <LazyDashboardEjecutivo />;

  // Redirigiendo a tienda/campo
  return <ViewLoading label="Redirigiendo" variant="view" />;
}
