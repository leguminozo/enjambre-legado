'use client';

import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent';
import { useSession } from '@/providers/Providers';

export default function CalculosIaPage() {
  const session = useSession();
  const empresaId = session?.user?.app_metadata?.empresa_id ?? '';
  return <CalculosIAComponent empresaId={empresaId} />;
}
