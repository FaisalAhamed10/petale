/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      colors: {
        ivory: '#F8F4EC',
        cream: '#F2EBDF',
        blush: '#EBC9C9',
        rose: '#D98E9C',
        burgundy: '#542735',
        wine: '#3A1822',
        botanical: '#687D60',
        champagne: '#C5A779',
        ink: '#2A1A1F',
      },
      fontFamily: {
        display: ['Cormorant', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { luxe: '0.34em', wideish: '0.18em' },
      transitionTimingFunction: { silk: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
}
