import React from 'react';

interface StatCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  trend?: { value: string; direction: 'up' | 'down' };
  className?: string;
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-card backdrop-blur-xl
        border border-border/50
        rounded-lg p-5
        shadow-sm
        transition-all duration-spring
        hover:-translate-y-1 hover:shadow-glow
        group
        ${className}
      `}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-miel-glow rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
      <div className="flex items-center justify-between mb-3 relative">
        {icon && (
          <div className="w-10 h-10 rounded-md bg-miel-glow flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
        {trend && (
          <span
            className={`
              text-xs font-semibold px-2 py-0.5 rounded-full
              ${trend.direction === 'up'
                ? 'text-success bg-success/10'
                : 'text-destructive bg-destructive/10'}
            `}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground font-sans leading-none mb-1 relative">
        {value}
      </p>
      <p className="text-sm text-muted-foreground relative">{label}</p>
    </div>
  );
}
