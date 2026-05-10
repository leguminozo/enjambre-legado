import React from 'react';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-md hover:brightness-110 active:scale-[0.96]',
  gold:
    'bg-gradient-to-r from-miel-dark via-miel to-miel-dark bg-[length:200%_auto] text-bosque-dark font-semibold border border-white/20 shadow-md hover:bg-right hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.96]',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-surface-raised hover:border-foreground/20',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-surface-raised hover:text-foreground',
  destructive:
    'bg-destructive text-white shadow-md hover:brightness-110 active:scale-[0.96]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-editorial-xs tracking-wider uppercase',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base tracking-wide',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-md font-medium
        transition-all duration-base
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:pointer-events-none disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
