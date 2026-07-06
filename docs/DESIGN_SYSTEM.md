# Design System — Liquid Glass on White Gradient Luxury

The visual language of **première**: a **Liquid Glass** surface language
(translucency, backdrop blur, refraction-feel borders, specular top highlights,
layered depth) rendered on the **White Gradient Luxury** palette — a gallery-lit
season brochure. Quality is defined by our own charter (CLAUDE.md §2), not by
reference to other brands.

> **Current palette source of truth: `tailwind.config.ts`.** The token *names*
> below date from the earlier Champagne-Noir (dark) phase and were kept for
> compatibility, but they now *render light*: `stage.*` = warm white surfaces,
> `ivory.*` = dark ink text, `gold.*` = champagne accents (+ `gold.deep` for
> small text on white). Read the hex values in this file's dark-palette tables
> as historical; the glass/motion/typography guidance remains current.

---

## 1. Palette

### Stage (warm near-blacks — never pure `#000`)
| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Base | `#0A0908` | `bg-stage` / `bg-stage-base` | Page background |
| Elevated | `#121110` | `bg-stage-elevated` | Raised opaque surfaces |
| Raised | `#1A1816` | `bg-stage-raised` | Highest opaque surfaces |
| Deep | `#060504` | `bg-stage-deep` | Wells, recesses |

### Champagne Gold
| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Primary | `#D4AF37` | `text-gold` / `bg-gold` | Accents, active state, CTAs |
| Bright | `#E8C96A` | `text-gold-bright` | Hover, mid gradient stop |
| Pale | `#F5E7C1` | `text-gold-pale` | Highlight, top gradient stop |
| Muted | `#9A7E2C` | `text-gold-muted` | Subdued gold detail |

### Ivory text (warm off-white)
| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| Primary | `#F5F1E8` | `text-ivory` | Headlines, primary copy |
| Secondary | `rgba(245,241,232,0.62)` | `text-ivory/60`–`/62` | Body |
| Tertiary | `rgba(245,241,232,0.38)` | `text-ivory/38`–`/40` | Metadata, labels |

> Contrast: ivory `0.62` on `#0A0908` passes WCAG AA. Do not drop body text
> below `0.55` alpha on stage backgrounds.

### Deep accent washes (gradient auras only — not surfaces)
| Token | Hex | Tailwind |
|-------|-----|----------|
| Wine / Bordeaux | `#4A1F2E` | `text-wine` / `bg-wine` |
| Midnight Navy | `#1B2A4A` | `text-midnight` / `bg-midnight` / `navy` |

---

## 2. Typography

- **Display / headlines:** `Italiana` (serif), single weight 400. Build
  hierarchy with **size, letter-spacing, and case** — never font weight.
  - Tailwind: `font-serif` (or `font-display`). Labels: `uppercase tracking-[0.2em]+`.
- **Body / UI:** `Manrope`, weights 300–700. Tailwind: `font-sans` (default).

Loaded in `src/app/layout.tsx` via `next/font/google`, exposed as
`--font-serif` (Italiana) and `--font-sans` (Manrope).

### Scale (suggested)
| Role | Class |
|------|-------|
| Hero | `font-serif text-6xl lg:text-7xl tracking-[0.04em]` |
| H2 | `font-serif text-4xl md:text-5xl` |
| H3 | `font-serif text-xl md:text-2xl` |
| Label | `font-sans text-[11px] tracking-[0.22em] uppercase` |
| Body | `font-sans text-sm/base leading-relaxed text-ivory/62` |

Champagne gradient headline: add `.text-gradient-gold`.

---

## 3. Liquid Glass recipes

### Core glass surface — `.glass-panel`
```css
background-color: rgba(255,255,255,0.05);
backdrop-filter: blur(22px) saturate(140%);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 20px;
box-shadow: 0 16px 48px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.18); /* specular top edge */
```

### Interactive card — `.glass-card`
Same as panel, plus hover:
```css
:hover {
  background-color: rgba(255,255,255,0.08);
  border-color: rgba(212,175,55,0.35);   /* gold-tinted */
  transform: translateY(-2px);
  box-shadow: 0 24px 64px rgba(0,0,0,0.55),
              0 0 0 1px rgba(212,175,55,0.18),
              inset 0 1px 0 rgba(255,255,255,0.22);
}
transition: 400ms ease; /* all glass transitions 300–500ms */
```

### Pill — `.glass-pill`
Compact glass for nav / chips / toggles (radius `9999px`, blur 20px).

### Specular highlight — `.specular`
Adds a gradient border-top sheen via `::before` (use on panels/cards/nav for
the refraction-feel top edge). Stacks on top of `.glass-panel`/`.glass-card`.

### Gold glow — `.glow-gold`
`box-shadow: 0 0 40px rgba(212,175,55,0.15)` for emphasis. Stronger token:
`shadow-glow-gold-strong`.

### Gradient text — `.text-gradient-gold`
Champagne `#F5E7C1 → #E8C96A → #D4AF37` clipped to text. Hero wordmarks.

### Tailwind shorthands
`shadow-glass`, `shadow-glass-hover`, `shadow-glow-gold`,
`backdrop-blur-glass`, `rounded-glass`. Back-compat: `shadow-card` /
`shadow-card-hover` are remapped to the dark glass look.

---

## 4. Atmosphere

`body` carries the near-black base plus three **fixed radial auras** (gold,
wine, navy at 10–18% opacity) so glass has something to refract, and a
**film-grain noise overlay** (`body::after`, opacity 0.025). Opt sections into
their own grain with `.noise-overlay`.

Radius: glass `16–24px` (`rounded-glass-sm/glass/glass-lg`). Borders:
`border-white/[0.10]`→`/[0.16]`; gold-tinted on active/hover
`border-[rgba(212,175,55,0.35)]`. Never use gray palette borders.

---

## 5. Motion

- Transitions **300–500ms ease**. Entrance reveals OK; never block content.
- `animate-fade-in-up` (0.7s), `animate-fade-in` (0.5s), `.reveal`/`.reveal.visible`.
- Hover lift on glass = `translateY(-2px)` + gold border + deeper shadow.

---

## 6. Component usage rules

- **CTAs (primary):** `bg-gold` background + `text-stage` dark text. Unmistakable.
- **Secondary / affiliate:** glass-pill or `border border-ivory/40`, never competing with gold.
- **Cards / panels:** `.glass-card` (interactive) or `.glass-panel` (static), add `.specular`.
- **Nav:** floating glass pill detached from top (`mt-4 mx-auto max-w`), blur intensifies on scroll, gold active underline.
- **Focus:** gold `focus-visible` ring (global). Keep it — accessibility.
- **Entity art surfaces:** use `gradientFor()` / `monogram()` from
  `src/components/shared/design.ts` — deep glass-dark washes, ivory monogram on top.

---

## 7. Files

| File | Role |
|------|------|
| `tailwind.config.ts` | Tokens: colors, fonts, shadows, radius, blur, animations |
| `src/app/globals.css` | Base atmosphere + `.glass-*`, `.specular`, `.text-gradient-gold`, `.noise-overlay`, Leaflet dark tuning |
| `src/app/layout.tsx` | Italiana + Manrope fonts, body palette |
| `src/components/layout/Navbar.tsx` | Floating glass nav |
| `src/components/layout/Footer.tsx` | Dark glass footer |
| `src/components/loaders/ProjectNameLoader.tsx` | Champagne Noir brand curtain |
| `src/components/shared/design.ts` | Entity gradient/monogram helpers (glass-dark) |
