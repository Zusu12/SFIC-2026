/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#0D1117',
          panel: '#161B22',
          surface: '#1C2128',
          border: '#30363D',
          text: '#E6EDF3',
          muted: '#8B949E',
          primary: '#238636',
          primaryHover: '#2EA043',
          link: '#58A6FF',
          error: '#F85149',
          success: '#3FB950',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        telugu: ['"Noto Sans Telugu"', 'Gautami', 'sans-serif'],
      },
      borderRadius: {
        panel: '8px',
        btn: '6px',
      },
    },
  },
  plugins: [],
}
