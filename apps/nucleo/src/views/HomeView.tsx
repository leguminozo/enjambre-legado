'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import {
  getRoleRedirectPath,
  LEGACY_ROLE_MAP,
  resolvePlatformRole,
  type RoleKey,
} from '@enjambre/auth/role-redirect';
import {
  LazyDashboardEjecutivo,
  LazyInicioApicultorView,
  LazyInicioTerritorialView,
} from '@/lib/navigation/lazy-views';
import { DashboardEjecutivoSkeleton } from '@/components/shared/skeletons';
import { adoptTerritorialSession } from '@/lib/adopt-territorial-session';

/**
 * Único home de Núcleo: `/inicio`.
 *
 * Rol canónico = `profiles.role` vía auth store (`user.role`), no solo
 * `app_metadata` (puede ir vacío o desfasado → territorial veía panel admin).
 *
 * - admin (+ legado gerente/vendedor/…): panel gerencial
 * - territorial: métricas + herramientas registro Chiloé
 * - apicultor (patio): CTAs colmenas/cuaderno/voz (no panel ejecutivo)
 * - resto: salen a tienda/campo (middleware ya acota /inicio; defensa en profundidad)
 *
 * Rutas legacy `/alma` y `/ejecutivo` solo redirigen aquí.
 */
function normalizeRole(raw: string): RoleKey | '' {
  if (!raw) return '';
  if (raw in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[raw]!;
  if (
    raw === 'admin' ||
    raw === 'apicultor' ||
    raw === 'territorial' ||
    raw === 'cliente' ||
    raw === 'creador' ||
    raw === 'rep_ventas'
  ) {
    return raw;
  }
  return '';
}

const NUCLEO_HOME_ROLES: RoleKey[] = ['admin', 'territorial', 'apicultor', 'cliente'];

export function HomeView() {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // profiles.role (SoT) — fallback app_metadata solo si store aún no hidrató user
  const profileRole = useAuthStore((s) => s.user?.role ?? '');
  const metaRole = useAuthStore((s) => {
    const r = s.session?.user?.app_metadata?.role;
    return typeof r === 'string' ? r : '';
  });
  const userMetadata = useAuthStore(
    (s) => (s.session?.user?.user_metadata as Record<string, unknown> | undefined) ?? null,
  );
  const rawRole = resolvePlatformRole({ profileRole, jwtRole: metaRole, userMetadata });
  const role = useMemo(() => normalizeRole(String(rawRole)), [rawRole]);

  // Si no hay sesión o se cerró, redirigir inmediatamente al login de Núcleo (nunca a tienda)
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if ((role === 'territorial' || role === 'cliente') && profileRole !== 'territorial') {
      void adoptTerritorialSession();
    }
  }, [role, profileRole]);

  // En Núcleo solo se desvía a apps externas si es rep_ventas (Campo POS).
  // Bajo ningún concepto se expulsa a la tienda.
  const externalHome =
    !isLoading && isAuthenticated && role === 'rep_ventas'
      ? getRoleRedirectPath(role, 'nucleo')
      : null;

  useEffect(() => {
    if (externalHome) router.replace(externalHome);
  }, [externalHome, router]);

  if (isLoading || !role || !isAuthenticated || !user) {
    return <DashboardEjecutivoSkeleton />;
  }

  if (role === 'territorial' || role === 'cliente') return <LazyInicioTerritorialView />;
  if (role === 'apicultor') return <LazyInicioApicultorView />;
  if (role === 'admin') return <LazyDashboardEjecutivo />;

  // Roles delegados o en redirección a campo
  return <DashboardEjecutivoSkeleton />;
}
