/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          primary: '#2E7D5B',
          dark: '#205B43',
          light: '#EAF4EE',
          bg: '#F8FAF8',
          text: '#26332D',
          muted: '#718078',
          border: '#E3EAE5',
          warning: '#E9A23B',
          error: '#D9534F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

