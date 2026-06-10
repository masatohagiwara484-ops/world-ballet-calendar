import type { Config } from "tailwindcss";

/**
 * Liquid Glass × Champagne Noir — design tokens.
 * Dark opera-house-at-night palette executed in Apple's Liquid Glass language.
 * Font CSS variables --font-serif (Italiana) / --font-sans (Manrope) are kept
 * so existing `font-serif` / `font-sans` utilities map to the new typefaces.
 */
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
        display: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Stage — warm near-blacks (never pure #000)
        stage: {
          DEFAULT: "#0A0908",
          base: "#0A0908",
          elevated: "#121110",
          raised: "#1A1816",
          deep: "#060504",
        },
        // Champagne gold
        gold: {
          DEFAULT: "#D4AF37",
          primary: "#D4AF37",
          bright: "#E8C96A",
          pale: "#F5E7C1",
          muted: "#9A7E2C",
        },
        // Warm ivory text family
        ivory: {
          DEFAULT: "#F5F1E8",
          primary: "#F5F1E8",
          secondary: "rgba(245,241,232,0.62)",
          tertiary: "rgba(245,241,232,0.38)",
        },
        // Deep accent washes for gradient auras
        wine: "#4A1F2E",
        midnight: "#1B2A4A",

        // Back-compat aliases (old token names still referenced in some pages)
        background: "#0A0908",
        surface: "#121110",
        "surface-alt": "#1A1816",
        navy: "#1B2A4A",
        text: {
          primary: "#F5F1E8",
          secondary: "rgba(245,241,232,0.62)",
          tertiary: "rgba(245,241,232,0.38)",
        },
      },
      boxShadow: {
        // Liquid glass — large soft shadow + inner specular top edge
        glass:
          "0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
        "glass-hover":
          "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.20), inset 0 1px 0 rgba(255,255,255,0.22)",
        "glow-gold": "0 0 40px rgba(212,175,55,0.15)",
        "glow-gold-strong": "0 0 56px rgba(212,175,55,0.28)",
        // Back-compat: card shadows remapped to the dark glass look
        card: "0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)",
        "card-hover":
          "0 22px 60px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.16)",
        "gold-glow": "0 0 40px rgba(212,175,55,0.15)",
      },
      backdropBlur: {
        glass: "22px",
        "glass-lg": "28px",
      },
      backdropSaturate: {
        glass: "1.4",
      },
      borderRadius: {
        glass: "20px",
        "glass-lg": "24px",
        "glass-sm": "16px",
      },
      backgroundImage: {
        "gradient-gold":
          "linear-gradient(135deg, #F5E7C1 0%, #E8C96A 40%, #D4AF37 100%)",
        // Back-compat gradient tokens remapped to deep glass-dark variants
        "gradient-warm":
          "linear-gradient(135deg, #121110 0%, #0A0908 100%)",
        "gradient-hero":
          "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.10) 0%, rgba(10,9,8,0) 60%), linear-gradient(180deg, #0A0908 0%, #060504 100%)",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fadeIn 0.5s ease both",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
