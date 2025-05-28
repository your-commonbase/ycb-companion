import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // add some nice font combos
      fontFamily: {
        sans: ['Roboto Mono', 'system-ui', 'sans-serif'],
        serif: ['Roboto Slab', 'serif'],
        mono: ['Roboto Mono', 'monospace'],
        besley: ['Besley', 'serif'],
      },
      // keep existing color vars; add a new brand/accent/neutral set
      colors: {
        blue: {
          light: '#AECBFA',
          DEFAULT: '#4285F4',
          dark: '#3367D6',
        },
        pink: {
          light: '#FFE3ED',
          DEFAULT: '#FF659F',
          dark: '#E14B84',
        },
        gray: {
          light: '#F3F4F6',
          DEFAULT: '#9CA3AF',
          dark: '#4B5563',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      // keep your border radius, just in case
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // add some convenient spacing values
      spacing: {
        '18': '4.5rem',
        '28': '7rem',
      },
      boxShadow: {
        'custom-selected':
          '10px 10px 10px 0px rgba(174, 174, 192, 0.20) inset, -10px -10px 10px 0px rgba(255, 255, 255, 0.70) inset',
        'custom-unselected':
          '10px 10px 30px 0px rgba(174, 174, 192, 0.40), -10px -10px 10px 0px #FFF',
        'slider-track-shadow':
          '10px 10px 10px 0px rgba(174, 174, 192, 0.20) inset, -10px -10px 10px 0px rgba(255, 255, 255, 0.70) inset',
        'slider-thumb-shadow':
          '2px 2px 15px 0px rgba(174, 174, 192, 0.40), -2px -2px 5px 0px #FFF',
      },
      backgroundImage: {
        'custom-selected': 'linear-gradient(135deg, #EBEBEB 0%, #FFF 100%)',
        'custom-unselected': 'linear-gradient(315deg, #FFF 0%, #EBEBEB 100%)',
        'slider-track': 'linear-gradient(135deg, #EBEBEB 0%, #FFF 100%)',
        'slider-thumb': 'linear-gradient(315deg, #FFF 0%, #EBEBEB 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default config;
