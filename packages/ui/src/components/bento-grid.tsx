import * as React from 'react'
import { cn } from '../lib/utils'

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3
  rowSpan?: 1 | 2
}

export function BentoGridItem({ className, children, colSpan = 1, rowSpan = 1, ...props }: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card overflow-hidden flex flex-col p-6 shadow-sm",
        colSpan === 2 && "md:col-span-2 lg:col-span-2",
        colSpan === 3 && "lg:col-span-3",
        rowSpan === 2 && "row-span-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
