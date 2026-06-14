# 🎭 PROJECT HANDOFF — World Ballet & Opera Calendar

> **Purpose of this file.** This is a complete, self-contained handoff so a new
> Claude Code session can continue this project with zero context loss. Read it
> top to bottom once; then jump to **§9 Current Status** and **§10 Next Steps /
> Ready-to-Paste Prompts** and start working. Everything you need — the product
> vision, the strategic decisions, the monetization plan, the architecture
> already built, the working methodology the owner expects, and the exact next
> tasks — is here.
>
> **Last updated:** 2026-06-14 · **Branch:** `claude/modest-fermat-4jv93k`
> **Repo:** masatohagiwara484-ops/world-ballet-calendar
> **Live:** https://worldballetoperacalender.vercel.app

---

## 0. TL;DR for the next session (read this first)

- The product is a **luxury, global, cross-cutting search engine for high-art
  performances** (ballet · opera · — later — classical concerts). The punchline:
  **"type one word — a work, a choreographer, a dancer, a city — and see every
  matching performance on Earth, then filter it down."**
- The owner approved building **the entity-graph search system FIRST** ("Plan
  A"). **That foundation is BUILT and pushed** (types, graph builder, search
  engine, APIs, search UI, homepage overhaul, Supabase schema, docs, a scraping
  skill). Build is green; Vercel deploy fixed (tsconfig `target` was missing).
- **What is NOT done yet:** (1) visual render-verification of the new UI,
  (2) dedicated SEO entity pages `/works/[slug]` & `/people/[slug]` (the real
  SEO moat), (3) populating the Supabase entity tables, (4) the email→paid
  alert system, (5) PWA, (6) real scraped data, (7) the rebrand decision.
- **How the owner wants you to work:** Working-Backwards; **multi-agent**
  parallelization with tight contracts; **model tiering** (Opus plans/reviews,
  Sonnet builds quality-sensitive UI, Haiku does bulk/mechanical work) to save
  tokens; subdivide tasks; **verify renders, not just builds**; bilingual day
  reports; commit/push to the branch above.

---

## 1. What this product is (and who it's for)

A single, beautiful place to discover ballet & opera performances worldwide,
with deep, interconnected metadata. Audience = **affluent, high-travel-intent
culture lovers** who currently cannot search across the dozens of siloed opera-
house / company websites. The structural opportunity: **each house only lists
its own shows; nobody lets you search the world by work, artist, or city.**

**The punchline / positioning:**
> *"Every stage in the world. One search."*
> e.g. *"Where can I see **Swan Lake** this year? — one page, every company."*
> e.g. *"Show me everything **Rudolf Nureyev** choreographed, playing in **Paris**
> in **October**, under **€80**."*

This is why the project's name "World Ballet Calendar" is too literal — it sells
a calendar, not a knowledge graph (see §3, naming).

---

## 2. The consulting verdict (strategic analysis already delivered)

The owner asked for a harsh review of design, profitability, and monetization.
Summary of what was concluded and **agreed**:

1. **Drop ad revenue.** Niche traffic → trivial ad income, and ads destroy the
   Apple/Rolex brand. Removed as a pillar. ✅ decided.
2. **The current data is fake** and the `/partners` page lists **fictional
   partners** (SkyTeam, Maison Stay) — a credibility risk. To be replaced with
   real affiliates / removed. ⚠️ still present in repo.
3. **The moat is cross-cutting, entity-first search** (search by work / person /
   city across all companies). No competitor does this; houses structurally
   cannot. SEO gold: "Swan Lake 2026 tickets", "La Bohème near me". ✅ this is
   now the core being built.
4. **Stay niche, deepen vertically.** Do NOT expand to museums or pop concerts
   (GetYourGuide/Songkick own those). Only natural adjacency = **classical
   concerts / orchestras** (same venues, audience, data shape). ✅ decided.
