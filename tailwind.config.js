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
        'card-lg':'0 8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'slide-up':       'slide-up 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down':     'slide-down 0.2s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
        'scale-in':       'scale-in 0.15s ease-out',
        'count-bounce':   'count-bounce 0.3s ease-out',
        'bar-grow':       'bar-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'ring-pulse':     'ring-pulse 2s ease-in-out infinite',
        'fab-breathe':    'fab-breathe 2.8s ease-in-out infinite',
        'toast-drain':    'toast-drain 3s linear forwards',
        'shimmer':        'shimmer 1.5s linear infinite',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        'count-bounce': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        'bar-grow': {
          from: { width: '0' },
        },
        'ring-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.3)', opacity: '0.6' },
        },
        'fab-breathe': {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(79,70,229,0.5), 0 0 0 0 rgba(79,70,229,0.3)' },
          '50%':      { boxShadow: '0 8px 30px rgba(79,70,229,0.7), 0 0 0 8px rgba(79,70,229,0)' },
        },
        'toast-drain': {
          from: { width: '100%' },
          to:   { width: '0%' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
};
