/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#06D6A0',
          blue: '#118AB2',
          red: '#EF476F',
          yellow: '#FFD166',
          dark: '#073B4C',
          purple: '#8338EC',
        },
      },
    },
  },
  plugins: [],
};
