/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        rec: {
          dark: '#0B132B',
          cardDark: '#1C2541',
          borderDark: '#3A506B',
        }
      }
    },
  },
  plugins: [],
}

