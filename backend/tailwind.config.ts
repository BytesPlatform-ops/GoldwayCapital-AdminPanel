import type { Config } from "tailwindcss";

/**
 * Goldway Capital brand system.
 * Navy + gold + warm neutrals. Senior-friendly: large type, high contrast.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0f2440",
          50: "#eef2f8",
          100: "#d3ddec",
          600: "#16345c",
          700: "#0f2440",
          800: "#0a1a30",
          900: "#061020",
        },
        gold: {
          DEFAULT: "#c8a24a",
          50: "#fbf6e9",
          100: "#f3e6bf",
          500: "#c8a24a",
          600: "#a8843a",
          700: "#86682c",
        },
        cream: "#faf8f3",
        ink: "#1f2733",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Senior-friendly base scale — everything is one notch larger than typical.
        base: ["1.0625rem", { lineHeight: "1.65" }],
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};

export default config;
