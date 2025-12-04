/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00796B',
        'primary-light': '#80CBC4',
        background: '#FDFBF7',
        surface: '#FFFFFF',
        'text-primary': '#212121',
        'text-secondary': '#757575',
      },
    },
  },
  plugins: [],
}
