'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

export function CampoBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-sunken/80 backdrop-blur-md border-t border-border z-50 pb-safe select-none"
      aria-label="Navegación principal Campo"
    >
      <div className="flex items-stretch justify-around px-1 min-h-16">
        {CAMPO_NAV_ROUTES.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 gap-0.5 py-2 transition-colors ${
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`flex items-center justify-center min-h-11 min-w-11 rounded-full transition-colors ${
                  isActive ? 'bg-accent/15' : 'bg-transparent'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className="text-[0.65rem] font-medium tracking-tight">
                {route.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
