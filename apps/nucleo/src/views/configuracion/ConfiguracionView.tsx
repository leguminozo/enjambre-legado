'use client';

import { Settings } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ConfiguracionHub } from './ConfiguracionHub';

/**
 * Página fallback de /configuracion: mismo hub unificado que el modal,
 * en formato de página completa (accesible desde el sidebar y el bottom nav).
 */
export function ConfiguracionView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Configuración"
        title="Configuración"
        subtitle="Perfil, preferencias, seguridad y sistema del enjambre"
        icon={<Settings size={20} />}
      />
      <ConfiguracionHub />
    </div>
  );
}
