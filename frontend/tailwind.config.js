/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        card: '#1a1a1a',
        primary: '#10b981', // Tailwind Emerald 500
        danger: '#ef4444', // Tailwind Red 500
      }
    },
  },
  plugins: [],
}
