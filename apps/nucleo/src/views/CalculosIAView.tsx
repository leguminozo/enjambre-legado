'use client';

import Link from 'next/link';
import { Brain, FileText, Calculator } from 'lucide-react';
import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent';
import { ViewShell } from '@/components/layout/ViewShell';
import { useEmpresaId } from '@/hooks/use-empresa-id';

export function CalculosIAView() {
  const { empresaId } = useEmpresaId();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Cálculos IA"
        subtitle="Impuestos, PPM, proyección y optimización fiscal — enlazados a contable, SII y reportes."
        icon={<Brain size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/sii"
              className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-11 px-3"
            >
              <FileText size={16} />
              DTE & Facturación
            </Link>
            <Link
              href="/contable"
              className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-11 px-3"
            >
              <Calculator size={16} />
              Contabilidad
            </Link>
          </div>
        }
      />
      <CalculosIAComponent empresaId={empresaId} />
    </div>
  );
}
