/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './contexts/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
    './types/**/*.{ts,tsx,js,jsx}',
    './constants/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#F9A826',
        'brand-primary-dark': '#DD8C00',
        'brand-secondary': '#2D2D2D',
        'brand-accent': '#E63946',
        'brand-surface': '#FFFFFF',
        'status-ready': '#2E7D32',
        'status-cooking': '#F9A826',
        'status-waiting': '#1976D2',
        'status-paid': '#388E3C',
        'status-unpaid': '#D32F2F'
      }
    }
  },
  plugins: []
};
