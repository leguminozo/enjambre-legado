'use client';

import { Tags } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { TaxonomiasPanel } from '@/components/productos/TaxonomiasPanel';

export function TaxonomiasView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        eyebrow="Mercado"
        title="Taxonomías del Catálogo"
        subtitle="Gestión unificada de formatos, categorías y familias sensoriales de cata y producto."
        icon={<Tags size={20} />}
        variant="compact"
      />
      <TaxonomiasPanel />
    </div>
  );
}
