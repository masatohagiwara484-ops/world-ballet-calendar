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
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Art Deco Palette (Day 5)
        background: "#2a2a3e",
        "surface-elevated": "#3a3a4e",
        gold: "#D4AF37",
        "gold-muted": "#C9A961",
        cream: "#E8D5B7",
        text: {
          primary: "#FAFAF8",
          secondary: "rgba(255,255,255,0.70)",
          tertiary: "rgba(232,213,183,0.60)",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(212, 175, 55, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
