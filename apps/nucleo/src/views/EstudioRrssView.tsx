'use client';

import React from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { SlideStudioWorkspace } from '@/components/marketing/SlideStudioWorkspace';

export function EstudioRrssView() {
  return (
    <div className="space-y-6">
      {/* Cabecera del módulo */}
      <ViewShell
        title="Estudio Editorial & Kits de Entrega"
        subtitle="Entorno multiformato (4:5, 9:16, 1:1) para kits de cafeterías, pasaportes de lote, fichas de mesa y campañas"
      />

      <SlideStudioWorkspace />
    </div>
  );
}
