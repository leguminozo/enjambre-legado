'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import { LEGACY_ROLE_MAP } from '@enjambre/auth/role-redirect';
import { ViewLoading } from '@enjambre/ui';

/**
 * Bookmark legacy /colmenas/trazabilidad.
 * - Admin → Lotes (pasaporte QR en producción).
 * - Patio / otros → colmenas (no hay lotes comerciales en allowlist patio).
 * Evita redirigir patio a /produccion/* (admin-only → bounce de middleware).
 */
export default function TrazabilidadRedirectPage() {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const rawRole = useAuthStore((s) => s.user?.role ?? '');

  useEffect(() => {
    if (isLoading) return;
    const normalized = LEGACY_ROLE_MAP[rawRole] ?? rawRole;
    if (normalized === 'admin') {
      router.replace('/produccion/lotes');
      return;
    }
    router.replace('/colmenas');
  }, [isLoading, rawRole, router]);

  return <ViewLoading variant="view" label="Redirigiendo" hideLabel />;
}
