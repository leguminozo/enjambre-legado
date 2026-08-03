'use client';

import { useAuthStore } from '@enjambre/auth';
import { LazyDashboardEjecutivo, LazyInicioTerritorialView } from '@/lib/navigation/lazy-views';

/**
 * Inicio del dashboard: distingue por rol.
 * - admin: el panel ejecutivo pasa a ser el Inicio.
 * - territorial: bienvenida + métricas personales + widgets del apicultor residente.
 */
export function HomeView() {
  const role = useAuthStore((s) => s.session?.user?.app_metadata?.role ?? '');
  if (role === 'territorial') return <LazyInicioTerritorialView />;
  return <LazyDashboardEjecutivo />;
}
