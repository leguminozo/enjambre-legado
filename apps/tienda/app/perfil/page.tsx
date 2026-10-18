import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CloudOff } from 'lucide-react';
import { EmptyState } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/server';
import { MiLegadoClient } from '@/components/shop/mi-legado-client';
import { loadPerfilDashboard } from '@/lib/shop/perfil-dashboard';

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let dashboard: Awaited<ReturnType<typeof loadPerfilDashboard>> | null = null;
  try {
    dashboard = await loadPerfilDashboard(supabase, user.id);
  } catch (error) {
    console.error('[perfil] dashboard load failed:', error);
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          icon={<CloudOff className="h-8 w-8" />}
          title="No pudimos cargar tu legado"
          description="Hubo un problema de conexión con el bosque. Tus datos están a salvo — inténtalo nuevamente."
          action={
            <Link
              href="/perfil"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reintentar
            </Link>
          }
        />
      </div>
    );
  }

  return <MiLegadoClient {...dashboard} />;
}