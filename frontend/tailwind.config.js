/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Calistoga', 'serif'],
        sans:    ['Inter', 'sans-serif'],
      },
      colors: {
        'electric': { DEFAULT: '#2563eb', 50: '#eff6ff', 600: '#2563eb', 700: '#1d4ed8' },
      },
      backgroundImage: {
        'electric': 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #06b6d4 100%)',
        'electric-subtle': 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
