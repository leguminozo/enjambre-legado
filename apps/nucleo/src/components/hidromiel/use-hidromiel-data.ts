'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { HidromielDetalle, HidromielLote } from '@/components/hidromiel/types';

/** Lista de lotes de hidromiel + realtime (patrón logistica). */
export function useHidromielLotes() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const query = useQuery<{ data: HidromielLote[] }>({
    queryKey: ['hidromiel', 'lotes'],
    queryFn: async () => {
      const res = await apiFetch('/api/hidromiel/lotes');
      if (!res.ok) throw new Error('Error cargando lotes de hidromiel');
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    lotes: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}

/** Detalle de un lote (mediciones, ingredientes, etapas). */
export function useHidromielDetalle(loteId: string | null) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const query = useQuery<{ data: HidromielDetalle }>({
    queryKey: ['hidromiel', 'detalle', loteId],
    queryFn: async () => {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}`);
      if (!res.ok) throw new Error('Error cargando detalle del lote');
      return res.json();
    },
    enabled: Boolean(loteId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    detalle: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}
