'use client';

import { formatStampMessage, type StampProgressView } from '@enjambre/wallet';
import { Gift } from 'lucide-react';

export function GuardianStampProgress({ programs }: { programs: StampProgressView[] }) {
  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Aún no tienes sellos activos. Cada compra de productos en programa suma progreso hacia tu regalo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((p) => (
        <div
          key={p.programId}
          className={`rounded-2xl border p-5 ${
            p.eligibleForFree ? 'border-success/40 bg-success/5' : 'border-border bg-card/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-medium text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatStampMessage(p)}</p>
            </div>
            {p.eligibleForFree && (
              <span className="inline-flex items-center gap-1 text-xs text-success uppercase tracking-wider">
                <Gift size={14} /> Gratis
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${p.eligibleForFree ? 100 : p.progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
            {p.accumulated} / {p.required} unidades
          </p>
        </div>
      ))}
    </div>
  );
}