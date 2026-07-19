"use client";

import React from 'react';
import { cn } from '../lib/utils';

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number; // diameter in px
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  showValue?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type VariantKey = NonNullable<ProgressRingProps['variant']>;

const variantColors: Record<VariantKey, { circle: string; bg: string }> = {
  default: { circle: 'text-primary', bg: 'text-muted-foreground/10' },
  success: { circle: 'text-success', bg: 'text-success/10' },
  warning: { circle: 'text-warning', bg: 'text-warning/10' },
  accent: { circle: 'text-accent', bg: 'text-accent/10' },
};

export function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 4,
  variant = 'default',
  showValue = true,
  className = '',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference * (1 - clampedProgress / 100);

  const { circle, bg } = variantColors[variant];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className={cn(bg, 'opacity-20')}
          style={{ strokeDasharray: circumference }}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          className={cn(circle, 'transition-all duration-700 ease-elegant')}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-semibold font-display text-foreground">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProgressRingWithLabel({
  progress = 0,
  label,
  sublabel,
  size = 80,
  variant = 'default',
  className = '',
}: ProgressRingProps & { label: string; sublabel?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <ProgressRing progress={progress} size={size} variant={variant} showValue />
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-[0.65rem] text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}