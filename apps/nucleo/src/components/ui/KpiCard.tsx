'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
    label?: string;
  };
  sparkline?: number[];
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon,
  description,
  trend,
  sparkline,
  className,
}: KpiCardProps) {
  let sparklinePoints = '';
  let sparklineGradientPath = '';
  if (sparkline && sparkline.length > 1) {
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const padding = 2;

    const coords = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    sparklinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
    sparklineGradientPath = `M 0,${height} ` + coords.map((c) => `L ${c.x},${c.y}`).join(' ') + ` L ${width},${height} Z`;
  }

  return (
    <GlassCard className={cn("p-6 flex flex-col justify-between min-h-[140px]", className)} glow>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="micro-label">{title}</span>
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display-garamond text-3xl font-light text-foreground tracking-tight leading-none">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {trend.isPositive ? '▲' : '▼'} {trend.value}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        {description && (
          <p className="text-[0.75rem] text-muted-foreground leading-tight max-w-[70%]">
            {description}
            {trend?.label && <span className="block text-[0.68rem] opacity-75 mt-0.5">{trend.label}</span>}
          </p>
        )}

        {sparkline && sparkline.length > 1 && (
          <div className="w-24 h-8 shrink-0 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={sparklineGradientPath}
                fill="url(#sparkline-grad)"
              />
              <polyline
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
