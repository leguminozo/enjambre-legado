import React, { Suspense } from 'react';
import Link from 'next/link';
import { PerfilLayoutClient } from '@/app/perfil/perfil-layout-client';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { getDemoUser } from '@/lib/shop/demo-perfil-data';

export const revalidate = 3600;

export const metadata = {
  title: 'Demostración de Experiencia de Cliente — Enjambre Legado',
  description:
    'Exploración interactiva del área de clientes, pasaporte de colmena, pedidos y tarjeta obrera con datos sintéticos para agentes de IA y visitantes.',
};

export default function DemoPerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getDemoUser();

  const participacion = {
    esCreador: false,
    creadorEstado: null,
    esAliadoB2B: false,
    aliadoEstado: null,
  };

  return (
    <div className="perfil-shell h-[var(--vh-full)] overflow-hidden bg-background text-foreground flex flex-col">
      {/* Banner de modo demostración agéntica */}
      <aside aria-label="Aviso de demostración" className="bg-surface-raised border-b border-border px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono uppercase tracking-wider text-[0.65rem] font-bold text-accent-text">
            Modo Demostración Agéntica
          </span>
          <span className="text-muted-foreground hidden md:inline text-[0.75rem]">
            · Experiencia de cliente interactiva con datos sintéticos para modelos de IA y exploradores
          </span>
        </div>

        <nav aria-label="Navegación de demostración" className="flex items-center gap-3 text-[0.7rem]">
          <Link href="/demo/perfil" className="text-muted-foreground hover:text-foreground">
            Mi Legado
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/demo/perfil/pasaporte" className="text-muted-foreground hover:text-foreground">
            Pasaporte
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/demo/perfil/pedidos" className="text-muted-foreground hover:text-foreground">
            Pedidos
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/demo/perfil/billetera" className="text-muted-foreground hover:text-foreground">
            Billetera
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/demo/perfil/reposicion" className="text-muted-foreground hover:text-foreground">
            Reposición
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/catalogo" className="text-primary hover:underline">
            Ir a Tienda
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex overflow-hidden relative">
        <CustomCursor />
        <PerfilLayoutClient user={user} role="suscriptor" participacion={participacion}>
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse" aria-busy="true">
                <div className="h-8 w-2/3 bg-surface-raised rounded-lg" />
                <div className="h-40 bg-surface-raised rounded-2xl" />
                <div className="h-40 bg-surface-raised rounded-2xl" />
              </div>
            }
          >
            {children}
          </Suspense>
        </PerfilLayoutClient>
      </div>
    </div>
  );
}
