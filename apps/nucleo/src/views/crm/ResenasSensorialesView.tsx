'use client';

import { Star, Compass } from 'lucide-react';
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
      />
      <ResenasSensorialesTab />
    </div>
  );
}
