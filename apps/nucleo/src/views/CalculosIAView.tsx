'use client';

import { useAuthStore } from '@enjambre/auth';
import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent';

export function CalculosIAView() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '');
  return <CalculosIAComponent empresaId={empresaId} />;
}