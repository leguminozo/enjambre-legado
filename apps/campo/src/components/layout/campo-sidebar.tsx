'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Hexagon } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

export function CampoSidebar() {
  const pathname = usePathname();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-sunken border-r border-border h-full sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <Hexagon className="text-accent" size={24} />
        <div className="flex flex-col">
          <span className="font-display tracking-[0.2em] text-sm uppercase">Enjambre</span>
          <span className="font-display tracking-[0.1em] text-accent text-xs italic">Campo</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-4">
          Herramientas de Terreno
        </p>
        {CAMPO_NAV_ROUTES.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'} />
              <div className="flex flex-col">
                <span className="text-sm">{route.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.email || 'Trabajador'}</span>
            <span className="text-xs text-muted-foreground">Operador</span>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
