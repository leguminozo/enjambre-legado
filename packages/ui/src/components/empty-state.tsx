import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  suggestion?: string
  action?: React.ReactNode
  className?: string
  /** composed = alineado al flujo, sin icono de marketing */
  variant?: 'centered' | 'composed'
  /** tema contextual para el acento visual tenue */
  theme?: 'neutral' | 'bosque' | 'feria' | 'oro'
}

export function EmptyState({
  icon,
  title,
  description,
  suggestion,
  action,
  className = '',
  variant = 'centered',
  theme = 'neutral',
}: EmptyStateProps) {
  const composed = variant === 'composed'
  const themeClasses = {
    neutral: '',
    bosque: 'border border-primary/20 bg-primary/5 rounded-2xl p-6',
    feria: 'border border-accent/20 bg-accent/5 rounded-2xl p-6',
    oro: 'border border-accent/30 bg-surface-raised rounded-2xl p-6 shadow-sm',
  }[theme]

  return (
    <div
      className={`${
        composed
          ? 'py-8 text-left'
          : 'flex flex-col items-center justify-center py-12 text-center'
      } ${themeClasses} ${className}`}
    >
      {!composed && icon ? <div className="text-muted-foreground mb-4">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className={`text-sm text-muted-foreground ${composed ? 'max-w-xl' : 'max-w-md'}`}>
          {description}
        </p>
      )}
      {suggestion && (
        <p className={`mt-2 text-xs text-accent/90 italic ${composed ? 'max-w-xl' : 'max-w-md'}`}>
          💡 {suggestion}
        </p>
      )}
      {action && (
        <div
          className={`mt-4 flex flex-wrap items-center gap-2 [&>*]:min-h-11 ${
            composed ? '' : 'justify-center'
          }`}
        >
          {action}
        </div>
      )}
    </div>
  )
}
