import * as React from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, isToday, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OmniEvent, OmniEventType } from '../types';

export interface OmniCalendarProps {
  events: OmniEvent[];
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
  onEventClick?: (event: OmniEvent) => void;
  onDateClick?: (date: Date) => void;
  isLoading?: boolean;
}

const eventTypeConfig: Record<OmniEventType, { color: string; label: string }> = {
  feria: { color: 'bg-indigo-500', label: 'Ferias' },
  apicultura: { color: 'bg-amber-500', label: 'Apicultura' },
  marketing: { color: 'bg-emerald-500', label: 'Marketing' },
  historico: { color: 'bg-rose-500', label: 'Histórico' },
  inspeccion: { color: 'bg-sky-500', label: 'Inspecciones' }
};

export function OmniCalendar({ 
  events, 
  currentDate = new Date(), 
  onMonthChange, 
  onEventClick, 
  onDateClick, 
  isLoading 
}: OmniCalendarProps) {
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
    <div className="w-full h-full flex flex-col bg-background text-foreground border border-border/50 rounded-xl overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-card/30 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display font-bold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="hidden sm:inline">Sincronizando...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToday}
            className="px-3 py-1 text-sm font-medium hover:bg-foreground/10 rounded-full transition-colors"
          >
            Hoy
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* WEEKDAYS (Desktop) */}
      <div className="hidden sm:grid sm:grid-cols-7 border-b border-border/50 bg-muted/20">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID (Desktop & Mobile fallback) */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-7 auto-rows-fr bg-card/20 min-h-full">
          {days.map((day) => {
            const isSame = isSameMonth(day, monthStart);
            const today = isToday(day);
            const dayEvents = getEventsForDay(day);

            // Hide days from other months on mobile to save space
            if (!isSame) {
              return (
                <div key={day.toString()} className="hidden sm:block p-2 border-b border-r border-border/30 bg-muted/10 opacity-60 min-h-[120px]">
                  <div className="text-foreground/80 text-sm w-7 h-7 flex items-center justify-center mb-1">{format(day, 'd')}</div>
                </div>
              );
            }

            return (
              <div 
                key={day.toString()} 
                onClick={() => onDateClick?.(day)}
                className={`
                  p-3 sm:p-2 border-b sm:border-r border-border/30 relative group hover:bg-foreground/[0.02] transition-colors
                  min-h-[auto] sm:min-h-[120px] flex sm:block items-start gap-3 sm:gap-0
                  ${!isSame ? 'bg-muted/10 opacity-60' : ''}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full sm:mb-1 text-sm shrink-0
                  ${today ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground/80 font-medium'}
                `}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex flex-col gap-1.5 sm:gap-1 flex-1 sm:max-h-[80px] sm:overflow-y-auto scrollbar-none w-full">
                  {dayEvents.map(evt => {
                    const conf = eventTypeConfig[evt.type] || { color: 'bg-foreground/20' };
                    return (
                      <div 
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(evt);
                        }}
                        className={`${conf.color} text-white text-xs sm:text-[10px] px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-md sm:rounded-sm truncate cursor-pointer hover:brightness-110 transition-all font-medium shadow-sm w-full`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length === 0 && (
                     <div className="sm:hidden text-muted-foreground/50 text-xs py-1.5 italic">Sin eventos</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* LEGEND */}
      <div className="px-4 py-3 flex items-center justify-center gap-4 flex-wrap border-t border-border/50 bg-card/20 text-xs text-muted-foreground shrink-0">
        {Object.entries(eventTypeConfig).map(([key, conf]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${conf.color}`} />
            <span className="capitalize">{conf.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
