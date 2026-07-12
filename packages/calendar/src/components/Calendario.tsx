'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  parseISO,
  getDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  X,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import type { CalendarioEvent, CalendarioEventType } from '../types';
import { resolveEventToolLink } from '../types';

export interface CalendarioProps {
  events: CalendarioEvent[];
  currentDate?: Date;
  /** Fecha seleccionada controlada (opcional) */
  selectedDate?: Date | null;
  onMonthChange?: (date: Date) => void;
  onSelectedDateChange?: (date: Date | null) => void;
  onEventClick?: (event: CalendarioEvent) => void;
  onDateClick?: (date: Date) => void;
  /** Navegar a herramienta origen (bidireccional) */
  onOpenTool?: (href: string, event?: CalendarioEvent) => void;
  isLoading?: boolean;
  /** Filtro de tipo activo (desde URL u otras tools) */
  activeTypeFilter?: CalendarioEventType | null;
}

const eventTypeConfig: Record<
  CalendarioEventType,
  { colorClass: string; dotClass: string; label: string }
> = {
  feria: {
    colorClass: 'bg-accent/15 text-accent border border-accent/30',
    dotClass: 'bg-accent',
    label: 'Ferias',
  },
  apicultura: {
    colorClass: 'bg-primary/25 text-primary-foreground border border-primary/40',
    dotClass: 'bg-primary',
    label: 'Apicultura',
  },
  marketing: {
    colorClass: 'bg-secondary text-secondary-foreground border border-border',
    dotClass: 'bg-muted-foreground',
    label: 'Marketing',
  },
  historico: {
    colorClass: 'bg-accent text-accent-foreground font-semibold',
    dotClass: 'bg-accent',
    label: 'Cosechas',
  },
  inspeccion: {
    colorClass: 'bg-primary text-primary-foreground border border-primary/50',
    dotClass: 'bg-primary',
    label: 'Inspecciones',
  },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const MAX_PILLS = 3;

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? parseISO(d) : d;
}

