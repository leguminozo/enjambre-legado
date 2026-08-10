'use client';

import type { ReactNode } from 'react';
import { Input } from '@enjambre/ui';

/** Etiqueta de sección en los forms (estilo editorial del repo). */
export function FormFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * Input de responsable/recolector con sugerencias de nombres ya usados
 * (datalist) — la delegación se apoya en no tener que tipear dos veces.
 */
export function ResponsableInput({
  label,
  listId,
  sugerencias,
  value,
  onChange,
  placeholder,
}: {
  label: string
  listId: string
  sugerencias: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <FormFieldLabel>{label}</FormFieldLabel>
      <Input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Quién lo hizo…'}
      />
      <datalist id={listId}>
        {sugerencias.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
