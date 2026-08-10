'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast } from '@enjambre/ui';

interface SaveVars {
  id?: string
  body: Record<string, unknown>
}

/**
 * CRUD genérico de un recurso del módulo Infusiones.
 * Las mutaciones invalidan todas las queries ['infusiones', ...] — el resumen
 * y los paneles de la cadena (entrada → deshidratado → producción) se refrescan juntos.
 */
export function useInfusionResource<T>(resource: string) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const query = useQuery<{ data: T[] }>({
    queryKey: ['infusiones', resource],
    queryFn: async () => {
      const res = await apiFetch(`/api/infusiones/${resource}`);
      if (!res.ok) throw new Error('Error al cargar los registros');
      return res.json();
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, body }: SaveVars) => {
      const res = await apiFetch(
        id ? `/api/infusiones/${resource}/${id}` : `/api/infusiones/${resource}`,
        { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al guardar');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      toast(vars.id ? 'Registro actualizado' : 'Registro creado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['infusiones'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/infusiones/${resource}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Registro eliminado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['infusiones'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  return {
    items: (query.data?.data ?? []) as T[],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    save,
    remove,
  };
}
