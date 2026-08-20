'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useAuthStore } from '@enjambre/auth';
import type { ActorLegal } from '@/components/apicultor/CensoLegalWizard';

export function useTerritorialActor() {
  const apiFetch = useApiFetch();
  const role = useAuthStore((s) => s.user?.role ?? '');

  return useQuery<{ data: ActorLegal | null }>({
    queryKey: ['territorio-actor-me'],
    enabled: role === 'territorial' || role === 'admin',
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/actores/me');
      if (!res.ok) throw new Error('Error cargando tu inscripción');
      return res.json();
    },
    staleTime: 15_000,
  });
}
