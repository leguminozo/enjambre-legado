'use client';

import { Brain } from 'lucide-react';
import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent';
import { ViewShell } from '@/components/layout/ViewShell';
import { useEmpresaId } from '@/hooks/use-empresa-id';

export function CalculosIAView() {
  const { empresaId } = useEmpresaId();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="SII · Fiscal"
        title="Cálculos IA Fiscal"
        subtitle="Impuestos, PPM, proyección y optimización fiscal — enlazados a contable, SII y reportes."
        icon={<Brain size={20} />}
      />
      <CalculosIAComponent empresaId={empresaId} />
    </div>
  );
}
