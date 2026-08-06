'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
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
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('hidromiel-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidromiel_lotes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hidromiel'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    lotes: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}

/** Detalle de un lote (mediciones, ingredientes, etapas) + realtime por lote. */
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
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!loteId) return;
    const channel = supabase
      .channel(`hidromiel-detalle-${loteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidromiel_mediciones', filter: `lote_id=eq.${loteId}` },
        () => queryClient.invalidateQueries({ queryKey: ['hidromiel'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidromiel_ingredientes', filter: `lote_id=eq.${loteId}` },
        () => queryClient.invalidateQueries({ queryKey: ['hidromiel'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidromiel_etapas', filter: `lote_id=eq.${loteId}` },
        () => queryClient.invalidateQueries({ queryKey: ['hidromiel'] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loteId, queryClient]);

  return {
    detalle: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}
