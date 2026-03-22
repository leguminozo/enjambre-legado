import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark' | 'contrast' | 'dark-theme'
  className?: string
  showText?: boolean
}

export function Logo({ 
  size = 'md', 
  variant = 'default', 
  className,
  showText = true 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const logoContainerClasses = cn(
    'flex items-center gap-3',
    className
  )

  const logoImageClasses = cn(
    'relative',
    sizeClasses[size]
  )

  const textClasses = cn(
    'font-light tracking-wide',
    textSizes[size],
    variant === 'default' && 'text-white',
    variant === 'light' && 'text-gray-100',
    variant === 'dark' && 'text-gray-900',
    variant === 'contrast' && 'text-white', // Siempre blanco para máxima visibilidad
    variant === 'dark-theme' && 'text-white' // Blanco para tema oscuro
  )

  // Estilos del contenedor del logo según la variante
  const logoContainerStyles = {
    default: 'bg-white/90 shadow-lg',
    light: 'bg-gray-100/90 shadow-md',
    dark: 'bg-gray-800/90 shadow-lg',
    contrast: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl',
    'dark-theme': 'bg-white shadow-2xl border-2 border-amber-300/50' // Variante especial para tema oscuro
  }

  return (
    <div className={logoContainerClasses}>
      <div className={logoImageClasses}>
        {/* Fondo circular con estilo según la variante */}
        <div className={cn(
          'absolute inset-0 rounded-full shadow-lg border-2',
          logoContainerStyles[variant],
          variant === 'contrast' && 'border-amber-300',
          variant === 'default' && 'border-white/20',
          variant === 'light' && 'border-gray-200/30',
          variant === 'dark' && 'border-gray-700/30',
          variant === 'dark-theme' && 'border-amber-300/50'
        )} />
        
        {/* Logo centrado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/eureka-logo-new.png"
            alt="Eureka Cafe"
            width={64}
            height={64}
            className={cn(
              'w-full h-full object-contain p-1',
              variant === 'contrast' && 'filter brightness-0 invert', // Hacer el logo blanco en fondo ámbar
              variant === 'dark-theme' && 'filter brightness-0' // Logo negro en fondo blanco para máximo contraste
            )}
          />
        </div>
      </div>
      
      {showText && (
        <span className={textClasses}>
          Eureka!
        </span>
      )}
    </div>
  )
}

// Variante compacta solo con el logo
export function LogoIcon({ 
  size = 'md', 
  variant = 'default',
  className 
}: Omit<LogoProps, 'showText'>) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  // Estilos del contenedor del logo según la variante
  const logoContainerStyles = {
    default: 'bg-white/90 shadow-lg',
    light: 'bg-gray-100/90 shadow-md',
    dark: 'bg-gray-800/90 shadow-lg',
    contrast: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl',
    'dark-theme': 'bg-white shadow-2xl border-2 border-amber-300/50'
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Fondo circular con estilo según la variante */}
      <div className={cn(
        'absolute inset-0 rounded-full shadow-lg border-2',
        logoContainerStyles[variant],
        variant === 'contrast' && 'border-amber-300',
        variant === 'default' && 'border-white/20',
        variant === 'light' && 'border-gray-200/30',
        variant === 'dark' && 'border-gray-700/30',
        variant === 'dark-theme' && 'border-amber-300/50'
      )} />
      
      {/* Logo centrado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/eureka-logo-new.png"
          alt="Eureka Cafe"
          width={64}
          height={64}
          className={cn(
            'w-full h-full object-contain p-1',
            variant === 'contrast' && 'filter brightness-0 invert', // Hacer el logo blanco en fondo ámbar
            variant === 'dark-theme' && 'filter brightness-0' // Logo negro en fondo blanco para máximo contraste
          )}
        />
      </div>
    </div>
  )
}

// Logo con anillo de luz para máxima visibilidad
export function GlowingLogo({ 
  size = 'md', 
  className,
  showText = true 
}: Omit<LogoProps, 'variant'>) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Anillo de luz exterior */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/40 to-amber-600/40 blur-sm animate-pulse" />
        
        {/* Fondo circular principal */}
        <div className="absolute inset-1 rounded-full bg-white shadow-2xl border-2 border-amber-300/50" />
        
        {/* Logo centrado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/eureka-logo-new.png"
            alt="Eureka Cafe"
            width={64}
            height={64}
            className="w-full h-full object-contain p-1 filter brightness-0"
          />
        </div>
      </div>
      
      {showText && (
        <span className={cn('font-light tracking-wide text-white', textSizes[size])}>
          Eureka!
        </span>
      )}
    </div>
  )
}
