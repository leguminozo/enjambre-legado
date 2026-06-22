'use client';

import { useAuthStore } from '@enjambre/auth';
import { ReportesComponent } from '@/views/eirl/reportes/ReportesComponent';

export function ReportesView() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '');
  return <ReportesComponent empresaId={empresaId} />;
}