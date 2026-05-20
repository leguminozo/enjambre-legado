/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: '#D4A017',
        background: '#000000',
        foreground: '#f5f0e8',
        bosque: '#0A3D2F',
      },
    },
  },
  plugins: [],
};

module.exports = config;
