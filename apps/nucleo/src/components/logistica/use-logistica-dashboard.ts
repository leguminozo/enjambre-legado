'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  EMPTY_LOGISTICA_DASHBOARD,
  type LogisticaDashboard,
} from '@/components/logistica/types';

/** Dashboard de logística compartido por las micro-herramientas de DESPACHO. */
export function useLogisticaDashboard() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const query = useQuery<{ data: LogisticaDashboard }>({
    queryKey: ['logistica', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/logistica/dashboard');
      if (!res.ok) throw new Error('Failed to fetch logística');
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    dashboard: query.data?.data ?? EMPTY_LOGISTICA_DASHBOARD,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}
