/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Palette Premium
        sage: {
          DEFAULT: '#6A8A82',
          50: '#E8EFED',
          100: '#D5E3E0',
          200: '#B7CFC9',
          300: '#99BBB2',
          400: '#82A59D',
          500: '#6A8A82',
          600: '#547169',
          700: '#3F554F',
          800: '#2A3935',
          900: '#151D1B',
        },
        copper: {
          DEFAULT: '#B87333',
          50: '#F5E8DD',
          100: '#EDDCC8',
          200: '#E0C4A0',
          300: '#D3AC78',
          400: '#C59050',
          500: '#B87333',
          600: '#935C29',
          700: '#6E451F',
          800: '#492E14',
          900: '#24170A',
        },
        offwhite: '#F0F3F2',
        lightgray: '#E8ECEC',
        deepblack: '#191919',
      },
    },
  },
  plugins: [],
}
