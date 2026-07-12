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

  // Sync state if value changes externally
  React.useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper functions for dates
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    let day = new Date(y, m, 1).getDay();
    // Convert to Monday = 0, Sunday = 6
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
    // Update internal current date if not fully controlled (optional, but good for local feedback)
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Calculate days for the grid (including padding from prev/next months if we want to show them, but here we just leave empty slots)
  const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} className="h-10 w-10" />);
  
  const isSelected = (d: number) => {
    if (!value) return false;
    return value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
  };

  const isToday = (d: number) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
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
          "h-10 w-10 flex items-center justify-center rounded-full text-sm transition-colors",
          selected
            ? "bg-accent text-accent-foreground font-medium" 
            : "hover:bg-white/10 text-[#d4d4d4]",
          disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {d}
      </button>
    );
  });

  const renderMonthYearSelector = () => {
    if (view === 'months') {
      return (
        <div className="grid grid-cols-3 gap-4 py-4">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              className={cn(
                "py-2 rounded-lg text-sm transition-colors",
                month === i ? "bg-white/10 text-white font-medium" : "text-[#a3a3a3] hover:bg-white/5 hover:text-white"
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
        <div className="grid grid-cols-3 gap-4 py-4 h-[250px] overflow-y-auto custom-scrollbar">
          {Array.from({ length: 20 }, (_, i) => startYear + i).map((y) => (
            <button
              key={y}
              className={cn(
                "py-2 rounded-lg text-sm transition-colors",
                year === y ? "bg-white/10 text-white font-medium" : "text-[#a3a3a3] hover:bg-white/5 hover:text-white"
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
    <div className={cn("p-4 bg-[#4a4a4a] text-white rounded-2xl max-w-[340px] w-full mx-auto select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setView(view === 'days' ? 'months' : 'days')}
          className="flex items-center gap-1 font-medium hover:text-white/80 transition-colors"
        >
          {MONTHS[month]} de {year}
          <ChevronDown size={16} className={cn("transition-transform", view !== 'days' && "rotate-180")} />
        </button>
        
        {view === 'days' && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {view === 'days' ? (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-[10px] font-semibold text-[#a3a3a3]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {blanks}
            {days}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {renderMonthYearSelector()}
          {view === 'months' && (
             <button 
                onClick={() => setView('years')} 
                className="w-full mt-2 py-2 text-sm text-[#a3a3a3] hover:text-white transition-colors text-center"
             >
                Cambiar año ({year})
             </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-full text-sm font-medium transition-colors"
        >
          Restablecer
        </button>
        <button
          onClick={onConfirm}
          className="h-10 w-10 flex items-center justify-center bg-accent hover:bg-accent/90 rounded-full text-accent-foreground transition-colors"
        >
          <Check size={20} />
        </button>
      </div>
    </div>
  );
}
