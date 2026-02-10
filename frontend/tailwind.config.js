/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode background
        light: {
          50: "#FFFFFF",
          100: "#FAFAF9",
          200: "#F5F5F4",
          300: "#E7E5E4",
          400: "#D6D3D1",
        },
        // Primary - Warm Orange/Amber
        primary: {
          50: "#FFF8F1",
          100: "#FEECDC",
          200: "#FCD9BD",
          300: "#FDBA8C",
          400: "#FF8A4C",
          500: "#FF6B1A",
          600: "#E85D04",
          700: "#C24914",
          800: "#9A3412",
          900: "#7C2D12",
        },
        // Secondary - Warm Gray/Stone
        secondary: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // Dark background colors - Warm Dark
        dark: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#3D3A37",
          800: "#282624",
          900: "#1A1918",
          950: "#0F0E0D",
        },
        // Success - Warm Green
        success: {
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
        },
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        body: ["Exo 2", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(255, 107, 26, 0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 107, 26, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};
