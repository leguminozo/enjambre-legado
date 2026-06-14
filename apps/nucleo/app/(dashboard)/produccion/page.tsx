'use client';

import { Construction } from 'lucide-react';

export default function ProduccionPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4 animate-in">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
        <Construction size={32} />
      </div>
      <h1 className="text-2xl font-existencial text-foreground">Módulo en Construcción</h1>
      <p className="text-muted-foreground text-center max-w-md font-datos">
        El módulo de Producción está siendo desarrollado. Pronto estará disponible con las nuevas funcionalidades de Enjambre Legado.
      </p>
    </div>
  );
}
