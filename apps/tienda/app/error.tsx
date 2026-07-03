'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[tienda-error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-6">
      <h1 className="font-display text-2xl text-foreground">Algo no salió como esperábamos</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Puedes reintentar o volver al inicio. Si el problema persiste, escríbenos desde contacto.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Reintentar
        </button>
        <Link href="/" className="btn btn-outline btn-sm">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}