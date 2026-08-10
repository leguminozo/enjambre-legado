'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast } from '@enjambre/ui';

/** CRUD genérico del módulo Microcanales (invalida toda la key ['microcanales']). */
export function useMicrocanalResource<T>(resource: string) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const query = useQuery<{ data: T[] }>({
    queryKey: ['microcanales', resource],
    queryFn: async () => {
      const res = await apiFetch(`/api/b2b/${resource}`);
      if (!res.ok) throw new Error('Error al cargar los registros');
      return res.json();
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: Record<string, unknown> }) => {
      const res = await apiFetch(
        id ? `/api/b2b/${resource}/${id}` : `/api/b2b/${resource}`,
        { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al guardar');
      }
      return res.json();
    },
    onSuccess: (_d, vars) => {
      toast(vars.id ? 'Registro actualizado' : 'Registro creado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['microcanales'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/b2b/${resource}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Registro eliminado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['microcanales'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  return {
    items: (query.data?.data ?? []) as T[],
    isLoading: query.isLoading,
    save,
    remove,
  };
}
