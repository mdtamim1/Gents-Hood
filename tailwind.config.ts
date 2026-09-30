import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        cream: {
          DEFAULT: 'var(--cream)',
          soft: 'var(--cream-soft)',
        },
        line: {
          DEFAULT: 'var(--line)',
          inv: 'var(--line-inv)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          inv: 'var(--muted-inv)',
        },
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['var(--font-inter-tight)', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'Cinzel', 'serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest: '0.28em',
        looser: '0.14em',
        loose: '0.12em',
      },
    },
  },
  plugins: [],
};

export default config;
