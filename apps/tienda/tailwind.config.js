const { enjambrePreset, enjambreUiContent } = require('@enjambre/ui/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [enjambrePreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    ...enjambreUiContent,
  ],
  plugins: [],
};
