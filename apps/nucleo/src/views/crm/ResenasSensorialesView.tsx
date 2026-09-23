'use client';

import Link from 'next/link';
import { Star, Compass, Users } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResenasSensorialesTab } from './components/ResenasSensorialesTab';

export function ResenasSensorialesView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        eyebrow="Mercado · Cata & Feedback"
        title="Reseñas Sensoriales"
        subtitle="Notas de cata, percepciones organolépticas y huella sensorial reportada por clientes de la tienda."
        icon={<Compass size={20} />}
        variant="compact"
        actions={
          <Link
            href="/crm"
            className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-11 px-3"
          >
            <Users size={16} />
            Volver a CRM
          </Link>
        }
      />
      <ResenasSensorialesTab />
    </div>
  );
}
