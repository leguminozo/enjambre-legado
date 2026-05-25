/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-existencial)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-datos)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

module.exports = config;
