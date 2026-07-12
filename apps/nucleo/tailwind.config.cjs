/** @type {import('tailwindcss').Config} */
const { enjambrePreset, enjambreUiContent } = require('@enjambre/ui/tailwind-preset');

const config = {
  presets: [enjambrePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/calendar/src/**/*.{js,ts,jsx,tsx,mdx}',
    ...enjambreUiContent,
  ],
  theme: {
    extend: {
      colors: {
        'oro-miel': {
          DEFAULT: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l))',
          light: 'hsl(var(--enj-oro-miel-h) 70% 55%)',
          dark: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) 35%)',
          glow: 'hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l) / 0.15)',
        },
        'negro-tinta': 'hsl(var(--enj-negro-tinta-h) var(--enj-negro-tinta-s) var(--enj-negro-tinta-l))',
        'crema-natural': 'hsl(var(--enj-crema-h) var(--enj-crema-s) var(--enj-crema-l))',
        'salud-optima': 'hsl(var(--enj-verde-h) var(--enj-verde-s) var(--enj-verde-l))',
        'salud-atencion': 'hsl(var(--enj-amber-h) var(--enj-amber-s) var(--enj-amber-l))',
        'salud-riesgo': 'hsl(var(--enj-rojo-h) var(--enj-rojo-s) var(--enj-rojo-l))',
      },
      fontFamily: {
        existencial: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        datos: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

module.exports = config;
