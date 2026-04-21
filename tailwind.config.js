/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#c2940a',
        'background-light': '#f8f8f5',
        'background-dark': '#221e10',
        'brutalist-black': '#1a1a1a',
        'card-bg': '#ffffff',
        'input-bg': '#fff9e6',
        'accent-red': '#ff4d4d',
      },
      fontFamily: {
        display: ['Lexend', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      boxShadow: {
        brutal: '6px 6px 0px 0px #c2940a',
        'brutal-dark': '6px 6px 0px 0px #1a1a1a',
        'brutal-hover': '2px 2px 0px 0px #1a1a1a',
      },
    },
  },
  plugins: [],
}
