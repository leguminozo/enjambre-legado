import React from 'react';

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-8 ${className}`}>
      <div>
        {kicker && (
          <span className="block text-editorial-xs tracking-widest uppercase text-accent mb-3">
            {kicker}
          </span>
        )}
        <h2 className="font-display text-[clamp(1.5rem,6vw,3rem)] sm:text-4xl md:text-5xl font-light text-foreground tracking-tight text-balance leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground italic font-display text-base sm:text-lg text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 mt-2 flex flex-wrap items-center gap-2 [&>*]:min-h-11">
          {action}
        </div>
      )}
    </div>
  );
}
