import React from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'destructive' | 'gold' | 'info' | 'outline' | 'secondary';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-destructive/12 text-destructive',
  destructive: 'bg-destructive/12 text-destructive',
  gold: 'bg-miel-glow text-miel-dark',
  info: 'bg-info/12 text-info',
  outline: 'border border-border text-foreground bg-transparent',
  secondary: 'bg-surface-raised text-foreground',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-0.5
        rounded-full
        text-[0.7rem] font-semibold tracking-wide uppercase
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
