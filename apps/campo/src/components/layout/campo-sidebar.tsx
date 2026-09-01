'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Hexagon } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { getCampoNavGroupsForRole } from '@/lib/navigation/routes';

const CAMPO_ROLE_LABELS: Record<string, string> = {
  rep_ventas: 'Rep de Ventas',
  admin: 'Administración',
};

export function CampoSidebar() {
  const pathname = usePathname();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const roleLabel = user?.role
    ? (CAMPO_ROLE_LABELS[user.role] ?? 'Operador')
    : 'Operador';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-sunken border-r border-border h-full sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <Hexagon className="text-accent" size={24} />
        <div className="flex flex-col">
          <span className="font-display tracking-[0.2em] text-sm uppercase">Enjambre</span>
          <span className="font-display tracking-[0.1em] text-accent text-xs italic">Campo</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto" aria-label="Navegación principal Campo">
        {getCampoNavGroupsForRole(user?.role).map((group) => (
          <div key={group.key}>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-4">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.routes.map((route) => {
                const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
                const Icon = route.icon;

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-start gap-3 min-h-11 px-3 py-2.5 rounded-lg transition-colors group ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`mt-0.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm">{route.label}</span>
                      <span className="text-xs text-muted-foreground truncate">{route.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-sm font-medium truncate">{user?.email || 'Trabajador'}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
