import type { Config } from 'tailwindcss';

export function createEnjambrePreset(overrides?: Partial<Config['theme']>): Partial<Config> {
  return {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
            // Texto legible sobre fondo oscuro (contraste ≥4.5:1); en modo
            // claro se revierte a --accent vía override en el app.
            text: 'hsl(var(--accent-text))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
          },
          success: 'hsl(var(--success))',
          successText: 'hsl(var(--success-text))',
          warning: 'hsl(var(--warning))',
          info: 'hsl(var(--info))',
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          surface: {
            raised: 'hsl(var(--surface-raised))',
            sunken: 'hsl(var(--surface-sunken))',
          },
          chart: {
            '1': 'hsl(var(--chart-1))',
            '4': 'hsl(var(--chart-4))',
            '5': 'hsl(var(--chart-5))',
          },
          sidebar: {
            DEFAULT: 'hsl(var(--sidebar))',
            foreground: 'hsl(var(--sidebar-foreground))',
            primary: {
              DEFAULT: 'hsl(var(--sidebar-primary))',
              foreground: 'hsl(var(--sidebar-primary-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--sidebar-accent))',
              foreground: 'hsl(var(--sidebar-accent-foreground))',
            },
            border: 'hsl(var(--sidebar-border))',
            ring: 'hsl(var(--sidebar-ring))',
          },
          bosque: {
            DEFAULT: 'hsl(var(--enj-bosque-ulmo-h) var(--enj-bosque-ulmo-s) var(--enj-bosque-ulmo-l))',
            light: 'hsl(var(--enj-bosque-ulmo-h) var(--enj-bosque-ulmo-s) 22%)',
            dark: 'hsl(var(--enj-bosque-ulmo-h) var(--enj-bosque-ulmo-s) 8%)',
          },
          miel: {
            DEFAULT: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l))',
            light: 'hsl(var(--enj-oro-miel-h) 70% 55%)',
            dark: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) 35%)',
            glow: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l) / 0.15)',
          },
          crema: {
            DEFAULT: 'hsl(var(--enj-crema-h) var(--enj-crema-s) var(--enj-crema-l))',
            warm: 'hsl(var(--enj-crema-h) var(--enj-crema-s) 90%)',
            dark: 'hsl(var(--enj-crema-h) 20% 80%)',
          },
        },
        fontFamily: {
          display: ['var(--font-display)', 'Georgia', 'serif'],
          sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
          mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        },
        fontSize: {
          'editorial-xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-widest)' }],
        },
        spacing: {
          '1': 'var(--space-1)',
          '2': 'var(--space-2)',
          '3': 'var(--space-3)',
          '4': 'var(--space-4)',
          '5': 'var(--space-5)',
          '6': 'var(--space-6)',
          '8': 'var(--space-8)',
          '10': 'var(--space-10)',
          '12': 'var(--space-12)',
          '16': 'var(--space-16)',
          '20': 'var(--space-20)',
          '24': 'var(--space-24)',
          '32': 'var(--space-32)',
        },
        borderRadius: {
          sm: 'var(--radius-sm)',
          md: 'var(--radius-md)',
          lg: 'var(--radius-lg)',
          xl: 'var(--radius-xl)',
          '2xl': 'var(--radius-2xl)',
          full: 'var(--radius-full)',
        },
        boxShadow: {
          sm: 'var(--shadow-sm)',
          md: 'var(--shadow-md)',
          lg: 'var(--shadow-lg)',
          xl: 'var(--shadow-xl)',
          glow: 'var(--shadow-glow)',
        },
        transitionTimingFunction: {
          elegant: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
        transitionDuration: {
          base: 'var(--transition-base)',
          spring: 'var(--transition-spring)',
          elegant: 'var(--transition-elegant)',
        },
        keyframes: {
          'fade-in': {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          'fade-out': {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' },
          },
          'zoom-in': {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          'zoom-out': {
            '0%': { opacity: '1', transform: 'scale(1)' },
            '100%': { opacity: '0', transform: 'scale(0.95)' },
          },
          'slide-in-from-top': {
            '0%': { transform: 'translateY(-8px)' },
            '100%': { transform: 'translateY(0)' },
          },
          'slide-in-from-bottom': {
            '0%': { transform: 'translateY(8px)' },
            '100%': { transform: 'translateY(0)' },
          },
          'slide-in-from-left': {
            '0%': { transform: 'translateX(-8px)' },
            '100%': { transform: 'translateX(0)' },
          },
          'slide-in-from-right': {
            '0%': { transform: 'translateX(8px)' },
            '100%': { transform: 'translateX(0)' },
          },
          'slide-out-to-top': {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(-8px)' },
          },
          'slide-out-to-bottom': {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(8px)' },
          },
          'slide-out-to-left': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-8px)' },
          },
          'slide-out-to-right': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(8px)' },
          },
          shimmer: {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' },
          },
        },
        animation: {
          'fade-in': 'fade-in 0.3s ease-in-out',
          'fade-out': 'fade-out 0.3s ease-in-out',
          'zoom-in': 'zoom-in 0.2s ease-out',
          'zoom-out': 'zoom-out 0.2s ease-in',
          'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
          'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out',
          'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
          'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
          'slide-out-to-top': 'slide-out-to-top 0.2s ease-in',
          'slide-out-to-bottom': 'slide-out-to-bottom 0.2s ease-in',
          'slide-out-to-left': 'slide-out-to-left 0.2s ease-in',
          'slide-out-to-right': 'slide-out-to-right 0.2s ease-in',
          shimmer: 'shimmer 2s linear infinite',
        },
        ...overrides,
      },
    },
  };
}

export const enjambrePreset = createEnjambrePreset();

/** Rutas de content para que Tailwind genere clases de `@enjambre/ui` en cada app. */
export const enjambreUiContent = [
  './node_modules/@enjambre/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
];