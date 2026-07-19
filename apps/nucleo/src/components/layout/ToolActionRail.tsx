'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { ArrowUpRight } from 'lucide-react';

export type ToolAction = {
  href: string;
  label: string;
  /** Acción primaria (destacada) para actuar en el entorno */
  primary?: boolean;
};

/** Contextos de herramientas admin: qué hacer después / en relación al resto del enjambre */
export const TOOL_ACTION_CONTEXTS = {
  costeo: [
    { href: '/produccion', label: 'Lotes / stock' },
    { href: '/catalogo', label: 'Productos' },
    { href: '/contable', label: 'Contable' },
    { href: '/reportes', label: 'Reportes' },
  ],
  crm: [
    { href: '/pipeline', label: 'Pipeline ventas', primary: true },
    { href: '/operadores-feria', label: 'Operadores feria' },
    { href: '/monitor-feria', label: 'Monitor feria' },
    { href: '/creadores', label: 'Creadores' },
    { href: '/calendario', label: 'Calendario' },
  ],
  pipeline: [
    { href: '/crm', label: 'CRM clientes', primary: true },
    { href: '/calendario', label: 'Calendario' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/ejecutivo', label: 'Panel ejecutivo' },
  ],
  reportes: [
    { href: '/contable', label: 'Contable', primary: true },
    { href: '/sii', label: 'SII / F29' },
    { href: '/calculos-ia', label: 'Cálculos IA' },
    { href: '/ejecutivo', label: 'Ejecutivo' },
  ],
  calculosIa: [
    { href: '/contable', label: 'Contable' },
    { href: '/sii', label: 'SII' },
    { href: '/reportes', label: 'Reportes', primary: true },
    { href: '/costeo', label: 'Costeo' },
  ],
  sii: [
    { href: '/contable', label: 'Contable', primary: true },
    { href: '/reportes', label: 'Reportes' },
    { href: '/calculos-ia', label: 'Cálculos IA' },
    { href: '/banco', label: 'Banco' },
  ],
  banco: [
    { href: '/contable', label: 'Contable' },
    { href: '/sii', label: 'SII' },
    { href: '/conciliacion', label: 'Conciliación', primary: true },
  ],
  sumup: [
    { href: '/banco', label: 'Banco Chile' },
    { href: '/conciliacion', label: 'Conciliación', primary: true },
    { href: '/contable', label: 'Contable' },
    { href: '/caja', label: 'Caja / POS campo' },
  ],
  creadores: [
    { href: '/crm?tab=aliados', label: 'Aliados B2B' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/reglas-comision', label: 'Reglas comisión' },
  ],
  feriaOps: [
    { href: '/monitor-feria', label: 'Monitor feria', primary: true },
    { href: '/crm?tab=ferias', label: 'CRM ferias' },
    { href: '/reglas-comision', label: 'Comisiones' },
    { href: '/caja', label: 'Caja (campo)' },
  ],
} as const;

export type ToolActionContext = keyof typeof TOOL_ACTION_CONTEXTS;

/**
 * Riel de acciones: permite al rol actuar desde esta herramienta
 * hacia módulos relacionados del entorno.
 */
export function ToolActionRail({
  context,
  current,
  className,
  label = 'Actuar en el entorno',
}: {
  context: ToolActionContext;
  current?: string;
  className?: string;
  label?: string;
}) {
  const actions = TOOL_ACTION_CONTEXTS[context] as readonly ToolAction[];

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
        {label}
      </p>
      <nav className="flex flex-wrap gap-2" aria-label={label}>
        {actions.map((action) => {
          const active =
            !!current &&
            (current === action.href ||
              current.startsWith(action.href.split('?')[0] + '/') ||
              current.startsWith(action.href));
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.65rem] uppercase tracking-wide transition-colors min-h-11',
                active
                  ? 'border-accent/50 bg-accent/10 text-accent font-semibold'
                  : action.primary
                    ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-accent/35',
              )}
            >
              {action.label}
              <ArrowUpRight size={12} aria-hidden />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
