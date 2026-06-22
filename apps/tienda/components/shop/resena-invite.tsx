'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { RESENA_COPY } from '@enjambre/resenas';

export function ResenaInvite() {
  return (
    <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-5 text-left">
      <div className="flex items-start gap-3">
        <PenLine className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-sm text-foreground">¿Cómo fue la experiencia?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Deja tu reseña en el producto que compraste. Las huellas guardian suman ciclos al aprobarse.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">{RESENA_COPY.claimInvite}</p>
          <Link
            href="/catalogo"
            className="inline-block mt-3 text-sm font-medium text-accent hover:underline"
          >
            Ir a mis creaciones →
          </Link>
        </div>
      </div>
    </div>
  );
}