/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0b0d10',
          panel: '#14171c',
          border: '#22262e',
          accent: '#7c5cff',
          accent2: '#4be3c7'
        }
      }
    }
  },
  plugins: []
};
