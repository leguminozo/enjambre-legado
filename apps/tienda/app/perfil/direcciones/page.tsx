import React from 'react';
import { getDirecciones } from '@/app/actions/direcciones';
import { DireccionesClient } from '@/components/perfil/direcciones-client';
import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Libreta de Direcciones | Enjambre',
};

export default async function DireccionesPage() {
  const t = await getTranslations('perfil.nav.links');
  const direcciones = await getDirecciones();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-secondary/50 text-accent mb-4">
          <MapPin className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-serif tracking-wide text-foreground">
          {t('direcciones')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Gestiona las direcciones donde quieres recibir la Miel de Bosque Nativo. Puedes añadir, editar y elegir tu dirección predeterminada.
        </p>
      </header>

      <section>
        <DireccionesClient initialData={direcciones} />
      </section>
    </div>
  );
}
