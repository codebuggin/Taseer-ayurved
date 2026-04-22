/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        drama: ['"Playfair Display"', 'serif'],
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        'theme-bg-primary': '#ffffff',
        'theme-bg-secondary': '#f8faf8',
        'theme-bg-deep': '#0d5c3a',
        'theme-bg-card': '#f8faf8',
        'theme-text-primary': '#0d1f14',
        'theme-text-muted': '#6b7c6e',
        'theme-text-inverse': '#ffffff',
        'theme-accent': '#e8a500',
        'theme-accent-hover': '#cf9300',
      },
      borderColor: {
        'theme': '#e0ede5',
      },
      boxShadow: {
        'theme': '0 8px 40px rgba(13,92,58,0.12)',
      }
    },
  },
  plugins: [],
}
