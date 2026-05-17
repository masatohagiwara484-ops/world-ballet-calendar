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
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "surface-alt": "#FAF8F5",
        gold: "#D4AF37",
        "gold-muted": "#B8941F",
        navy: "#1B2A4A",
        forest: "#1A3A2E",
        purple: "#2D1B4E",
        text: {
          primary: "#1A1A1A",
          secondary: "rgba(26,26,26,0.6)",
          tertiary: "rgba(26,26,26,0.4)",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(212, 175, 55, 0.4)",
        "card": "0 2px 16px rgba(26,26,26,0.08), 0 1px 4px rgba(26,26,26,0.04)",
        "card-hover": "0 8px 40px rgba(26,26,26,0.14), 0 2px 8px rgba(26,26,26,0.06)",
      },
      backgroundImage: {
        "gradient-warm": "linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)",
        "gradient-hero": "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, #FFFFFF 0%, #F5F0EA 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
