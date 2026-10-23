'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { overlayBackdropClassName } from '../lib/overlay-layer';
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
  placeholder = "YYYY-MM-DD",
  className,
  disabled
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean } | null>(null);

  // Local text input state to allow direct typing
  const [inputText, setInputText] = useState(value || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInputText(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
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

  // Update popover coordinates relative to viewport / document
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 390;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

      const top = openUpwards
        ? rect.top + window.scrollY - popoverHeight - 4
        : rect.bottom + window.scrollY + 6;

      const left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 350));

      setCoords({ top, left, openUpwards });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // Parse YYYY-MM-DD
  let dateValue: Date | null = null;
  if (value) {
    const [yPart, mPart, dPart] = value.split('-');
    if (yPart && mPart && dPart) {
      const year = parseInt(yPart, 10);
      const month = parseInt(mPart, 10);
      const day = parseInt(dPart, 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        dateValue = new Date(year, month - 1, day);
      }
    }
  }

  const [tempDate, setTempDate] = useState<Date | null>(dateValue);

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
      const formatted = `${y}-${m}-${d}`;
      setInputText(formatted);
      onChange(formatted);
    }
    setOpen(false);
  };

  const handleReset = () => {
    setInputText('');
    if (onChange) {
      onChange('');
    }
    setOpen(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // If matches YYYY-MM-DD, auto-commit
    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      const [yPart, mPart, dPart] = val.trim().split('-');
      if (yPart && mPart && dPart) {
        const year = parseInt(yPart, 10);
        const month = parseInt(mPart, 10);
        const day = parseInt(dPart, 10);
        if (year >= 1990 && year <= 2050 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          onChange?.(val.trim());
        }
      }
    } else if (val.trim() === '') {
      onChange?.('');
    }
  };

  return (
    <div className={cn("relative inline-block w-full text-left", className)} ref={containerRef}>
      {/* Trigger Input with Calendar Toggle */}
      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={inputText}
          onChange={handleManualInput}
          onClick={() => {
            if (!open) setOpen(true);
          }}
          className={cn(
            "flex h-11 min-h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 pr-16 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono tracking-wide",
            !inputText && "text-muted-foreground font-sans tracking-normal"
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {inputText && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label="Limpiar fecha"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors focus:outline-none"
            aria-label="Abrir calendario"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Popover rendered via Portal to body to avoid clipping/stacking context overlap */}
      {open && mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile Overlay */}
          <div
            className={cn('fixed inset-0 z-[9990] sm:hidden', overlayBackdropClassName)}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            ref={popoverRef}
            style={{
              position: window.innerWidth < 640 ? 'fixed' : 'absolute',
              top: window.innerWidth < 640 ? '50%' : `${coords?.top ?? 0}px`,
              left: window.innerWidth < 640 ? '50%' : `${coords?.left ?? 0}px`,
              transform: window.innerWidth < 640 ? 'translate(-50%, -50%)' : 'none',
              zIndex: 9999,
            }}
            className="w-[340px] max-w-[95vw] animate-in fade-in zoom-in-95 duration-150"
          >
            <Calendar
              value={tempDate}
              onChange={setTempDate}
              onConfirm={handleConfirm}
              onReset={handleReset}
              className="shadow-2xl border border-border"
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
