'use client';

import { Brain } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';

export function CalculosIAView() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Cálculos inteligentes"
        subtitle="Impuestos, PPM, proyección y optimización fiscal — enlazados a contable, SII y reportes."
        icon={<Brain size={20} />}
      />
      <ToolActionRail context="calculosIa" current="/calculos-ia" />
      <CalculosIAComponent empresaId={empresaId} />
    </div>
  );
}
