/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': {
          light: '#A855F7', // purple-500
          DEFAULT: '#9333EA', // purple-600
          dark: '#7E22CE', // purple-700
        },
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(120deg, #1e0c42 0%, #4a1f6e 100%)',
      },
      backdropBlur: {
        'xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }
    },
  },
  plugins: [],
}