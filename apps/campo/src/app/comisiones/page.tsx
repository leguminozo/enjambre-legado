'use client';

import { useAuthStore } from '@enjambre/auth';
import { ComisionesPanel } from '@/components/comisiones/ComisionesPanel';
import HistorialPage from '@/app/pos/historial/page';

export default function ComisionesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <ComisionesPanel />;
  }

  return <HistorialPage />;
}
