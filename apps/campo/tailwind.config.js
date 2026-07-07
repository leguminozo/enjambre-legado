const { enjambrePreset, enjambreUiContent } = require('@enjambre/ui/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [enjambrePreset],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', ...enjambreUiContent],
  plugins: [],
};
