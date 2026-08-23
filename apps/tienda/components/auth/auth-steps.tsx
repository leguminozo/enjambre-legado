'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Bloques de estructura visual copiados del registro territorial (Núcleo) y
 * adaptados a Tienda — separación estricta: sin imports cruzados, solo el
 * idioma de diseño (pasos con checklist, bloques legales con cita, chips).
 */

export interface AuthStepMeta {
  id: string;
  titulo: string;
  desc: string;
  done: boolean;
  icon: LucideIcon;
}

/** Pills de progreso (patrón del wizard censo: ✓ / pendiente). */
export function AuthStepList({ pasos }: { pasos: AuthStepMeta[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {pasos.map((p) => (
        <span
          key={p.id}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] border transition-colors ${
            p.done
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/60 bg-surface-raised/60 text-muted-foreground'
          }`}
        >
          {p.done ? '✓' : '·'} {p.titulo}
        </span>
      ))}
    </div>
  );
}

interface AuthStepCardProps {
  paso: AuthStepMeta;
  activo: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Bloque-paso acordeón (CheckCircle pending, patrón CensoLegalWizard). */
export function AuthStepCard({ paso, activo, onToggle, children }: AuthStepCardProps) {
  const { titulo, desc, done, icon: Icon } = paso;
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        activo ? 'border-primary/40 bg-card' : 'border-border/60 bg-card/80'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-raised/60 transition-colors"
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        )}
        <Icon size={18} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{titulo}</p>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
        {activo ? (
          <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {activo && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-4">{children}</div>
      )}
    </div>
  );
}

interface AuthLegalBlockProps {
  kicker: string;
  titulo: string;
  cuerpo: string;
  children?: ReactNode;
}

/** Bloque legal con cita (patrón bloques B2G del kit municipal). */
export function AuthLegalBlock({ kicker, titulo, cuerpo, children }: AuthLegalBlockProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-surface-raised/50 p-4 space-y-1.5">
      <p className="inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-accent-text">
        <ShieldCheck size={11} /> {kicker}
      </p>
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      <p className="text-xs text-muted-foreground leading-relaxed text-justify">{cuerpo}</p>
      {children}
    </div>
  );
}