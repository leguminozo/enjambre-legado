import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  /** composed = alineado al flujo, sin icono de marketing */
  variant?: 'centered' | 'composed'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'centered',
}: EmptyStateProps) {
  const composed = variant === 'composed'
  return (
    <div
      className={`${
        composed
          ? 'py-8 text-left'
          : 'flex flex-col items-center justify-center py-12 text-center'
      } ${className}`}
    >
      {!composed && icon ? <div className="text-muted-foreground mb-4">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className={`text-sm text-muted-foreground ${composed ? 'max-w-xl' : 'max-w-md'}`}>
          {description}
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
