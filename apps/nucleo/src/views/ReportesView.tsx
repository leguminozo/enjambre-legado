'use client';

import { BarChart3 } from 'lucide-react';
import { ReportesComponent } from '@/views/eirl/reportes/ReportesComponent';
import { ViewShell } from '@/components/layout/ViewShell';
import { useEmpresaId } from '@/hooks/use-empresa-id';

export function ReportesView() {
  const { empresaId } = useEmpresaId();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Reportes"
        subtitle="Balances, estados de resultado, flujos y libros — con salida al contable, SII y cálculos IA."
        icon={<BarChart3 size={20} />}
      />
      <ReportesComponent empresaId={empresaId} />
    </div>
  );
}
