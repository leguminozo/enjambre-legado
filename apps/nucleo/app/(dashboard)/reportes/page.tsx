'use client';

import { ReportesComponent } from '@/views/eirl/reportes/ReportesComponent';
import { useSession } from '@/providers/Providers';

export default function ReportesPage() {
  const session = useSession();
  const empresaId = session?.user?.app_metadata?.empresa_id ?? '';
  return <ReportesComponent empresaId={empresaId} />;
}
