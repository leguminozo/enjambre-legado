'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface SegmentControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentControlProps {
  options: readonly SegmentControlOption[] | SegmentControlOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentControl({ options, selectedValue, onChange, className }: SegmentControlProps) {
  return (
    <div className={cn("flex p-1 bg-surface-sunken/40 backdrop-blur-md border border-border/50 rounded-xl relative", className)}>
      {options.map((opt) => {
        const isActive = opt.value === selectedValue;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center justify-center gap-2 flex-1 px-4 py-2 text-xs font-semibold rounded-lg relative transition-colors duration-200 z-10 btn-press",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-card/85 border border-border/40 shadow-sm rounded-lg -z-10"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
