/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D4AA',
          dark: '#00B890',
          light: '#33DDBB',
        },
        secondary: {
          DEFAULT: '#B4FF39',
          dark: '#9FE020',
          light: '#C5FF5C',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          light: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}
