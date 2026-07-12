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
  parseISO 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarioEvent, CalendarioEventType } from '../types';

export interface CalendarioProps {
  events: CalendarioEvent[];
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
  onEventClick?: (event: CalendarioEvent) => void;
  onDateClick?: (date: Date) => void;
  isLoading?: boolean;
}

const eventTypeConfig: Record<CalendarioEventType, { colorClass: string; label: string }> = {
  feria: { colorClass: 'bg-miel/10 text-miel border border-miel/30', label: 'Ferias' },
  apicultura: { colorClass: 'bg-bosque/20 text-bosque-light border border-bosque/30', label: 'Apicultura' },
  marketing: { colorClass: 'bg-crema/5 text-crema-dark border border-crema/20', label: 'Marketing' },
  historico: { colorClass: 'bg-miel text-background font-semibold shadow-glow', label: 'Cosechas' },
  inspeccion: { colorClass: 'bg-bosque text-crema font-medium border border-bosque-light/30', label: 'Inspecciones' }
};

export function Calendario({ 
  events, 
  currentDate = new Date(), 
  onMonthChange, 
  onEventClick, 
  onDateClick, 
  isLoading 
}: CalendarioProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => {
    onMonthChange?.(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    onMonthChange?.(addMonths(currentDate, 1));
  };
  
  const handleToday = () => {
    onMonthChange?.(new Date());
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(e => {
      const eStart = typeof e.startDate === 'string' ? parseISO(e.startDate) : e.startDate;
      if (!e.endDate) return isSameDay(eStart, day);
      
      const eEnd = typeof e.endDate === 'string' ? parseISO(e.endDate) : e.endDate;
      return day >= eStart && day <= eEnd;
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground border border-miel/10 rounded-2xl overflow-hidden shadow-glow">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-miel/10 bg-card/20 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-bold tracking-wide capitalize text-crema">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-miel/70 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-miel opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-miel"></span>
              </span>
              <span className="hidden sm:inline font-sans text-xs tracking-wider uppercase">Sincronizando...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-miel/10 text-crema hover:text-miel rounded-full transition-all duration-elegant"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToday}
            className="px-4 py-1 text-xs font-sans font-semibold tracking-wider uppercase hover:bg-miel/15 text-crema border border-miel/20 rounded-full transition-all duration-elegant"
          >
            Hoy
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-miel/10 text-crema hover:text-miel rounded-full transition-all duration-elegant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* WEEKDAYS (Desktop) */}
      <div className="hidden sm:grid sm:grid-cols-7 border-b border-miel/5 bg-card/10">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-sans font-bold text-crema/40 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID (Desktop & Mobile fallback) */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-7 auto-rows-fr bg-card/5 min-h-full">
          {days.map((day) => {
            const isSame = isSameMonth(day, monthStart);
            const today = isToday(day);
            const dayEvents = getEventsForDay(day);

            // Hide days from other months on mobile to save space
            if (!isSame) {
              return (
                <div key={day.toString()} className="hidden sm:block p-2 border-b border-r border-miel/5 bg-background/40 opacity-25 min-h-[120px]">
                  <div className="text-crema/40 text-xs w-7 h-7 flex items-center justify-center mb-1">{format(day, 'd')}</div>
                </div>
              );
            }

            return (
              <div 
                key={day.toString()} 
                onClick={() => onDateClick?.(day)}
                className={`
                  p-3 sm:p-2 border-b sm:border-r border-miel/5 relative group hover:bg-bosque-dark/30 transition-all duration-elegant
                  min-h-[auto] sm:min-h-[120px] flex sm:block items-start gap-3 sm:gap-0
                  ${!isSame ? 'bg-background/20 opacity-40' : ''}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full sm:mb-1.5 text-xs font-semibold shrink-0 transition-all
                  ${today ? 'bg-miel text-background font-bold shadow-glow' : 'text-crema/85'}
                `}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex flex-col gap-1.5 sm:gap-1 flex-1 sm:max-h-[85px] sm:overflow-y-auto scrollbar-none w-full">
                  {dayEvents.map(evt => {
                    const conf = eventTypeConfig[evt.type] || { colorClass: 'bg-card text-crema border border-border' };
                    return (
                      <div 
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(evt);
                        }}
                        className={`${conf.colorClass} text-xs sm:text-[10px] px-2.5 py-1.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-sm truncate cursor-pointer hover:brightness-110 hover:-translate-y-[1px] transition-all duration-elegant shadow-sm w-full`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length === 0 && (
                     <div className="sm:hidden text-crema/20 text-xs py-1.5 italic">Sin registros</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* LEGEND */}
      <div className="px-6 py-4 flex items-center justify-center gap-6 flex-wrap border-t border-miel/10 bg-card/20 text-[10px] text-crema/50 uppercase tracking-widest font-semibold shrink-0">
        {Object.entries(eventTypeConfig).map(([key, conf]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${conf.colorClass.split(' ')[0]}`} />
            <span className="capitalize">{conf.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
