import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 48px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        ink: {
          950: '#09111f',
          900: '#102030',
        },
        sand: {
          50: '#f7f4ee',
          100: '#ede6da',
        },
        sea: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0f766e',
        },
        ember: {
          400: '#fb923c',
          500: '#f97316',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
