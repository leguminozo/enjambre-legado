import * as React from 'react'
import { cn } from '../lib/utils'

interface CinematicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  badgeText?: string
  variant?: 'image' | 'chrome'
  imageUrl?: string
}

export function CinematicCard({ imageUrl, title, subtitle, badgeText, variant = 'image', className, children, ...props }: CinematicCardProps) {
  const isChrome = variant === 'chrome'

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-surface-raised flex flex-col justify-end min-h-[300px] border border-border",
        className
      )}
      {...props}
    >
      {/* Background layer */}
      {isChrome ? (
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-background transition-transform duration-700 ease-out group-hover:scale-105">
           {/* Chrome metallic effect overlay — tokens only */}
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-foreground/10 via-transparent to-transparent mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.06] via-transparent to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-100" />
        </div>
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        />
      )}
      
      {/* Darkening gradient from bottom to top for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
      
      <div className="relative z-10 p-6 flex flex-col gap-2">
        {badgeText && (
          <div className="self-start px-2.5 py-1 rounded-md bg-background/30 backdrop-blur-md border border-border/50 text-xs font-semibold text-foreground mb-2 shadow-sm">
            {badgeText}
          </div>
        )}
        <h3 className="font-display text-xl font-bold text-foreground leading-tight drop-shadow-md">{title}</h3>
        {subtitle && <p className="text-sm text-foreground/80 drop-shadow-sm">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

