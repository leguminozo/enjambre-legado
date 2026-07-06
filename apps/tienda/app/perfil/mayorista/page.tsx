import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';
import { assertStoreRouteAccess } from '@/lib/shop/assert-route-access';
import { createClient } from '@/utils/supabase/server';
import { getParticipacionActiva } from '@/lib/shop/participacion';

export const metadata = {
  title: 'Aliado Mayorista | Enjambre Legado',
  description: 'Portal mayorista B2B para aliados activos.',
};

export default async function MayoristaPerfilPage() {
  await assertStoreRouteAccess('/perfil/mayorista');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const participacion = user ? await getParticipacionActiva(supabase, user.id) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="editorial-kicker">Aliado Mayorista</p>
        <h1 className="font-display text-3xl font-light text-foreground">Catálogo B2B</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Acceso exclusivo para aliados con estado activo. Tus condiciones comerciales se aplican al
          finalizar pedidos desde el catálogo.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-accent/10 p-3 text-accent">
            <Store size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">Estado aliado</p>
            <p className="font-display text-xl text-foreground capitalize">
              {participacion?.aliadoEstado ?? 'activo'}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Explora creaciones con precios y mínimos mayoristas. Si necesitas soporte comercial, contacta al
          equipo desde tu panel de alertas.
        </p>

        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground transition hover:opacity-90"
        >
          Ir al catálogo mayorista
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}