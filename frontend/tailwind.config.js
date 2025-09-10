/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        primary: {
          DEFAULT: "hsl(222.2 47.4% 11.2%)",
          foreground: "hsl(210 40% 98%)"
        },
        gray: {
          50: "hsl(210 40% 98%)",
          100: "hsl(210 40% 96%)",
          200: "hsl(214.3 31.8% 91.4%)",
          300: "hsl(213 27% 84%)",
          400: "hsl(215 13.8% 34.1%)",
          500: "hsl(215 25.3% 26.9%)",
          600: "hsl(215 19.3% 16.3%)",
          700: "hsl(217.2 32.6% 17.5%)",
          800: "hsl(215 28.8% 6.9%)",
          900: "hsl(221.2 39.3% 11%)",
          950: "hsl(224 71.4% 4.1%)"
        }
      }
    }
  },
  plugins: [],
}