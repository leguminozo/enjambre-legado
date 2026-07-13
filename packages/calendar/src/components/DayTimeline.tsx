'use client';

import * as React from 'react';
import {
  format,
  isSameDay,
  differenceInMinutes,
  setHours,
  setMinutes,
  startOfDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';
import type { CalendarioEvent } from '../types';

const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export interface DayTimelineProps {
  date: Date;
  events: CalendarioEvent[];
  onEventClick?: (event: CalendarioEvent) => void;
  onCreateAt?: (startsAt: Date) => void;
  onClose?: () => void;
}

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

type LaidOut = {
  evt: CalendarioEvent;
  top: number;
  height: number;
  label: string;
  col: number;
  colCount: number;
};

/** Columnas simples para eventos solapados (estilo Apple). */
function assignOverlapColumns(
  items: Omit<LaidOut, 'col' | 'colCount'>[],
): LaidOut[] {
  const sorted = [...items].sort((a, b) => a.top - b.top || b.height - a.height);
  const colEnds: number[] = [];
  const withCol: (Omit<LaidOut, 'colCount'> & { end: number })[] = [];

  for (const item of sorted) {
    const end = item.top + item.height;
    let col = colEnds.findIndex((e) => e <= item.top + 0.5);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }
    withCol.push({ ...item, col, end });
  }

  // group overlapping clusters for colCount
  const result: LaidOut[] = withCol.map((item) => {
    let maxCol = item.col;
    for (const other of withCol) {
      const overlap =
        item.top < other.end && other.top < item.end;
      if (overlap) maxCol = Math.max(maxCol, other.col);
    }
    return {
      evt: item.evt,
      top: item.top,
      height: item.height,
      label: item.label,
      col: item.col,
      colCount: maxCol + 1,
    };
  });
  return result;
}

export function DayTimeline({
  date,
  events,
  onEventClick,
  onCreateAt,
  onClose,
}: DayTimelineProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dayStart = startOfDay(date);
  const [nowTop, setNowTop] = React.useState<number | null>(null);

  const dayEvents = React.useMemo(
    () =>
      events
        .filter((e) => {
          const s = toDate(e.startDate);
          const end = e.endDate ? toDate(e.endDate) : s;
          return (
            isSameDay(s, date) ||
            isSameDay(end, date) ||
            (s < dayStart && end > dayStart)
          );
        })
        .sort(
          (a, b) =>
            toDate(a.startDate).getTime() - toDate(b.startDate).getTime(),
        ),
    [events, date, dayStart],
  );

  const allDay = dayEvents.filter((e) => e.allDay);
  const timed = dayEvents.filter((e) => !e.allDay);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = isToday(date) ? new Date().getHours() : 8;
    el.scrollTop = Math.max(0, target * HOUR_HEIGHT - HOUR_HEIGHT);
  }, [date]);

  React.useEffect(() => {
    if (!isToday(date)) {
      setNowTop(null);
      return;
    }
    const tick = () => {
      const n = new Date();
      setNowTop(
        ((n.getHours() * 60 + n.getMinutes()) / 60) * HOUR_HEIGHT,
      );
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [date]);

  const layoutTimed = React.useMemo(() => {
    const raw = timed.map((evt) => {
      const start = toDate(evt.startDate);
      const end = evt.endDate
        ? toDate(evt.endDate)
        : new Date(start.getTime() + 60 * 60_000);
      const startMin = isSameDay(start, date)
        ? start.getHours() * 60 + start.getMinutes()
        : 0;
      const endMin = isSameDay(end, date)
        ? Math.max(end.getHours() * 60 + end.getMinutes(), startMin + 15)
        : 24 * 60;
      const duration = Math.max(endMin - startMin, 20);
      return {
        evt,
        top: (startMin / 60) * HOUR_HEIGHT,
        height: (duration / 60) * HOUR_HEIGHT,
        label: `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
      };
    });
    return assignOverlapColumns(raw);
  }, [timed, date]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/80">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Agenda del día
          </p>
          <h3 className="truncate font-display text-base font-bold capitalize text-foreground sm:text-lg">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const base = setMinutes(setHours(startOfDay(date), 9), 0);
              onCreateAt?.(base);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-foreground shadow-sm hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cerrar agenda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {allDay.length > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/25 px-3 py-2">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Todo el día
          </p>
          <div className="flex flex-col gap-1">
            {allDay.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => onEventClick?.(evt)}
                className="truncate rounded-md px-2 py-1 text-left text-xs font-medium text-white"
                style={{ backgroundColor: evt.color ?? '#8E8E93' }}
              >
                {evt.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="relative max-h-[min(26rem,50dvh)] overflow-y-auto overscroll-contain"
      >
        <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-border/50"
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <button
                type="button"
                className="flex h-full w-full hover:bg-accent/5"
                onClick={() => {
                  const startsAt = setMinutes(
                    setHours(startOfDay(date), h),
                    0,
                  );
                  onCreateAt?.(startsAt);
                }}
                aria-label={`Crear evento a las ${String(h).padStart(2, '0')}:00`}
              >
                <span className="w-12 shrink-0 -translate-y-2 pr-2 text-right text-[10px] font-medium text-muted-foreground">
                  {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                </span>
                <span className="flex-1" />
              </button>
            </div>
          ))}

          {nowTop != null && (
            <div
              className="pointer-events-none absolute left-10 right-1 z-[2] flex items-center"
              style={{ top: nowTop }}
            >
              <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-red-500" />
              <span className="h-[2px] flex-1 bg-red-500/90" />
            </div>
          )}

          {layoutTimed.map(({ evt, top, height, label, col, colCount }) => (
            <button
              key={evt.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(evt);
              }}
              className="absolute z-[1] overflow-hidden rounded-lg border border-white/15 px-1.5 py-0.5 text-left shadow-sm transition hover:brightness-110"
              style={{
                top: top + 1,
                height: Math.max(height - 2, 22),
                left: `calc(3rem + (100% - 3.5rem) * ${col} / ${colCount} + 2px)`,
                width: `calc((100% - 3.5rem) / ${colCount} - 4px)`,
                backgroundColor: evt.color ?? '#5AC8FA',
                color: '#fff',
              }}
              title={`${evt.title} · ${label}`}
            >
              <p className="truncate text-[11px] font-bold leading-tight">
                {evt.title}
              </p>
              {height > 34 && (
                <p className="truncate text-[10px] opacity-90">{label}</p>
              )}
              {height > 50 && evt.location && (
                <p className="truncate text-[10px] opacity-80">
                  {evt.location}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {dayEvents.length === 0 && (
        <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
          Sin eventos. Toca una hora o «Nuevo» para crear.
        </p>
      )}
    </div>
  );
}

export function defaultEndFromStart(startsAt: Date): Date {
  return new Date(startsAt.getTime() + 60 * 60_000);
}

export function minutesBetween(a: Date, b: Date): number {
  return differenceInMinutes(b, a);
}