5. **Design:** dark "Liquid Glass × Champagne Noir" theme is right (keep it);
   the hero must become **search-first** (the globe was decorative, not
   answering the user's job). Don't over-apply react-three-fiber / scroll-jack
   to what is a **utility tool** — keep 3D to hero/transitions, keep
   calendar/lists fast; gate on Lighthouse mobile 90+ and `prefers-reduced-
   motion`. ✅ guides the UI work.

---

## 3. Decisions made in this session (the owner's choices)

| Topic | Decision | Status |
|---|---|---|
| **Build order** | Build **Plan A = entity-graph cross-cutting search** first, then email→paid alerts | ✅ A built; B pending |
| **App vs Web** | **Web-first. NO rebuild.** PWA now (installable + web push), native via **Expo/React Native later** sharing the same API. Reasons: SEO is the discovery engine (apps aren't indexed), Apple's 30% on in-app subs, affiliate-heavy apps get rejected | ✅ decided |
| **Ads** | Dropped as a revenue pillar | ✅ decided |
| **Scope** | Stay niche (ballet+opera), only adjacency = classical concerts | ✅ decided |
| **Real data** | Replace fake data via an **AI scraping/ingestion agent** (feed-first, else LLM-extraction) with a **human-in-the-loop review queue** | 🔜 planned, infra scaffolded |
| **Project name** | Rebrand needed. Top proposal **"Grand Tier"** (also: Ouverture/Overture, Encore Atlas, Première). Tagline *"Every stage in the world. One calendar/search."* | ❓ OPEN — owner has not chosen yet |

---

## 4. Monetization plan (the pillars)

Ads are OUT. The pillars, in priority order:

- **Pillar A — Ticket on-sale alerts (the subscription core).** Popular runs
  (Royal's Nutcracker, La Scala openings) sell out in hours. "Notify me when
  tickets for my chosen work / company / city go on sale" is the one thing this
  audience will pay for. This is the heart of the paid tier.
- **Pillar B — "Performance Trip" bundled affiliate.** On each performance page,
  below "Book tickets", bundle (not a link dump): hotels walking-distance from
  the venue (Booking.com / Expedia deep-linked by lat/lng), flights to the
  cultural capital (WayAway/Aviasales-type), and **Tiqets / GetYourGuide**
  tours/backstage (highest-CVR, best fit). Replace the fake partners page.
- **Pillar C — Newsletter + sponsorship.** A weekly "This Week on Stage" email
  to an affluent niche commands high sponsor CPMs and is the retention engine +
  funnel to the paid tier. **Email capture should be the #1 CTA site-wide.**
- **Pillar D — B2B featured listings.** Houses/companies pay to feature new
  seasons / touring productions. Classic niche-media play; works at low traffic.
- **Pillar E — Data licensing / API (long-term).** The normalized world
  performance graph is itself the asset — license to luxury travel concierges,
  hotel apps, in-flight media.

### Subscription packaging (Free vs Premium)

> **Rule (immutable): never paywall CONTENT (kills SEO). Monetize TOOLS —
> notification, sync, planning.**

| | **Free** | **Grand Tier Member** — ~$6/mo or $48/yr |
|---|---|---|
| Full calendar + company/work/artist info | ✅ (public, for SEO) | ✅ |
| Weekly newsletter | ✅ | ✅ |
| **Ticket on-sale alerts** (work / company / city) | — | ✅ core value |
| **Artist tracking** ("notify when this dancer performs") | — | ✅ |
| Personal calendar sync (iCal / Google feed) | — | ✅ |
| Trip planner (what can I see during my stay; multi-show optimizer) | — | ✅ |
| City opera-going guide PDFs | — | ✅ (annual perk) |

Funnel: free email signup → experience alerts → upgrade. Billing via **Stripe**
(web, ~3% fees), NOT in-app (avoids Apple 30%).

---

## 5. Architecture — the entity graph (the heart)

The original data was **flat**: each performance had free-text `composer` /
`choreographer` strings — impossible to search "all of MacMillan's productions"
reliably. We introduced a **normalized entity graph**:

```
people        (choreographers, composers, dancers, conductors, …; de-duped by slug)
works         (the abstract piece — "Swan Lake" — merged across ALL companies)
venues        (one per company location today; first-class for multi-venue later)
productions   (a staging: work × company × choreographer)
performances  (the scheduled run — the searchable unit; links to all of the above)
performance_credits  (performance ↔ person, with role)  ← powers "search any artist"
```

**Key design choice:** the graph is **built deterministically from the existing
flat data at runtime** (`src/lib/graph.ts`), so cross-cutting search works
*today* on the seed data, and the SAME shape is mirrored by the Supabase schema
(`supabase/migrations/003_entity_graph.sql`) for when real scraped data lands.
The normalizer (`src/lib/normalize.ts`) is shared by both paths, so a scraped
"Kenneth MacMillan" resolves to the same `pe-kenneth-macmillan` id as a seeded
one.

**Filters supported** (the owner's required sectors + additions): free-text `q`,
discipline (ballet/opera/concert), country, city, company, **person (any role)**,
**choreographer**, **composer**, work, **date range** (overlap), **price band**
(per-ticket, cross-currency via EUR), sort (date/relevance/price), pagination —
plus live **facet counts** and **autocomplete**.

**Verified working** against the real seed: `"Swan Lake"` → **14 companies
worldwide**; `"Kenneth MacMillan"` → his productions in London & New York;
price + facet filters correct.

---

## 6. Files built this session (with what each does)

### Core engine (built by Opus — load-bearing, do not casually refactor)
- `src/lib/types.ts` — extended with the entity-graph + faceted-search contract
  (Person, Work, Venue, Production, Credit, PriceBand, SearchFilters,
  SearchFacets, SearchResultItem, SearchResponse). The original flat
  `Performance`/`PerformanceQuery` contract is preserved (frozen).
- `src/lib/normalize.ts` — pure helpers: `slugify`, `sortName`, `parseCredits`
  (splits "Liam Scarlett after Petipa and Ivanov" → people), `parsePrice`
  (→ min/max/currency), `toEur`, `workTitleKey` (article-folded work merge key).
- `src/lib/graph.ts` — `buildGraph()` decomposes companies+performances into the
  graph (memoized). Exports `GraphPerformance`, lookups by slug.
- `src/lib/search.ts` — `search(filters)` (text → filters → facet counts → sort
  → paginate) and `suggest(q)` (autocomplete). Runs on the in-memory graph;
  swappable for the Supabase `search_performances` RPC later.
- `src/app/api/search/route.ts` — GET faceted search.
- `src/app/api/suggest/route.ts` — GET autocomplete.

### Search UI (built by a Sonnet sub-agent, to spec)
- `src/app/search/page.tsx` — **server-rendered** search page (SEO-critical),
  reads `searchParams` → `search()` directly, `generateMetadata`.
- `src/components/search/` — `SearchBox` (debounced autocomplete combobox),
  `FilterRail` (collapsible facets + date + price), `ResultCard` (server),
  `ActiveFilters`, `Pagination`, `SortControl`.
- `src/components/home/SearchHero.tsx` — new **search-first** homepage hero
  (replaced the decorative globe).
- Edited `src/app/page.tsx` (use SearchHero) and
  `src/components/layout/Navbar.tsx` (add Search link).
- Edited `tsconfig.json` → added `"target": "ES2017"` (REQUIRED — without it the
  build fails on Map-iterator spreads; this was the Vercel failure).

### Data / real-data infrastructure
- `supabase/migrations/003_entity_graph.sql` — entity tables, FTS (`search_tsv`
  generated column + GIN), the `search_performances` RPC, RLS (public read),
  and **review-queue/provenance** columns (`review_status`, `source_url`,
  `last_verified`) — the trust layer for scraped data. Additive & idempotent.
- `docs/SOURCES.md` — **the owner's homework**: 25 seeded companies + 20
  candidates, with TODO columns (listing URL · feed · affiliate · robots). No
  coding required to fill.
- `docs/INGESTION.md` — human-facing architecture of the scraping pipeline.
- `.claude/skills/data-ingest/SKILL.md` — operational skill for building
  adapters, scheduling crawls, entity resolution, and the review queue.

### Pre-existing scaffolding to reuse (not built this session)
- `scripts/scrapers/` — adapter pattern (`royal-ballet`, `paris-opera-ballet`,
  `wiener-staatsoper`) + `normalize.ts` + `run.ts` CLI + Supabase upsert. ~80%
  of the ingestion plumbing already exists.
- `src/lib/data.ts` — data-access layer with a **FROZEN** contract
  (`getCompanies`/`getCompanyBySlug`/`getPerformances`) and Supabase-or-static
  fallback. Don't change its signatures.

---

## 7. The design system (so new UI matches)

"Liquid Glass × Champagne Noir" — dark opera-house-at-night. Tailwind tokens
already configured (`tailwind.config.ts`) + global classes (`src/app/globals.css`):
- Colors: `stage` (#0A0908 / .elevated #121110 / .raised #1A1816 / .deep
  #060504), `gold` (#D4AF37 / .bright #E8C96A / .pale #F5E7C1 / .muted), `ivory`
  (#F5F1E8 / .secondary / .tertiary), `wine` #4A1F2E, `midnight` #1B2A4A.
- Type: `font-serif` = Italiana (headlines), `font-sans` = Manrope (body).
- Classes: `.glass-panel`, `.glass-card` (hover lift), `.glass-pill`,
  `.specular` (top edge), `.text-gradient-gold`. Radii `rounded-glass(-sm/-lg)`.
- Idiom: gold eyebrow `text-gold text-[11px] tracking-[0.4em] uppercase`;
  section padding `py-20 md:py-28 px-6 md:px-10`; `max-w-5xl/7xl mx-auto`.
- **No external photography** — every "image" is a typographic gradient
  (`src/components/shared/design.ts`: `gradientFor`, `monogram`).

---

## 8. The working methodology the owner expects (codify this)

The owner explicitly asked that the next session honor this operating system:

1. **Working Backwards / CEO Agent** (see `CLAUDE.md`): define "what the user
   sees in the browser when done" first; Apple/Ferrari/Rolex quality bar;
   reject mediocrity.
2. **Multi-agent parallelization.** Decompose into independent, non-overlapping
   file-sets and run sub-agents concurrently. Give each agent a **tight, frozen
   contract** (types + file list + design tokens + "build must pass").
3. **Model tiering to save tokens** (owner's words: "実装プランやレビューを最上位
   モデルが行い、細かい構築などはhaikuなど"):
   - **Opus** → architecture, planning, load-bearing logic (schema, search,
     entity resolution), and final review.
   - **Sonnet** → quality-sensitive construction (UI/UX).
   - **Haiku** → bulk/mechanical work (seed transforms, docs, repetitive
     components). Always review Haiku output.
4. **Subdivide large tasks** into small, individually-polished pieces.
5. **Verify RENDERS, not just builds.** This project's repeated failure mode is
   "compiles fine, renders blank". After any UI change, run the `verifier-web`
   skill (start dev server, load pages, screenshot, confirm real content).
6. **Bilingual day reports** (`reports/day-XX-report.md`) in English + Japanese
   (CLAUDE.md standing rule). Next report = `reports/day-10-report.md`.
7. **Autonomously create new agents/skills** when they raise quality.
8. **Git:** develop on `claude/modest-fermat-4jv93k`; commit with clear messages
   (end with the session URL line); `git push -u origin <branch>`; never open a
   PR unless asked.

---

## 9. CURRENT STATUS (what's done vs pending)

### ✅ Done & pushed
- Entity-graph model + builder + normalizer.
- Faceted search engine + `/api/search` + `/api/suggest`.
- Search UI (page + components) + search-first homepage hero + Navbar.
- Supabase migration 003 (entity graph + FTS + RPC + review queue).
- `docs/SOURCES.md`, `docs/INGESTION.md`, `data-ingest` skill.
- Build green; **Vercel deploy fixed** (tsconfig `target: ES2017`), pushed as
  commit `99c828b`.

### ⏳ Pending / not yet done (DO THESE NEXT)
1. **Render-verify the new UI** (`verifier-web`): homepage hero, `/search` with
   a query (e.g. `/search?q=swan%20lake`), filters, autocomplete, mobile. Fix
   anything blank/broken. *(Was interrupted by container restarts — do first.)*
2. **Dedicated SEO entity pages** — the real moat:
   - `/works/[slug]` — "every company's Swan Lake worldwide" (uses
     `buildGraph().workBySlug` + `search({ work_slug })`).
   - `/people/[slug]` — an artist's page (all their credited performances; uses
     `personBySlug` + `search({ person_slug })`).
   - Add JSON-LD, `generateStaticParams`, sitemap entries. Link to these from
     `ResultCard` credit names and from search.
3. **Populate Supabase entity tables** — write a seed/ingestion that pushes the
   built graph (people/works/venues/productions/credits + performance
   `search_text`, price_*, work/production/venue ids) so the RPC path goes live.
   Then optionally switch `search.ts` to call `search_performances`.
4. **Email capture + on-sale alerts (Pillar A / roadmap item 2).**
5. **PWA** (installable + web push) — no rebuild; add manifest + service worker.
6. **Real data ingestion** — turn filled `docs/SOURCES.md` rows into adapters
   (feed-first; else LLM-extraction), schedule via Vercel Cron / GitHub Actions,
   wire the review queue. Follow the `data-ingest` skill.
7. **Replace the fake `/partners` page** with real bundled affiliates (Pillar B).
8. **Rebrand** once the owner picks a name (Grand Tier is the recommendation).
9. Write `reports/day-10-report.md` (bilingual) summarizing this milestone.

### ❓ Open questions for the owner
- Final **project name** (Grand Tier?).
- Remove the globe entirely, or keep it as a secondary "explore by map" view?
- Are **Supabase production credentials** available to populate real tables?
- Which **affiliate networks** has the owner been approved for (Tiqets /
  GetYourGuide / Booking / Expedia)? Needed for Pillar B IDs.

---

## 10. Ready-to-paste implementation prompts (for the next session)

> Each block is a self-contained task brief. Use the model tier noted. Run a
> sub-agent per task where parallelizable; review output as Opus.

### PROMPT 1 — Render-verify the search release (do first; Opus drives)
```
Use the verifier-web skill. Start the dev server, then load and screenshot:
"/", "/search", "/search?q=swan%20lake", "/search?choreographer=kenneth-macmillan",
and a mobile viewport of "/search". Confirm each renders REAL content (not a blank
hero) — the homepage SearchHero, the search box with working autocomplete, the
faceted FilterRail with live counts, and ResultCards. Fix any blank/broken render
or hydration error. Report with screenshots. Do not consider it done on a green
build alone.
```

### PROMPT 2 — SEO entity pages (the moat; Sonnet builds, Opus reviews)
```
Build dedicated, server-rendered, SEO-first pages on the existing entity graph
(src/lib/graph.ts, src/lib/search.ts). Do NOT modify src/lib/* signatures.
1) src/app/works/[slug]/page.tsx — for a work slug, show every performance of
   that work across all companies worldwide (search({ work_slug: slug })), with a
   gradient hero (gradientFor(slug)), the work's composer, a世界 map/list of
   companies staging it, and a filterable list reusing ResultCard. generateStaticParams
   from buildGraph().works. Add TheaterEvent/CreativeWork JSON-LD and a sitemap entry.
2) src/app/people/[slug]/page.tsx — for a person slug, show their roles, bio
   placeholder, and every performance they're credited on (search({ person_slug })),
   grouped by role. generateStaticParams from buildGraph().people. Add Person JSON-LD.
3) Link ResultCard credit names and SearchBox suggestions to these pages.
Match the Liquid Glass × Champagne Noir system. Build must pass; then render-verify.
```

### PROMPT 3 — Populate Supabase entity graph (Opus/Sonnet)
```
Write scripts/seed-graph.ts that builds the graph via buildGraph() and upserts
people, works, venues, productions, performances (with work_id/production_id/
venue_id, price_min/max/currency, price_eur_min, search_text = graph doc,
review_status='published', last_verified=now()), and performance_credits into
Supabase using the service-role key. Idempotent (onConflict by id). Mirror
supabase/migrations/003_entity_graph.sql exactly. Add an npm script "seed:graph".
Guard so it no-ops without credentials. Then (optional, behind a flag) add a
Supabase-backed path in src/lib/search.ts that calls the search_performances RPC,
keeping the in-memory graph as the guaranteed fallback (mirror the pattern in
src/lib/data.ts).
```

### PROMPT 4 — Email capture + on-sale alerts (Pillar A; Opus architects)
```
Implement the newsletter + alert funnel. (a) An email-capture component used as
the primary CTA site-wide (hero, performance pages, footer) storing to a Supabase
"subscribers" table (double opt-in). (b) An "alerts" model: a user can follow a
work / company / city; store follows in Supabase. (c) A scheduled job that detects
when a followed performance's tickets go on sale (ticket_url/affiliate_url appears
or a sale_date passes) and queues an email. Keep all CONTENT free; the alert
delivery is the paid (Grand Tier) feature — gate creation of >N alerts behind a
Stripe subscription stub. Web push can come later via PWA. Ship the capture +
follow UI first; the sender can be a stub.
```

### PROMPT 5 — PWA (no rebuild; Sonnet)
```
Make the app an installable PWA without changing the stack: add a web app
manifest, icons (generated, gold-on-stage, no external images), and a service
worker (next-pwa or a hand-rolled SW) caching the shell. Add iOS + Android
install support and a foundation for web push (don't wire push senders yet).
Verify Lighthouse PWA + mobile performance ≥ 90 and prefers-reduced-motion.
```

### PROMPT 6 — Real data ingestion (follow the data-ingest skill; mixed tiers)
```
Invoke the data-ingest skill. Pick 3 sources from docs/SOURCES.md that have a
feed (iCal/RSS/API). For each: write scripts/scrapers/adapters/<slug>.ts (feed
parser preferred; else LLM-extraction of the listing HTML into the RawPerformance
schema, validated with zod), save a fixture, register it in run.ts. Run --fixture
then --live; resolve people/works to canonical slugs; write rows to the review
queue (review_status='pending') with source_url + last_verified. NEVER auto-publish
date changes or cancellations. Report a diff summary.
```

---

## 11. Conversation log — natural-language recap (so you understand intent & tone)

The owner is a **business+web-design hybrid (3D web dev)**, building a niche
ballet/opera site, worried it lacks a strong hook and a reason for users to pay
or even visit. The dialogue, in order:

1. **Owner:** "Harshly review my project — web design, profitability,
   monetization. (1) Propose a better project name. (2) Add monetization pillars;
   current plan is ads + Booking-style travel affiliate next to tickets + monthly
   subscription, but users have no reason to pay or even visit — add features /
   approaches to grow revenue and traffic; show a concrete Free-vs-paid
   subscription package. (3) Should I add features or stay niche? e.g. break the
   ballet/opera frame and add museum tickets, or pivot to music concerts? (4)
   Review the web design; if redoing it, introduce scroll-driven animation and
   react-three-fiber for an immersive, moving site."

2. **Claude (consulting):** Delivered the §2 verdict — drop ads; the real
   product is a knowledge graph, not a calendar; the moat is cross-cutting
   entity search ("every Swan Lake on Earth"); stay niche, only adjacency =
   classical concerts; dark theme is right but make the hero search-first;
   don't over-do R3F on a utility. Proposed name **Grand Tier**. Gave a Free vs
   Grand Tier table. Gave a 6-step roadmap.

3. **Owner (3 questions before building):** (1) App (App Store / Google Play) vs
   website — is React suitable or should we rebuild from scratch? (2) Confirmed
   the vision: a database-like search where one sector (e.g. choreographer
   "Rudolf Nureyev") returns all his works' performances worldwide, filterable
   by Paris / October etc. — can we build this? (3) Current data is fake; can we
   build an AI agent that crawls theater sites every 1–2 days and updates our
   DB automatically so the owner doesn't hand-enter data?

4. **Claude:** (1) **Web-first, no rebuild**; PWA now, Expo native later;
   reasons SEO / Apple 30% / affiliate review. (2) **Yes** — needs the entity-
   graph schema; roadmap item 1 is the first slice. (3) **Yes** — the adapter
   infra is ~80% there; move to LLM-extraction + scheduled cron + a **review
   queue** + provenance; trust-first because wrong dates kill the brand.

5. **Owner:** "Implement Plan A first. Build the database-like global filtering
   search on the current site. Filters: location, per-ticket cost, choreographer,
   dancer, performer, datetime + anything else needed. Save all sites' data to
   Supabase with a schema that keeps filtering correct at scale. Add a search bar.
   Overhaul the UI for beauty + usability (replace globe/calendar at your
   discretion; introduce scroll animation / react-three-fiber for immersion).
   Replace the fake data with real live data AFTER search is built — tell me my
   tasks (company source list, skills, anything). Use **multi-agent**; create new
   agents/skills autonomously to raise quality. **Save tokens**: top model plans/
   reviews, Haiku does detailed construction. Subdivide big tasks and implement
   each carefully."

6. **Claude:** Built the entity-graph foundation (Opus), delegated the UI to a
   Sonnet sub-agent, wrote the Supabase schema + owner-homework docs + a scraping
   skill. Smoke-tested ("Swan Lake" → 14 companies). Build passed. **Then Vercel
   failed** because the `tsconfig target` fix wasn't committed → fixed & pushed.

7. **Owner:** "I'm moving to a new session (rate limits). Create a thorough
   handoff file (Markdown + HTML) capturing all memory — our conversation, the
   direction, what to implement, the monetization plan, new features, and the
   token-saving / multi-agent / task-subdivision methodology — plus concrete
   implementation prompts, so the next Claude Code reads it and continues."
   → **This file.**

**Tone & expectations:** ambitious, quality-obsessed ("world's finest"), values
decisiveness and careful craft over breadth, cost-conscious about tokens, expects
proactive autonomy (create agents/skills), and communicates in Japanese (reply in
Japanese; code/docs in English).

---

## 12. Key file index

| Path | What it is |
|---|---|
| `CLAUDE.md` | CEO-agent operating manual (Working Backwards, quality bar, sub-agents, bilingual reports) |
| `docs/HANDOFF.md` | **this file** |
| `docs/handoff.html` | styled, human-readable version of this file |
| `docs/SOURCES.md` | owner's homework — data source list to fill |
| `docs/INGESTION.md` | scraping pipeline architecture |
| `.claude/skills/data-ingest/SKILL.md` | ingestion operational skill |
| `.claude/skills/verifier-web/SKILL.md` | render-verification protocol (use after UI work) |
| `src/lib/types.ts` | domain + search contracts |
| `src/lib/normalize.ts` | credit/price/work-title normalizers |
| `src/lib/graph.ts` | entity-graph builder |
| `src/lib/search.ts` | faceted search engine + autocomplete |
| `src/lib/data.ts` | data-access layer (FROZEN contract) |
| `src/app/search/page.tsx` | search page (server-rendered) |
| `src/components/search/*` | search UI components |
| `src/components/home/SearchHero.tsx` | search-first homepage hero |
| `supabase/migrations/003_entity_graph.sql` | entity-graph DB schema + RPC + review queue |
| `scripts/scrapers/*` | scraper adapters + normalizer + CLI |

---

*End of handoff. Start at §9 → §10. Build beautifully, verify the pixels, save
tokens with the right model tier, and keep the moat — cross-cutting search — at
the center.*
