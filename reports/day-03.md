# Day 3 Report — Company Pages, Performance Cards & Affiliate Integration

**Date:** May 16, 2026  
**Status:** ✅ COMPLETE  
**Production URL:** https://worldballetoperacalender.vercel.app  
**Commit:** `eb23202`

---

## Working Backwards Goal (Achieved)

**Final User Experience Delivered:**
1. User visits homepage → sees "Companies" section with 4 gold-accented cards
2. User clicks "The Royal Ballet" → navigates to `/companies/royal-ballet`
3. Page shows: company hero (name, founded year, country), description, "Official Site" + "Instagram" links
4. Below: 2 upcoming performances (Swan Lake, The Sleeping Beauty) each with:
   - Title in Playfair Display, hovering gold
   - Composer + choreographer metadata
   - Date range and price range in gold
   - **"Book Tickets"** — gold-filled CTA linking to official box office
   - **"Hotels in London"** — muted Booking.com affiliate hotel search link
5. Mobile at 375px: no horizontal scroll, all elements stacked correctly

---

## Deliverables Completed

### ✅ Frontend Engineering (DRI: Frontend Engineer Agent)

**`src/app/companies/[slug]/page.tsx`** — Full company detail page:
- Server Component with `async` Supabase data fetching
- `generateStaticParams()` — SSG for all 4 company slugs at build time
- `generateMetadata()` — per-company title, description, OpenGraph for SEO
- `notFound()` called when company slug doesn't exist
- Fixed nav: blur backdrop, "← World Calendar" gold link, type·city badge
- Company hero: serif headline up to 7xl, founded year, country, external links
- "Upcoming Performances" section: count badge, performance grid
- Graceful empty state for companies with no upcoming performances

**`src/components/performance/PerformanceCard.tsx`** — Performance display:
- `'use client'` component with date formatting (no timezone issues — T00:00:00 appended)
- Featured badge: gold/15% opacity background
- Title: Playfair serif, gold on hover (group-hover transition 300ms)
- Composer + choreographer metadata in muted text
- Price range in gold text
- "Book Tickets": `bg-[#C9A961]` gold-filled CTA (primary money action)
- "Hotels in [City]": Booking.com affiliate URL with `encodeURIComponent` for injection safety, muted border-only styling (supplementary, not competing)

**`src/app/not-found.tsx`** — Custom 404:
- Gold "404" label, serif headline, muted body copy
- "Return to Calendar" CTA with gold border

**`src/app/page.tsx`** — Homepage Companies grid added:
- Fetches `/api/companies` in `useEffect` (consistent with existing WorldMap pattern)
- 2×2 grid separated by 1px `bg-white/5` gap lines
- Each card: type·country gold badge, serif company name (hover → gold), short description (2-line clamp), founded year, "Explore →" arrow appears on hover
- Section only renders when companies array has data (no flash of empty grid)

