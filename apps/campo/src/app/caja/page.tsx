'use client';

import { CashSessionsPanel } from '@/components/caja/CashSessionsPanel';

export default function CajaPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <CashSessionsPanel />
      </div>
    </div>
  );
}
