'use client';

import { ComisionesPanel } from '@/components/comisiones/ComisionesPanel';

export default function ComisionesPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <ComisionesPanel />
      </div>
    </div>
  );
}
