'use client';

import Link from 'next/link';
import { Package, Tags } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { TaxonomiasPanel } from '@/components/productos/TaxonomiasPanel';

export function TaxonomiasView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        eyebrow="Mercado"
        title="Formatos y Categorías"
        subtitle="Configuración de taxonomías de tienda: envases, pesos, variedades botánicas y sellos."
        icon={<Tags size={20} />}
        variant="compact"
        actions={
          <Link
            href="/catalogo"
            className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-11 px-3"
          >
            <Package size={16} />
            Ver Catálogo de Productos
          </Link>
        }
      />
      <TaxonomiasPanel />
    </div>
  );
}
