'use client';

import { useEffect, useState } from 'react';

export interface CensoCountdownProps {
  /**
   * ISO string o fecha YYYY-MM-DD del cierre.
   * Si no se provee o es inválido, usa el 31 de octubre del año actual a las 23:59:59.
   */
  targetDate?: string | null;
  className?: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
}

export function parseTargetDate(cierre?: string | null): Date {
  if (cierre) {
    const trimmed = cierre.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, 9, 31, 23, 59, 59, 999); // 31 de octubre
}

export function calculateTimeRemaining(target: Date, nowMs: number = Date.now()): TimeRemaining {
  const diff = target.getTime() - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isEnded: false };
}

/**
 * Contador en retroceso para el cierre de inscripciones del Censo Apícola Territorial.
 * Muestra días, horas, minutos y segundos actualizados cada segundo.
 */
export function CensoCountdown({ targetDate, className = '' }: CensoCountdownProps) {
  const [time, setTime] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const target = parseTargetDate(targetDate);

    const update = () => {
      setTime(calculateTimeRemaining(target));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!time) {
    return (
      <div
        className={`grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-sm mx-auto mb-8 ${className}`}
        aria-hidden="true"
      >
        {['Días', 'Horas', 'Min.', 'Seg.'].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-lg bg-surface-raised/80 border border-border/60"
          >
            <span className="font-mono text-xl sm:text-2xl font-semibold text-foreground/30 tabular-nums">
              --
            </span>
            <span className="text-[0.65rem] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (time.isEnded) {
    return (
      <div
        className={`inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full bg-surface-raised border border-border text-xs sm:text-sm font-medium text-muted-foreground ${className}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-primary/60 mr-2" />
        Plazo de inscripción cerrado
      </div>
    );
  }

  const units = [
    { label: 'Días', value: String(time.days) },
    { label: 'Horas', value: String(time.hours).padStart(2, '0') },
    { label: 'Min.', value: String(time.minutes).padStart(2, '0') },
    { label: 'Seg.', value: String(time.seconds).padStart(2, '0') },
  ];

  return (
    <div
      role="timer"
      aria-label="Tiempo restante para el cierre del censo"
      className={`grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-sm mx-auto mb-8 ${className}`}
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center justify-center py-3 px-2 rounded-lg bg-surface-raised/80 border border-border/60 backdrop-blur-xs shadow-xs transition-colors hover:border-border"
        >
          <span className="font-mono text-xl sm:text-2xl font-semibold text-foreground tracking-tight tabular-nums">
            {unit.value}
          </span>
          <span className="text-[0.65rem] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
