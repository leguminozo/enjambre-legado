'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

export function CampoBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-sunken/80 backdrop-blur-md border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        {CAMPO_NAV_ROUTES.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
          const Icon = route.icon;

          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`flex items-center justify-center p-1 rounded-full transition-colors ${
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
