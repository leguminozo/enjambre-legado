'use client';

import { Suspense } from 'react';
import { CRMView } from '@/views/crm/CRMView';
import { Loader2 } from 'lucide-react';

export default function CRMPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-accent" size={24} />
        </div>
      }
    >
      <CRMView />
    </Suspense>
  );
}
