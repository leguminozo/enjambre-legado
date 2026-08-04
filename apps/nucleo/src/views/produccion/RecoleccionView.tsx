'use client';

import { Droplets } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { RecoleccionPanel } from '@/components/produccion/RecoleccionPanel';

/**
 * Recolección (nunca “cosecha” en la UI): registro de kg por fecha/floración.
 * Primera capa de PRODUCCIÓN — simple y trazable hacia lotes.
 */
export function RecoleccionView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Recolección"
        subtitle="Registra cada recolección: kilos, floración y colmena. Es el punto de entrada del flujo productivo — no el inventario de frascos."
        icon={<Droplets size={20} />}
      />
      <RecoleccionPanel />
    </div>
  );
}
