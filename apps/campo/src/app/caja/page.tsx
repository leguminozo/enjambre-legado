'use client';

import { useAuthStore } from '@enjambre/auth';
import { CashSessionsPanel } from '@/components/caja/CashSessionsPanel';
import { CashProvider } from '@/components/pos/cash-context';
import PosIndex from '@/app/pos/page';

export default function CajaPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <CashSessionsPanel />;
  }

  return (
    <CashProvider>
      <PosIndex />
    </CashProvider>
  );
}
