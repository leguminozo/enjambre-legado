'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GrainOverlay } from '@/components/shop/grain-overlay';

type AuthShellProps = {
  title: ReactNode;
  subtitle: string;
  backHref?: string;
  footer?: string;
  children: ReactNode;
  intro?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  backHref = '/',
  footer,
  children,
  intro,
}: AuthShellProps) {
  return (
    <div className="tienda-auth-page text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      <div className="tienda-auth-glow pointer-events-none" aria-hidden />
      <div className="hidden md:block">
        <GrainOverlay />
      </div>

      <div className="tienda-auth-inner w-full max-w-md space-y-8 sm:space-y-10">
        <div className="text-center">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 min-h-[44px] text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors mb-6 sm:mb-10"
          >
            <ArrowLeft size={14} /> Volver a la tienda
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-light tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 sm:mt-4 text-sm text-muted-foreground font-light tracking-wide">{subtitle}</p>
          {intro}
        </div>

        {children}

        {footer ? (
          <p className="text-center text-[0.6rem] tracking-[0.1em] text-muted-foreground uppercase pb-2">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AuthFormPanel({ children, onSubmit }: { children: ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form className="tienda-auth-panel space-y-6 sm:space-y-8" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export const authFieldClass =
  'tienda-auth-input w-full border-b border-border pl-10 pr-12 py-3.5 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50';

export const authLabelClass = 'text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground';