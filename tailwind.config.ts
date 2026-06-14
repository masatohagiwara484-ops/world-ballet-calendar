import type { Config } from "tailwindcss";

/**
 * White Gradient Luxury — design tokens.
 * A bright, gallery-lit luxury palette (warm whites + champagne gold + jewel
 * accents) executed in a soft "frosted glass on paper" language.
 *
 * IMPORTANT — semantic remap for a clean light migration:
 *   `stage.*`  → warm WHITE surfaces  (so `bg-stage*` reads light)
 *   `ivory.*`  → dark INK text        (so `text-ivory*` reads as readable ink)
 *   `gold.*`   → champagne accents    (+ `gold.deep` for text-on-white contrast)
 * Existing components keep their class names but render correctly on white.
 *
 * Fonts: --font-serif = Cormorant Garamond (display) / --font-sans = Manrope (UI).
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
        // Stage — warm whites (remapped: backgrounds now read light)
        stage: {
          DEFAULT: "#FAFAF8",
          base: "#FAFAF8",
          elevated: "#FFFFFF",
          raised: "#FAF8F5",
          deep: "#F1ECE4",
        },
        // Champagne gold
        gold: {
          DEFAULT: "#D4AF37",
          primary: "#D4AF37",
          bright: "#E8C96A",
          pale: "#FBF4DF",
          muted: "#B89B52",
          deep: "#A8842A", // accessible gold for small text on white
          ink: "#8A6D1A",
        },
        // Ink text family (remapped from "ivory" → dark, so text-ivory reads)
        ivory: {
          DEFAULT: "#1A1A1A",
          primary: "#1A1A1A",
          secondary: "rgba(26,26,26,0.62)",
          tertiary: "rgba(26,26,26,0.42)",
        },
        // Jewel accent washes
        wine: "#4A1F2E",
        midnight: "#1B2A4A",
        navy: "#1B2A4A",
        forest: "#1A3A2E",
        plum: "#2D1B4E",

        // Back-compat aliases (old token names still referenced in some pages)
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "surface-alt": "#FAF8F5",
        line: "rgba(26,22,15,0.10)",
        text: {
          primary: "#1A1A1A",
          secondary: "rgba(26,26,26,0.62)",
          tertiary: "rgba(26,26,26,0.42)",
        },
      },
      boxShadow: {
        // Soft "frosted glass on paper" — light, diffuse shadow + white top edge
        glass:
          "0 16px 48px rgba(26,22,15,0.10), inset 0 1px 0 rgba(255,255,255,0.90)",
        "glass-hover":
          "0 24px 64px rgba(26,22,15,0.14), 0 0 0 1px rgba(212,175,55,0.30), inset 0 1px 0 rgba(255,255,255,0.95)",
        "glow-gold": "0 0 40px rgba(212,175,55,0.20)",
        "glow-gold-strong": "0 0 56px rgba(212,175,55,0.32)",
        card: "0 12px 40px rgba(26,22,15,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
        "card-hover":
          "0 22px 60px rgba(26,22,15,0.13), inset 0 1px 0 rgba(255,255,255,0.95)",
        "gold-glow": "0 0 40px rgba(212,175,55,0.20)",
      },
      backdropBlur: {
        glass: "20px",
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
          "linear-gradient(135deg, #E8C96A 0%, #D4AF37 50%, #B8912E 100%)",
        "gradient-warm":
          "linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)",
        "gradient-hero":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, #FFFFFF 0%, #FAF6F0 100%)",
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
