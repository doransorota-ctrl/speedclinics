const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FDF8F6",
          100: "#F9EDE8",
          200: "#F2DCD3",
          300: "#E8C9BC",
          400: "#DEB5A5",
          500: "#C9998A",
          600: "#B07D6E",
          700: "#8F6358",
          800: "#6E4C44",
          900: "#4D3530",
        },
        accent: {
          50: "#FDFBF3",
          100: "#F9F3E0",
          200: "#F0E4C3",
          300: "#E3D1A0",
          400: "#D4BC7D",
          500: "#C5A55A",
          600: "#A88B42",
          700: "#8A7035",
          800: "#6C5728",
          900: "#4E3F1E",
        },
        whatsapp: {
          light: "#dcf8c6",
          dark: "#075e54",
          green: "#25d366",
          bg: "#e5ddd5",
          bubble: "#dcf8c6",
          incoming: "#ffffff",
        },
        surface: {
          50: "#FDFBF7",
          100: "#F7F4EF",
          200: "#EDE9E3",
          300: "#D8D3CC",
          400: "#A9A29B",
          500: "#7A746E",
          600: "#5A5550",
          700: "#3D3935",
          800: "#272422",
          900: "#1A1816",
          950: "#0F0E0D",
        },
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: [
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
        logo: [
          "Bodoni Moda",
          "Didot",
          "Georgia",
          "serif",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        typing: "typing 1.5s steps(3) infinite",
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%": { content: "''" },
          "33%": { content: "'.'" },
          "66%": { content: "'..'" },
          "100%": { content: "'...'" },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
