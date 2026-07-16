import React from 'react';
import { getDirecciones } from '@/app/actions/direcciones';
import { DireccionesClient } from '@/components/perfil/direcciones-client';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';
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
      <PerfilPageHeader
        icon={<MapPin size={20} />}
        greeting="Ajustes guardián"
        title={t('direcciones')}
        mission="Gestiona dónde recibes la miel de bosque nativo — predeterminada, editar y eliminar."
      />

      <section>
        <DireccionesClient initialData={direcciones} />
      </section>
    </div>
  );
}
