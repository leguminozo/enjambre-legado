/** @type {import('tailwindcss').Config} */
const { enjambrePreset } = require('@enjambre/ui/tailwind-preset');

const config = {
  presets: [enjambrePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@enjambre/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

module.exports = config;
