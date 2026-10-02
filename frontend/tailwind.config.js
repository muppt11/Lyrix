/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // Neon accent palette, namespaced under "neon" so it doesn't
        // override Tailwind's default red/green/blue/etc. scales.
        neon: {
          cyan: '#00ffff',
          'cyan-dim': '#009999',
          blue: '#0080ff',
          'blue-dim': '#004d99',
          purple: '#8000ff',
          'purple-dim': '#4d0099',
          pink: '#ff0080',
          'pink-dim': '#99004d',
          red: '#ff0040',
          'red-dim': '#990026',
          orange: '#ff8000',
          'orange-dim': '#994d00',
          yellow: '#ffff00',
          'yellow-dim': '#999900',
          green: '#00ff80',
          'green-dim': '#00994d',
        },
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'Orbitron', 'monospace'],
        exo: ['var(--font-exo)', 'Exo 2', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        scan: 'scan 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.6)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'cyber-glow': '0 0 30px rgba(0, 255, 255, 0.2)',
        'cyber-glow-lg': '0 0 50px rgba(0, 255, 255, 0.3)',
        'cyber-glow-xl': '0 0 80px rgba(0, 255, 255, 0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function ({ addUtilities }) {
      addUtilities({
        '.text-shadow-glow': {
          textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        },
        '.matrix-bg': {
          background:
            'radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 0, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(128, 0, 255, 0.05) 0%, transparent 50%)',
        },
        '.cyber-grid': {
          backgroundImage:
            'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: 'center center',
        },
        '.scan-line': {
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
          animation: 'scan 3s linear infinite',
        },
      });
    },
  ],
};
