import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["var(--font-cairo)", "Arial", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary:   "#E8622A",
          secondary: "#C8922A",
          accent:    "#FF4500",
        },
        warm: {
          950: "#0F0A05",
          900: "#1A1208",
          800: "#2A1E10",
          700: "#3D2C18",
          600: "#5C4030",
          400: "#A08060",
          200: "#D4B896",
          100: "#F5E6C8",
        },
      },
      animation: {
        "ember-rise":    "ember-rise var(--ember-duration, 2s) ease-out var(--ember-delay, 0s) infinite",
        "flame-flicker": "flame-flicker 2.5s ease-in-out infinite",
        "glow-pulse":    "glow-pulse 3s ease-in-out infinite",
      },
      keyframes: {
        "ember-rise": {
          "0%":   { transform: "translateY(0) translateX(0) scale(1)", opacity: "0.9" },
          "60%":  { opacity: "0.5" },
          "100%": { transform: "translateY(-120px) translateX(var(--ember-drift, 20px)) scale(0.1)", opacity: "0" },
        },
        "flame-flicker": {
          "0%, 100%": { transform: "scaleY(1) scaleX(1) rotate(-1deg)" },
          "25%":      { transform: "scaleY(1.07) scaleX(0.97) rotate(1.5deg)" },
          "75%":      { transform: "scaleY(0.95) scaleX(1.03) rotate(-1.5deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%":      { opacity: "0.65", transform: "scale(1.08)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
