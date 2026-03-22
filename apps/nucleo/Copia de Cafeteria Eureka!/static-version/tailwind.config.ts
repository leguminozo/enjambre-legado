import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'eureka-theme': '#1a1a1a',
        'eureka-text-secondary': '#a0a0a0',
        'eureka-text-muted': '#666666',
      },
      fontFamily: {
        'eureka': ['Inter', 'sans-serif'],
      },
      spacing: {
        'eureka-spacing': '2rem',
        'eureka-spacing-large': '4rem',
      },
      maxWidth: {
        'eureka-container': '1200px',
      },
      fontSize: {
        'eureka-responsive-text': 'clamp(2rem, 5vw, 4rem)',
        'eureka-title': 'clamp(2.5rem, 6vw, 5rem)',
      },
      borderRadius: {
        'eureka-rounded': '1rem',
      },
      transitionProperty: {
        'eureka-transition': 'all 0.3s ease',
        'eureka-hover-scale': 'transform 0.2s ease',
      },
      scale: {
        'eureka-hover-scale': '1.05',
      },
    },
  },
  plugins: [],
};

export default config;
