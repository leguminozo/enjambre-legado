'use client';

export function PrintButton({ label = 'Imprimir / PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center rounded-full border border-accent px-5 text-xs uppercase tracking-wider text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors print:hidden"
    >
      {label}
    </button>
  );
}
