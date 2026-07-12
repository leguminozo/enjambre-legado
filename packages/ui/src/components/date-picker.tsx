'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Calendar } from './calendar';

export interface DatePickerProps {
  value?: string | null; // format YYYY-MM-DD
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Parse YYYY-MM-DD
  let dateValue: Date | null = null;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
         dateValue = new Date(year, month - 1, day);
      }
    }
  }

  const [tempDate, setTempDate] = useState<Date | null>(dateValue);

  // Sync internal state when opened
  useEffect(() => {
    if (open) {
      setTempDate(dateValue || new Date());
    }
  }, [open, value]);

  const handleConfirm = () => {
    if (tempDate && onChange) {
      const y = tempDate.getFullYear();
      const m = String(tempDate.getMonth() + 1).padStart(2, '0');
      const d = String(tempDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    setOpen(false);
  };

  const handleReset = () => {
    if (onChange) {
      onChange('');
    }
    setOpen(false);
  };

  const formattedValue = dateValue 
    ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateValue)
    : '';

  return (
    <div className={cn("relative inline-block w-full text-left", className)} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <span>{value ? formattedValue : placeholder}</span>
        <CalendarIcon className="h-4 w-4 opacity-50" />
      </button>

      {/* Popover / Modal wrapper */}
      {open && (
        <>
          {/* Mobile Overlay (visible only on small screens) */}
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />
          
          <div className={cn(
            "absolute z-50 mt-2", 
            "fixed sm:absolute", // fixed on mobile, absolute on desktop
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", // center on mobile
            "sm:top-full sm:left-0 sm:transform-none sm:mt-1", // anchor to button on desktop
            "w-[340px] max-w-[95vw]"
          )}>
            <Calendar
              value={tempDate}
              onChange={setTempDate}
              onConfirm={handleConfirm}
              onReset={handleReset}
              className="shadow-2xl sm:shadow-lg border border-border sm:border-white/10"
            />
          </div>
        </>
      )}
    </div>
  );
}
