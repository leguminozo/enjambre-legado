'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Riel del flujo del néctar (admin):
 * Origen → Lotes → Producto → Despacho → Impacto → Contable
 * Entrelazado bidireccional entre herramientas del ciclo.
 */
export const NECTAR_STEPS = [
  { href: '/colmenas', label: 'Colmenas' },
  { href: '/produccion', label: 'Lotes' },
  { href: '/catalogo', label: 'Productos' },
  { href: '/operaciones', label: 'Despacho' },
  { href: '/regeneracion', label: 'Impacto' },
  { href: '/contable', label: 'Contable' },
  { href: '/sii', label: 'SII' },
] as const;

export type NectarStepHref = (typeof NECTAR_STEPS)[number]['href'];

export function NectarRail({
  current,
  className,
}: {
  /** Path activo (p.ej. /produccion) */
  current?: string;
  className?: string;
}) {
  return (
    <nav
      className={cn('flex flex-wrap items-center gap-x-1 gap-y-1.5', className)}
      aria-label="Flujo del néctar"
    >
      {NECTAR_STEPS.map((step, i) => {
        const active =
          !!current &&
          (current === step.href ||
            (step.href !== '/' && current.startsWith(`${step.href}/`)) ||
            current === step.href);
        return (
          <span key={step.href} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground/35 text-[0.65rem] select-none" aria-hidden>
                →
              </span>
            )}
            <Link
              href={step.href}
              className={cn(
                'text-[0.6rem] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border transition-colors min-h-11 inline-flex items-center',
                active
                  ? 'border-accent/50 bg-accent/10 text-accent font-semibold'
                  : 'border-border/70 text-muted-foreground hover:text-foreground hover:border-accent/35',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
