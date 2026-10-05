'use client';

import React from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { SlideStudioWorkbench } from '@/components/marketing/SlideStudioWorkbench';

export function EstudioRrssView() {
  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        title="Estudio RRSS"
        subtitle="Construcción ontológica anti-slop, La Mina de Oro y exportación gráfica de láminas 4:5 (1080×1350) para Instagram y X"
      />
      <SlideStudioWorkbench />
    </div>
  );
}
