import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  onConfirm?: () => void;
  onReset?: () => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS_OF_WEEK = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function Calendar({
  value,
  onChange,
  onConfirm,
  onReset,
  className,
  minDate,
  maxDate
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(value || new Date());
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');

  React.useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    if (onChange) {
      onChange(newDate);
    }
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} className="h-11 w-11" />
  ));

  const isSelected = (d: number) => {
    if (!value) return false;
    return value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
  };

  const isDisabled = (d: number) => {
    const dObj = new Date(year, month, d);
    if (minDate && dObj < minDate) return true;
    if (maxDate && dObj > maxDate) return true;
    return false;
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const selected = isSelected(d);
    const disabled = isDisabled(d);

    return (
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleDayClick(d)}
        className={cn(
          'h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-sm transition-colors',
          selected
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-foreground hover:bg-muted',
          disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
        )}
      >
        {d}
      </button>
    );
  });

  const renderMonthYearSelector = () => {
    if (view === 'months') {
      return (
        <div className="grid grid-cols-3 gap-2 py-4">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              type="button"
              className={cn(
                'min-h-11 py-2 rounded-lg text-sm transition-colors',
                month === i
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
              onClick={() => {
                setCurrentDate(new Date(year, i, 1));
                setView('days');
              }}
            >
              {m}
            </button>
          ))}
        </div>
      );
    }

    if (view === 'years') {
      const startYear = year - 5;
      return (
        <div className="grid grid-cols-3 gap-2 py-4 h-[250px] overflow-y-auto custom-scrollbar">
          {Array.from({ length: 20 }, (_, i) => startYear + i).map((y) => (
            <button
              key={y}
              type="button"
              className={cn(
                'min-h-11 py-2 rounded-lg text-sm transition-colors',
                year === y
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
              onClick={() => {
                setCurrentDate(new Date(y, month, 1));
                setView('days');
              }}
            >
              {y}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'p-4 bg-card text-foreground border border-border rounded-2xl max-w-[340px] w-full mx-auto select-none shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={() => setView(view === 'days' ? 'months' : 'days')}
          className="min-h-11 inline-flex items-center gap-1 px-1 font-medium text-foreground hover:text-accent transition-colors"
        >
          {MONTHS[month]} de {year}
          <ChevronDown
            size={16}
            className={cn('transition-transform', view !== 'days' && 'rotate-180')}
          />
        </button>

        {view === 'days' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:bg-muted rounded-full transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="inline-flex min-h-11 min-w-11 items-center justify-center hover:bg-muted rounded-full transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {view === 'days' ? (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-[10px] font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 place-items-center">{blanks}{days}</div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {renderMonthYearSelector()}
          {view === 'months' && (
            <button
              type="button"
              onClick={() => setView('years')}
              className="w-full mt-2 min-h-11 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Cambiar año ({year})
            </button>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 gap-3">
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium text-foreground transition-colors"
        >
          Restablecer
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center bg-accent hover:bg-accent/90 rounded-full text-accent-foreground transition-colors"
          aria-label="Confirmar fecha"
        >
          <Check size={20} />
        </button>
      </div>
    </div>
  );
}