export function Calendario({
  events,
  currentDate = new Date(),
  selectedDate: selectedDateProp,
  onMonthChange,
  onSelectedDateChange,
  onEventClick,
  onDateClick,
  onOpenTool,
  isLoading,
  activeTypeFilter,
}: CalendarioProps) {
  const [internalSelected, setInternalSelected] = React.useState<Date | null>(
    new Date(),
  );
  const selectedDate =
    selectedDateProp !== undefined ? selectedDateProp : internalSelected;

  const setSelectedDate = React.useCallback(
    (d: Date | null) => {
      if (selectedDateProp === undefined) setInternalSelected(d);
      onSelectedDateChange?.(d);
    },
    [selectedDateProp, onSelectedDateChange],
  );

  const filteredEvents = React.useMemo(() => {
    if (!activeTypeFilter) return events;
    return events.filter((e) => e.type === activeTypeFilter);
  }, [events, activeTypeFilter]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const baseDays = eachDayOfInterval({ start: startDate, end: endDate });
  // Always 6 weeks for stable layout (no jump when months have 4–6 rows)
  const weekCount = Math.max(6, Math.ceil(baseDays.length / 7));
  const days = [...baseDays];
  while (days.length < weekCount * 7) {
    const last = days[days.length - 1]!;
    days.push(new Date(last.getTime() + 24 * 60 * 60 * 1000));
  }

  const handlePrevMonth = () => onMonthChange?.(subMonths(currentDate, 1));
  const handleNextMonth = () => onMonthChange?.(addMonths(currentDate, 1));
  const handlePrevYear = () => onMonthChange?.(subYears(currentDate, 1));
  const handleNextYear = () => onMonthChange?.(addYears(currentDate, 1));
  const handleToday = () => {
    const today = new Date();
    onMonthChange?.(today);
    setSelectedDate(today);
    onDateClick?.(today);
  };

  const getEventsForDay = React.useCallback(
    (day: Date) =>
      filteredEvents.filter((e) => {
        const eStart = toDate(e.startDate);
        if (!e.endDate) return isSameDay(eStart, day);
        const eEnd = toDate(e.endDate);
        // inclusive range, date-only
        const d0 = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const s0 = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate());
        const e0 = new Date(eEnd.getFullYear(), eEnd.getMonth(), eEnd.getDate());
        return d0 >= s0 && d0 <= e0;
      }),
    [filteredEvents],
  );

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const dayPanelOpen = selectedDate != null;

  const years = React.useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 16 }, (_, i) => y - 10 + i);
  }, []);

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(e.target.value, 10));
    onMonthChange?.(newDate);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(e.target.value, 10));
    onMonthChange?.(newDate);
  };

  const onDayActivate = (day: Date) => {
    const same = selectedDate && isSameDay(day, selectedDate);
    if (same) {
      // toggle close
      setSelectedDate(null);
      return;
    }
    setSelectedDate(day);
    onDateClick?.(day);
  };

  return (
    <div className="calendario-root flex w-full flex-col rounded-2xl border border-border bg-card/40 shadow-sm">
      {/* ── Header: mes / año ── */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <CalendarIcon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="flex items-center gap-1 font-display text-lg font-bold tracking-wide text-foreground sm:text-xl">
            <label className="sr-only" htmlFor="cal-month">
              Mes
            </label>
            <select
              id="cal-month"
              value={currentDate.getMonth()}
              onChange={handleMonthSelect}
              className="cursor-pointer appearance-none border-none bg-transparent pr-1 text-center font-display capitalize text-foreground hover:text-accent focus:outline-none focus:ring-0"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i} className="bg-card text-foreground">
                  {format(new Date(2026, i, 1), 'MMMM', { locale: es })}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="cal-year">
              Año
            </label>
            <select
              id="cal-year"
              value={currentDate.getFullYear()}
              onChange={handleYearSelect}
              className="cursor-pointer appearance-none border-none bg-transparent font-display text-foreground hover:text-accent focus:outline-none focus:ring-0"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-card text-foreground">
                  {y}
                </option>
              ))}
            </select>
          </div>
          {isLoading && (
            <span className="relative flex h-2 w-2" aria-label="Cargando">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          )}
          {activeTypeFilter && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              {eventTypeConfig[activeTypeFilter]?.label ?? activeTypeFilter}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrevYear}
              title="Año anterior"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleToday}
            className="mx-1 rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextYear}
              title="Año siguiente"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Weekdays ── */}
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Month grid: fixed 6 rows, no nested page scroll war ── */}
      <div
        className="grid grid-cols-7"
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(4.5rem, 1fr))` }}
        role="grid"
        aria-label={`Calendario ${format(currentDate, 'MMMM yyyy', { locale: es })}`}
      >
        {days.slice(0, weekCount * 7).map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const today = isToday(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayEvents = getEventsForDay(day);
          const extra = Math.max(0, dayEvents.length - MAX_PILLS);

          return (
            <button
              type="button"
              key={day.toISOString()}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={format(day, "EEEE d 'de' MMMM", { locale: es })}
              onClick={() => onDayActivate(day)}
              className={[
                'group relative flex min-h-[4.5rem] flex-col items-stretch border-b border-r border-border p-1 text-left transition-colors sm:min-h-[5.5rem] sm:p-1.5',
                !inMonth ? 'bg-muted/20 text-muted-foreground/50' : 'bg-background/40 hover:bg-accent/5',
                isSelected ? 'z-[1] bg-accent/10 ring-1 ring-inset ring-accent/35' : '',
                getDay(day) === 0 || getDay(day) === 6 ? 'bg-muted/10' : '',
              ].join(' ')}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    today
                      ? 'bg-accent font-bold text-accent-foreground shadow-sm'
                      : isSelected
                        ? 'font-bold text-accent'
                        : 'text-foreground/90',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="hidden text-[9px] font-medium text-muted-foreground sm:inline">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Desktop pills */}
              <div className="mt-0.5 hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden sm:flex">
                {dayEvents.slice(0, MAX_PILLS).map((evt) => {
                  const conf =
                    eventTypeConfig[evt.type] ?? {
                      colorClass: 'bg-muted text-foreground border border-border',
                    };
                  return (
                    <span
                      key={evt.id}
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(evt);
                      }}
                      className={`${conf.colorClass} block w-full cursor-pointer truncate rounded-sm px-1 py-0.5 text-[9px] leading-tight transition hover:brightness-110`}
                      title={evt.title}
                    >
                      {evt.title}
                    </span>
                  );
                })}
                {extra > 0 && (
                  <span className="px-0.5 text-[9px] font-semibold text-muted-foreground">
                    +{extra} más
                  </span>
                )}
              </div>

              {/* Mobile dots */}
              <div className="mt-auto flex h-1.5 justify-center gap-0.5 sm:hidden">
                {dayEvents.slice(0, 3).map((evt) => {
                  const conf = eventTypeConfig[evt.type] ?? { dotClass: 'bg-muted-foreground' };
                  return (
                    <span
                      key={evt.id}
                      className={`h-1 w-1 rounded-full ${conf.dotClass}`}
                    />
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/70" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Day module: se expande desde el mes al hacer click ── */}
      <div
        className={[
          'overflow-hidden border-t border-border bg-card/60 transition-[max-height,opacity] duration-300 ease-out',
          dayPanelOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
        aria-hidden={!dayPanelOpen}
      >
        {selectedDate && (
          <div className="px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Día seleccionado
                </p>
                <h3 className="font-display text-lg font-bold capitalize text-foreground sm:text-xl">
                  {format(selectedDate, "eeee d 'de' MMMM yyyy", { locale: es })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar detalle del día"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
              {selectedDayEvents.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  Sin registros este día. Las ferias, cosechas, posts e inspecciones
                  aparecen aquí cuando existen en sus herramientas.
                </p>
              )}

              {selectedDayEvents.map((evt) => {
                const conf =
                  eventTypeConfig[evt.type] ?? {
                    colorClass: 'bg-muted',
                    label: evt.type,
                  };
                const tool = {
                  href: evt.toolHref ?? resolveEventToolLink(evt.type).href,
                  label: evt.toolLabel ?? resolveEventToolLink(evt.type).label,
                };
                return (
                  <div
                    key={evt.id}
                    className={`flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between ${conf.colorClass}`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onEventClick?.(evt)}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                        {conf.label}
                      </span>
                      <p className="truncate text-sm font-medium">{evt.title}</p>
                      {evt.endDate && (
                        <p className="text-[10px] opacity-60">
                          hasta {format(toDate(evt.endDate), 'd MMM', { locale: es })}
                        </p>
                      )}
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      {evt.editable && (
                        <button
                          type="button"
                          onClick={() => onEventClick?.(evt)}
                          className="rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-80 hover:opacity-100"
                        >
                          Reprogramar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenTool?.(tool.href, evt)}
                        className="inline-flex items-center gap-1 rounded-full bg-background/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide hover:bg-background/70"
                      >
                        {tool.label}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Atajos a herramientas (bidireccional) */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              <span className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:w-auto sm:mr-1 sm:self-center">
                Ir a
              </span>
              {(
                Object.entries(eventTypeConfig) as [
                  CalendarioEventType,
                  (typeof eventTypeConfig)[CalendarioEventType],
                ][]
              ).map(([key, conf]) => {
                const link = resolveEventToolLink(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onOpenTool?.(link.href)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-accent/40 hover:text-accent"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${conf.dotClass}`} />
                    {link.label}
                    <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-4 border-t border-border bg-muted/20 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Object.entries(eventTypeConfig).map(([key, conf]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${conf.dotClass}`} />
            <span>{conf.label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
