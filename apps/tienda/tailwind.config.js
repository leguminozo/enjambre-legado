/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
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
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
        },
        success: 'hsl(var(--success))',
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
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
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
        'editorial-sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }],
        'editorial-base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'editorial-lg': ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        'editorial-xl': ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        'editorial-2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)' }],
        'editorial-3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        'editorial-4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tight)' }],
        'editorial-5xl': ['var(--text-5xl)', { lineHeight: '1', letterSpacing: 'var(--tracking-tight)' }],
        'editorial-7xl': ['var(--text-7xl)', { lineHeight: '1', letterSpacing: 'var(--tracking-tight)' }],
        'editorial-9xl': ['var(--text-9xl)', { lineHeight: '1', letterSpacing: 'var(--tracking-tight)' }],
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
        'glow-strong': 'var(--shadow-glow-strong)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        elegant: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
        spring: 'var(--transition-spring)',
        elegant: 'var(--transition-elegant)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l) / 0.3)' },
          '50%': { boxShadow: '0 0 0 10px hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l) / 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
