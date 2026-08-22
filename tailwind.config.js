/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        serif: ['var(--font-heading)', 'serif'],
        times: ['"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#8A63D2', 
          50: '#f4f1fa',
          100: '#e8e2f5',
          200: '#d1c5eb',
          300: '#b9a8e0',
          400: '#a28ad6',
          500: '#8a63d2',  
          600: '#7554b3',
          700: '#5c428c',
          800: '#453269',
          900: '#2e2146',
          950: '#171123',
        },
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        marquee: "marquee var(--duration) infinite linear",
        "marquee-vertical": "marquee-vertical var(--duration) infinite linear",
      },
    },
  },
  plugins: [],
};