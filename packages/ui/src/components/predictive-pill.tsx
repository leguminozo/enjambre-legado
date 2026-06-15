import * as React from 'react'
import { cn } from '../lib/utils'

interface PredictivePillProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  confidence?: number // 0-1
}

export function PredictivePill({ message, icon, actionLabel, onAction, confidence, className, ...props }: PredictivePillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-surface-raised shadow-md backdrop-blur-md",
        className
      )}
      {...props}
    >
      {icon && <div className="text-primary">{icon}</div>}
      <span className="text-sm font-medium text-foreground">{message}</span>
      
      {actionLabel && (
        <button
          onClick={onAction}
          className="ml-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      
      {confidence !== undefined && (
        <div className="ml-2 w-2 h-2 rounded-full" 
          style={{ 
            backgroundColor: confidence > 0.8 ? 'hsl(var(--success))' : 'hsl(var(--warning))',
            opacity: confidence
          }} 
        />
      )}
    </div>
  )
}
