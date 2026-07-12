'use client';

import * as React from 'react';
import {
  format,
  isSameDay,
  differenceInMinutes,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';
import type { CalendarioEvent } from '../types';

const HOUR_HEIGHT = 52; // px per hour — Apple-like density
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

export function DayTimeline({
  date,
  events,
  onEventClick,
  onCreateAt,
  onClose,
}: DayTimelineProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dayStart = startOfDay(date);

  const dayEvents = React.useMemo(
    () =>
      events
        .filter((e) => {
          const s = toDate(e.startDate);
          const end = e.endDate ? toDate(e.endDate) : s;
          return isSameDay(s, date) || isSameDay(end, date) || (s < dayStart && end > dayStart);
        })
        .sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime()),
    [events, date, dayStart],
  );

  const allDay = dayEvents.filter((e) => e.allDay);
  const timed = dayEvents.filter((e) => !e.allDay);

  // Scroll to ~8am on open
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 8 * HOUR_HEIGHT - 16;
  }, [date]);

  const layoutTimed = timed.map((evt) => {
    const start = toDate(evt.startDate);
    const end = evt.endDate
      ? toDate(evt.endDate)
      : new Date(start.getTime() + 60 * 60_000);
    const startMin = isSameDay(start, date)
      ? start.getHours() * 60 + start.getMinutes()
      : 0;
    const endMin = isSameDay(end, date)
      ? end.getHours() * 60 + end.getMinutes()
      : 24 * 60;
    const duration = Math.max(endMin - startMin, 20);
    return {
      evt,
      top: (startMin / 60) * HOUR_HEIGHT,
      height: (duration / 60) * HOUR_HEIGHT,
      label: `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
    };
  });

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card/50">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Agenda del día
          </p>
          <h3 className="font-display text-lg font-bold capitalize text-foreground">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
        </div>
        <div className="flex items-center gap-1">
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

      {/* All-day strip (Apple style) */}
      {allDay.length > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-2">
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

      {/* Hour grid */}
      <div
        ref={scrollRef}
        className="relative max-h-[min(28rem,55dvh)] overflow-y-auto overscroll-contain"
      >
        <div
          className="relative"
          style={{ height: 24 * HOUR_HEIGHT }}
        >
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              className="absolute left-0 right-0 flex border-t border-border/60 hover:bg-accent/5"
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              onClick={() => {
                const startsAt = setMinutes(setHours(startOfDay(date), h), 0);
                onCreateAt?.(startsAt);
              }}
              aria-label={`Crear evento a las ${String(h).padStart(2, '0')}:00`}
            >
              <span className="w-12 shrink-0 pr-2 text-right text-[10px] font-medium text-muted-foreground -translate-y-2">
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
              <span className="flex-1" />
            </button>
          ))}

          {layoutTimed.map(({ evt, top, height, label }) => (
            <button
              key={evt.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(evt);
              }}
              className="absolute left-14 right-2 z-[1] overflow-hidden rounded-lg border border-white/10 px-2 py-1 text-left shadow-sm transition hover:brightness-110"
              style={{
                top: top + 1,
                height: Math.max(height - 2, 22),
                backgroundColor: evt.color ?? '#5AC8FA',
                color: '#fff',
              }}
              title={`${evt.title} · ${label}`}
            >
              <p className="truncate text-[11px] font-bold leading-tight">
                {evt.title}
              </p>
              {height > 36 && (
                <p className="truncate text-[10px] opacity-90">{label}</p>
              )}
              {height > 52 && evt.location && (
                <p className="truncate text-[10px] opacity-80">{evt.location}</p>
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

/** Helper: default end = start + 1h */
export function defaultEndFromStart(startsAt: Date): Date {
  return new Date(startsAt.getTime() + 60 * 60_000);
}

export function minutesBetween(a: Date, b: Date): number {
  return differenceInMinutes(b, a);
}
