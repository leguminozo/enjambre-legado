'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@enjambre/ui';

interface CatalogoVacioCalloutProps {
  title: string;
  description: string;
  href: string;
  goLabel: string;
  onNavigate?: () => void;
}

/** Aviso cuando un formulario exige un catálogo vacío (colmenas, fórmulas, sets…). */
export function CatalogoVacioCallout({ title, description, href, goLabel, onNavigate }: CatalogoVacioCalloutProps) {
  const router = useRouter();
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 space-y-2 text-xs">
      <div className="font-semibold text-foreground flex items-center gap-1.5">
        <AlertTriangle className="size-4 text-warning shrink-0" />
        {title}
      </div>
      <p className="text-muted-foreground">{description}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onNavigate?.();
          router.push(href);
        }}
        className="rounded-lg text-[10px] uppercase font-bold tracking-wider"
      >
        {goLabel}
      </Button>
    </div>
  );
}
