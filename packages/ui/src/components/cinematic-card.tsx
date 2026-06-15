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
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black transition-transform duration-700 ease-out group-hover:scale-105">
           {/* Chrome metallic effect overlay */}
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent mix-blend-overlay" />
           <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] transition-[background-position] duration-700 group-hover:bg-[position:200%_0,0_0]" />
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
          <div className="self-start px-2.5 py-1 rounded-md bg-background/30 backdrop-blur-md border border-white/10 text-xs font-semibold text-foreground mb-2 shadow-sm">
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

