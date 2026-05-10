import React from 'react';

type Variant = 'default' | 'dark' | 'glass' | 'accent' | 'elevated';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hover?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-card text-card-foreground border border-border/50 backdrop-blur-xl shadow-sm',
  dark:
    'bg-primary text-primary-foreground border border-white/10',
  glass:
    'bg-card/60 backdrop-blur-xl border border-white/20 shadow-lg',
  accent:
    'bg-card text-card-foreground border-l-[3px] border-l-accent',
  elevated:
    'bg-surface-raised text-foreground border border-border/30 shadow-md',
};

export function Card({
  variant = 'default',
  hover = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-lg p-6
        transition-all duration-spring
        ${hover ? 'hover:-translate-y-1 hover:shadow-glow hover:border-accent/30 active:scale-[0.98]' : ''}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
}

export function CardTitle({ as: Tag = 'h3', className = '', children, ...props }: CardTitleProps) {
  return (
    <Tag className={`font-display text-xl font-semibold tracking-tight ${className}`} {...props}>
      {children}
    </Tag>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ className = '', children, ...props }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-muted-foreground leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`flex items-center pt-4 border-t border-border/30 ${className}`} {...props}>
      {children}
    </div>
  );
}
