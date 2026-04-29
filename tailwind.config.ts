import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teak: {
          deep: '#2B1810',
          DEFAULT: '#3A2418',
          warm: '#5C3A26',
        },
        cream: {
          DEFAULT: '#F5EFE6',
          warm: '#EDE3D2',
        },
        paper: '#FBF8F2',
        gold: {
          DEFAULT: '#C9A961',
          deep: '#A8882F',
        },
        ink: '#1A0F08',
        muted: '#8C7A6B',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-inter-tight)', 'Inter Tight', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ken-burns': 'kenBurns 12s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(110%)' },
          to: { transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        kenBurns: {
          from: { transform: 'scale(1.05)' },
          to: { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
