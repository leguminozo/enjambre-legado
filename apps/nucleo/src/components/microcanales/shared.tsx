'use client';

/** Etiqueta de campo de formulario (estilo editorial del repo). */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}
