'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { getEmpresaId } from '@/lib/api';

/**
 * Empresa activa del usuario: JWT `app_metadata.empresa_id` o membership en
 * `usuarios_empresas` (misma resolución que el BFF sin header x-empresa-id).
 */
export function useEmpresaId(): {
  empresaId: string;
  loading: boolean;
} {
  const userId = useAuthStore((s) => s.session?.user?.id ?? s.user?.id ?? '');
  const jwtEmpresaId = useAuthStore(
    (s) =>
      (typeof s.session?.user?.app_metadata?.empresa_id === 'string'
        ? s.session.user.app_metadata.empresa_id
        : '') || '',
  );

  const [empresaId, setEmpresaId] = useState(jwtEmpresaId);
  const [loading, setLoading] = useState(!jwtEmpresaId && Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setEmpresaId('');
      setLoading(false);
      return;
    }

    if (jwtEmpresaId) {
      setEmpresaId(jwtEmpresaId);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void getEmpresaId()
      .then((id) => {
        if (!cancelled) setEmpresaId(id);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, jwtEmpresaId]);

  return { empresaId, loading };
}
