/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aej: {
          orange: '#E05A10',
          'orange-hover': '#C84C08',
          'orange-light': '#FFF4ED',
          green: '#008751',
          'green-dark': '#00663D',
          'green-light': '#E6F4ED',
          dark: '#0F172A',
          slate: '#1E293B',
          muted: '#64748B',
          card: '#FFFFFF',
          gold: '#D97706'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'aej-soft': '0 10px 30px -10px rgba(224, 90, 16, 0.15)',
        'aej-card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'aej-glow': '0 0 25px rgba(0, 135, 81, 0.2)'
      }
    },
  },
  plugins: [],
}
