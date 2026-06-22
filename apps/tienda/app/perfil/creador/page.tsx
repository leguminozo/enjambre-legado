import dynamic from 'next/dynamic';

const CreadorPortalClient = dynamic(
  () => import('@/components/creador/creador-portal-client').then((m) => m.CreadorPortalClient),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Cargando portal creador…
      </div>
    ),
  },
);

export const metadata = {
  title: 'Embajador del Bosque | Enjambre Legado',
  description: 'Portal de comisiones por referido para creadores de contenido.',
};

export default function CreadorPerfilPage() {
  return <CreadorPortalClient />;
}