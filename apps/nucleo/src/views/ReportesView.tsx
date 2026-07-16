'use client';

import { BarChart3 } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { ReportesComponent } from '@/views/eirl/reportes/ReportesComponent';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';

export function ReportesView() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Reportes financieros"
        subtitle="Balances, estados de resultado, flujos y libros — con salida al contable, SII y cálculos IA."
        icon={<BarChart3 size={20} />}
      />
      <ToolActionRail context="reportes" current="/reportes" />
      <ReportesComponent empresaId={empresaId} />
    </div>
  );
}
