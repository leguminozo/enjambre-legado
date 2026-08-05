'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
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
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('logistica-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logistica_envios' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['logistica'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    dashboard: query.data?.data ?? EMPTY_LOGISTICA_DASHBOARD,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}
