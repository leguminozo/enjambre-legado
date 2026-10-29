import { cn } from '@enjambre/ui';

export interface ScrollCueProps {
  label?: string;
  className?: string;
}

export function ScrollCue({ label = 'Desliza para explorar', className }: ScrollCueProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 pointer-events-none select-none z-20 opacity-75 hover:opacity-100 transition-opacity',
        className,
      )}
      aria-hidden
    >
      <span className="text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.24em] text-accent-text font-mono">
        {label}
      </span>
      <div className="w-[1px] h-5 sm:h-6 bg-gradient-to-b from-accent/80 via-accent/30 to-transparent animate-pulse" />
    </div>
  );
}
