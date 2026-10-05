'use client';

import React from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { SlideStudioWorkspace } from '@/components/marketing/SlideStudioWorkspace';

export function EstudioRrssView() {
  return (
    <div className="space-y-6">
      {/* Cabecera del módulo */}
      <ViewShell
        title="Estudio RRSS"
        subtitle="Entorno editorial para construcción abstracta de láminas 4:5 (1080×1350 px) y exportación directa"
      />

      <SlideStudioWorkspace />
    </div>
  );
}
