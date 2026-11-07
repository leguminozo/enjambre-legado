'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface ReplenishmentCalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  minDate?: Date;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAY_NAMES_FULL = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDeliveryBanner(date: Date): string {
  const weekday = WEEKDAY_NAMES_FULL[date.getDay()] ?? '';
  const day = date.getDate();
  const month = (MONTH_NAMES[date.getMonth()] ?? '').toLowerCase();
  const year = date.getFullYear();
  return `${weekday}, ${day} de ${month} de ${year}`;
}

export function ReplenishmentCalendar({
  value,
  onChange,
  className = '',
  minDate,
}: ReplenishmentCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const effectiveMinDate = useMemo(() => {
    if (minDate) {
      const d = new Date(minDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // Por defecto no se puede elegir el pasado ni hoy mismo (mínimo mañana)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }, [minDate, today]);

  // Mes en visualización
  const [viewDate, setViewDate] = useState<Date>(() => {
    const initial = new Date(value);
    initial.setDate(1);
    initial.setHours(0, 0, 0, 0);
    return initial;
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate((curr) => {
      const next = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setViewDate((curr) => {
      const next = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
      return next;
    });
  };

  // No permitir retroceder a meses anteriores al mínimo permitido
  const canGoPrev = useMemo(() => {
    const minMonthDate = new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1);
    const currentMonthDate = new Date(viewYear, viewMonth, 1);
    return currentMonthDate > minMonthDate;
  }, [effectiveMinDate, viewYear, viewMonth]);

  // Celdas del mes: trailing del mes anterior, días del mes actual, leading del siguiente
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Domingo, 1 = Lunes...
    // Convertir a Lunes = 0 ... Domingo = 6
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    type Cell = {
      day: number;
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isToday: boolean;
      isSelected: boolean;
      key: string;
    };

    const cells: Cell[] = [];

    // Días del mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(viewYear, viewMonth - 1, day);
      cells.push({
        day,
        date,
        isCurrentMonth: false,
        isDisabled: true,
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, value),
        key: `prev-${day}`,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      date.setHours(0, 0, 0, 0);
      const isPastOrBlocked = date < effectiveMinDate;
      cells.push({
        day,
        date,
        isCurrentMonth: true,
        isDisabled: isPastOrBlocked,
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, value),
        key: `curr-${day}`,
      });
    }

    // Días del mes siguiente para completar múltiplos de 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const date = new Date(viewYear, viewMonth + 1, day);
        cells.push({
          day,
          date,
          isCurrentMonth: false,
          isDisabled: true,
          isToday: isSameDay(date, today),
          isSelected: isSameDay(date, value),
          key: `next-${day}`,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, today, value, effectiveMinDate]);

  return (
    <div className={`space-y-3.5 ${className}`.trim()}>
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm">
        {/* Cabecera del mes y controles de navegación */}
        <div className="flex items-center justify-between pb-4">
          <h4 className="font-display text-sm sm:text-base font-semibold text-foreground tracking-wide">
            {MONTH_NAMES[viewMonth]} de {viewYear}
          </h4>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrev}
              aria-label="Mes anterior"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/40 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Mes siguiente"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/40 text-foreground transition hover:bg-secondary cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 text-center pb-2">
          {WEEKDAYS.map((w, idx) => (
            <span
              key={`${w}-${idx}`}
              className="text-xs font-mono font-medium text-muted-foreground/80 py-1"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {calendarCells.map((cell) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={cell.key}
                  className="flex h-9 sm:h-10 items-center justify-center text-xs text-muted-foreground/25 select-none"
                >
                  {cell.day}
                </div>
              );
            }

            if (cell.isDisabled) {
              return (
                <div
                  key={cell.key}
                  className="flex h-9 sm:h-10 items-center justify-center text-xs text-muted-foreground/30 select-none cursor-not-allowed"
                >
                  {cell.day}
                </div>
              );
            }

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onChange(cell.date)}
                className={`relative flex h-9 w-9 sm:h-10 sm:w-10 mx-auto items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  cell.isSelected
                    ? 'bg-accent text-accent-foreground font-bold shadow-md ring-2 ring-accent/30 scale-105'
                    : cell.isToday
                    ? 'border border-accent text-foreground hover:bg-surface-raised'
                    : 'text-foreground hover:bg-surface-raised hover:text-foreground'
                }`}
                aria-label={`Seleccionar ${cell.day} de ${MONTH_NAMES[viewMonth]}`}
                aria-pressed={cell.isSelected}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de confirmación de fecha de primera entrega */}
      <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 flex items-center gap-2.5 text-xs text-accent font-medium shadow-xs">
        <CalendarIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="leading-snug">
          Primera entrega: <strong className="font-semibold text-accent">{formatDeliveryBanner(value)}</strong>
        </span>
      </div>
    </div>
  );
}
