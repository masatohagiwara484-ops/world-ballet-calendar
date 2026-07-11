# Day 1 Report — World Ballet & Opera Calendar

_Date: 2026-05-15_

## Completed ✅

- [x] Node.js / npm / git environment confirmed (Node v22.22.2, npm 10.9.7)
- [x] Next.js 14 project created (TypeScript, Tailwind, App Router, `src/` dir)
- [x] Dependencies installed (Supabase, Leaflet, Three.js, GSAP, framer-motion, zod)
- [x] Core components implemented
  - Three.js rotating globe (`GlobeView`)
  - Leaflet interactive world map (`WorldMap`) with London / Paris / Moscow markers
  - Luxury dark layout — black background, gold accent (#c9a961), Playfair Display serif
- [x] Production build passes (`next build` — 5 routes, 0 errors)
- [x] Local verification — homepage rendered & screenshotted (hero, globe, map, markers)
- [x] Git repository committed and pushed to GitHub
- [x] Deployed to Vercel (production)

## Live URLs

- 🌐 Production: https://worldballetoperacalender.vercel.app
- 📦 GitHub: https://github.com/masatohagiwara484-ops/world-ballet-calendar

## Deployment verification

- Vercel deployment state: `READY` (production target)
- Production URL returns HTTP 200 with correct `<title>`, meta, CSS and JS bundles
- Identical build verified rendering in a full browser locally — hero text,
  rotating globe, dark Leaflet map, and 3 gold markers, with no console errors
- The Vercel ↔ GitHub git integration is **connected**: the first `vercel --prod`
  CLI deploy auto-linked the GitHub repo to the project, so every push to `main`
  now triggers an automatic production deploy.

## Deviations from the briefing

- **Next.js pinned to 14 + React 18.** The briefing left the Leaflet / Three.js
  packages unpinned; latest versions require React 19 and would break the build.
  Pinned: `react-leaflet@^4`, `@react-three/fiber@^8`, `@react-three/drei@^9`.
- **`'use client'` added to `GlobeView.tsx`** (the briefing's snippet omitted it).
- **`tailwind.config.ts` font mapping added** — the briefing set the `--font-sans` /
  `--font-serif` CSS variables but never wired them into Tailwind, so the Playfair
  Display headings would not have rendered.
- **`CompanyCard.tsx` / `PerformanceCard.tsx` deferred to Day 2** — nothing imports
  them yet; minimal route stubs were created for `/companies/[slug]` and
  `/performances/[id]` instead.
- **Tooling:** `gh` and `vercel` CLIs were not pre-installed. `gh` was installed
  locally (no Homebrew); the first deploy used the Vercel CLI after sign-in.
- Vercel project name derived from the folder: `world_ballet_opera_calender`
  (production alias `worldballetoperacalender.vercel.app`).

## Next Steps (Day 2)

- [ ] Finalize Supabase schema & implement the data API
- [ ] Enter ballet company data (top ~20 companies)
- [ ] Implement the company detail page (`CompanyCard`, `/companies/[slug]`)
- [ ] Implement the performance detail page (`PerformanceCard`, `/performances/[id]`)
- [ ] Add real Supabase keys as Vercel environment variables

## Notes

- Three.js globe load is currently fine on desktop; monitor mobile performance
  (Lighthouse target: Performance 90+).
- Leaflet tiles use the free CARTO dark basemap (rate-limited — revisit if traffic grows).
- `.env.local` holds Supabase placeholder values; real keys to be added on Day 2
  and set as Vercel environment variables.
