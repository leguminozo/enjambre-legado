'use client';

import { useMemo } from 'react';
import type { HiveState } from '@/lib/hive-state';
import { buildYardActionFeed, yardFeedSummary } from '@/lib/hive-decision';
import { ListChecks } from 'lucide-react';

interface YardActionFeedProps {
  hives: HiveState[];
  onSelectColmenaId?: (id: string) => void;
}

/**
 * Feed priorizado de acciones del patio — bucle de decisión operativo.
 */
export function YardActionFeed({ hives, onSelectColmenaId }: YardActionFeedProps) {
  const feed = useMemo(() => buildYardActionFeed(hives, 6), [hives]);
  const summary = useMemo(() => yardFeedSummary(hives), [hives]);

  if (hives.length === 0) return null;

  if (feed.length === 0) {
    return (
      <div
        className="rounded-lg border border-border/50 bg-card/80 px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2"
      >
        <ListChecks size={14} className="text-success shrink-0" />
        Patio estable: ninguna acción prioritaria ahora.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <ListChecks size={14} className="text-primary" />
          Acciones del patio
        </div>
        <span className="text-[0.65rem] text-muted-foreground">
          {summary.needingAction} de {summary.total} colmena
          {summary.total === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {feed.map((item) => (
          <li key={item.colmenaId}>
            <button
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-surface-sunken/60 transition-colors flex items-start gap-2.5"
              onClick={() => onSelectColmenaId?.(item.colmenaId)}
            >
              <span
                className="mt-1 size-2 rounded-full shrink-0"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
              />
              <span className="min-w-0 flex-1">
                <span className="text-xs font-medium text-foreground block truncate">
                  {item.name}
                  <span className="font-normal text-muted-foreground"> · {item.riskLabel}</span>
                </span>
                <span className="text-[0.7rem] block mt-0.5" style={{ color: item.color }}>
                  {item.action}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
