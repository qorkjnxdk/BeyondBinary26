import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#fef2f2',   // Softest rose-red
          100: '#fee2e2',  // Very light rose
          200: '#fecaca',  // Light rose
          300: '#fca5a5',  // Soft rose
          400: '#fb7185',  // Rose (hero color - ~40%)
          500: '#f43f5e',  // Rose-red
          600: '#e11d48',  // Medium rose-red
          700: '#be123c',  // Deeper rose-red
          800: '#9f1239',  // Rich rose-red
          900: '#881337',  // Deep rose-red
        },
        accent: {
          50: '#fdf2f8',   // Softest pink
          100: '#fce7f3',  // Very light pink
          200: '#fbcfe8',  // Light pink
          300: '#f9a8d4',  // Soft pink
          400: '#f472b6',  // Pastel pink
          500: '#ec4899',  // Pink
          600: '#db2777',  // Medium pink
          700: '#be185d',  // Deeper pink
          800: '#9f1239',  // Rich pink-red
          900: '#831843',  // Deep pink-red
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(251, 113, 133, 0.08), 0 10px 20px -2px rgba(244, 63, 94, 0.05)',
        'glow': '0 0 20px rgba(251, 113, 133, 0.25)',
        'rose': '0 4px 14px 0 rgba(251, 113, 133, 0.15)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;