**`src/app/globals.css`** — Leaflet popup luxury upgrade:
- `background: #0A0A0A` (true black, not #1a1a1a)
- `border: 1px solid rgba(201, 169, 97, 0.2)` — gold border at 20% opacity
- `border-radius: 0` — sharp luxury corners
- `box-shadow: 0 8px 40px rgba(0,0,0,0.8)` — deep shadow
- Pip/triangle hidden (`display: none`)
- Close button positioned and styled correctly

### ✅ Sub-Agent Persona Upgrades

All sub-agent role files upgraded with world-class personas:

**Frontend Engineer** (`.claude/agents/frontend_engineer.md`):
- 18 years experience; former Staff Engineer at Apple (apple.com), Principal at Airbnb (Experiences map), early engineer at Linear
- PhD candidate, Stanford HCI Lab — luxury digital aesthetics
- Complete design token table, animation timing standards, prohibited anti-patterns

**Design Director** (`.claude/agents/design_director.md`):
- 22 years; former Design Director at Apple (reporting to Jony Ive), Creative Director at Ferrari Digital, VP Design at LVMH Tech Lab (10+ luxury houses), Consulting Design Director at Rolex
- 3-tier review protocol: Non-Negotiable / Quality Standards / Excellence Targets
- Absolute veto power on Tier 1 failures

**Code Reviewer** (`.claude/agents/code_reviewer.md`):
- 16 years; former Tech Lead at Vercel (Next.js core ecosystem), Senior SWE Google Security
- Published author: "TypeScript at Scale" (O'Reilly, 2022)
- Structured review output format with blocking vs non-blocking issues

### ✅ Design Director Review — APPROVED

**Tier 1:** ✅ All `#0A0A0A` backgrounds, ✅ Playfair on all headings, ✅ No mobile overflow  
**Tier 2:** ✅ "Book Tickets" gold-filled CTA unmistakable, ✅ Affiliate link muted, ✅ All hover states at 300ms+  
**Tier 3:** Scroll animations deferred to Day 4

### ✅ Code Reviewer — LGTM

- ✅ TypeScript: zero `any` types, all props explicitly typed
- ✅ Security: `encodeURIComponent` on Booking.com URL params, `rel="noopener noreferrer"` on all external links
- ✅ Architecture: Server Component for data fetch, Client Component only for interactivity
- ✅ SSG: `generateStaticParams` generates all 4 routes at build time
- ✅ SEO: `generateMetadata` on company page
- ✅ `notFound()` called correctly on missing slug
- ✅ `npm run build` passes 0 errors — 10 routes, 4 SSG company pages

### ✅ SRE — Deployed

- Git push → Vercel auto-deploy triggered
- Production URL: https://worldballetoperacalender.vercel.app
- Verified pages at build: `/companies/{royal-ballet,paris-opera-ballet,bolshoi-ballet,metropolitan-opera}`

---

## Verification Results (Local Dev)

| Check | Result |
|-------|--------|
| `/companies/royal-ballet` h1 | ✅ "The Royal Ballet" |
| Performance count | ✅ 2 (Swan Lake, The Sleeping Beauty) |
| "Book Tickets" CTA | ✅ Present, gold fill |
| Booking.com hotel links | ✅ 2 links with encodeURIComponent |
| Homepage Companies h3 | ✅ "Companies" heading present |
| Homepage company cards | ✅ 4 (Bolshoi, Metropolitan, Paris, Royal) |
| Mobile 375px overflow | ✅ None (scrollWidth = 375) |
| `npm run build` | ✅ 0 errors |

---

## Affiliate Setup

**Current state:** Booking.com affiliate links are live with `label=world-ballet-opera-calendar` tracking label.

**To maximize revenue (Day 4/5 action):**
```bash
# Register at Booking.com affiliate program:
# https://www.booking.com/affiliate-program/

# Once approved, add to .env.local:
NEXT_PUBLIC_BOOKING_AFFILIATE_ID=your_id

# Then update PerformanceCard.tsx bookingUrl to use:
# &aid=${process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID}
```

---

## CEO Assessment

**Day 3 Execution Quality:** Excellent. All Working Backwards targets delivered on first deployment cycle. The company pages establish the product's premium positioning — a user clicking through from the map to Royal Ballet's page experiences a deliberate luxury journey: serif headline, muted metadata, two focused CTAs. No noise.

**Risk Assessment:**
- ⚠️ **Low**: Booking.com affiliate ID not yet registered — links functional but revenue attribution not yet tracked
- ⚠️ **Low**: GSAP scroll animations absent (Day 4) — pages feel static but not broken
- ✅ **No security risks**: encodeURIComponent on all URL params, noopener on all externals

**Strategic Note (Working Backwards — Day 4):**  
The product now has its core information architecture complete (homepage → company → performances). Day 4 should focus on the **emotional experience layer**: GSAP scroll reveals, globe interactivity with real company markers, and Lighthouse 90+ performance audit. This is the difference between a functional product and a luxury product.

---

## Files Changed (Day 3)

**New:**
- `src/app/companies/[slug]/page.tsx` (full implementation)
- `src/components/performance/PerformanceCard.tsx`
- `src/app/not-found.tsx`
- `.claude/agents/frontend_engineer.md` (upgraded persona)
- `.claude/agents/design_director.md` (new — upgraded persona)

**Modified:**
- `src/app/page.tsx` (Companies grid section added)
- `src/app/globals.css` (Leaflet luxury popup styles)
- `.claude/agents/code_reviewer.md` (upgraded persona)

**Renamed:**
- `PROJECT_BRIEFING_DAY{2,3,4}.md` → `docs/PROJECT_BRIEFING_DAY{2,3,4}.md`

---

**Ready for Day 4.** Awaiting Day 4 prompt.
