/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        act: {
          green: '#639922',
          dark: '#3B6D11',
          light: '#EAF3DE',
          border: '#C0DD97',
        }
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
