/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'accent': '0 4px 24px rgba(37, 99, 235, 0.25)',
        'card':   '0 1px 4px rgba(0,0,0,0.06)',
      },
      animation: {
        'slide-up':   'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'fade-in':    'fade-in 0.2s ease-out',
        'scale-in':   'scale-in 0.15s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: 0 },
          to:   { transform: 'translateY(0)',     opacity: 1 },
        },
        'fade-in': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: 0 },
          to:   { transform: 'scale(1)',    opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
