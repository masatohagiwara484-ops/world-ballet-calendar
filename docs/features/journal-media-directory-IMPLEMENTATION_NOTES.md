# Journal / Ballet Media Directory — Implementation Notes (Phase 0)

Discovery output for `docs/features/journal-media-directory-spec.md`. No feature code was
written in this phase. This file is the contract Phases 1–5 build against.

---

## 1. Repository findings

### 1.1 Stack & conventions
- **Framework:** Next.js 14.2 (App Router), React 18, TypeScript (strict), Tailwind CSS.
- **Static data lives in `src/data/*.ts`** as typed, plain TS exports — not JSON.
  Precedents: `src/data/companies.ts`, `src/data/performances.ts`, `src/data/journal.ts`
  (each `export const x: Type[] = [...]`).
- **Domain types live in `src/lib/types.ts`** (single source of truth, no runtime imports).
  Feature-local content types may also live beside their data (`journal.ts` defines
  `JournalArticle` inline) — either convention is acceptable.
- **Validation:** `scripts/validate-data.ts` Zod-validates the whole dataset; wired into CI via
  `npm run validate:data` (`.github/workflows/ci.yml`: lint → validate:data → ingest:selftest → build).
- **Components:** `src/components/<domain>/*.tsx`. Pages: `src/app/<route>/page.tsx`.

### 1.2 Geography model — **important finding**
- Première has **no `region` concept anywhere** (grep for "region" in `src/` returns only an
  ARIA label). The **only geography facet is `country`**.
- A `Company` carries **`country` (full display name, e.g. `"United Kingdom"`)** and
  **`country_code` (ISO 3166-1 alpha-2, lowercase, e.g. `"gb"`)** — see `src/lib/types.ts`.
- The performances filter (`/search`) filters by **`country`**, and the **facet value is the full
  country name** (`p.company.country`), not the ISO code — see `src/lib/search.ts:140` and
  `SearchFilters.country` in `src/lib/types.ts`.
- **Countries currently present in the dataset (13):** Argentina `ar`, Austria `at`,
  Australia `au`, Canada `ca`, Germany `de`, Denmark `dk`, France `fr`, United Kingdom `gb`,
  Italy `it`, Japan `jp`, Netherlands `nl`, Russia `ru`, United States `us`.

**Consequence for this feature:** we cannot "reuse an existing region enum" because none exists.
Decision (see §3): `country` is the primary filter and mirrors the site's model **exactly**
(full name value + lowercase ISO code). `region` becomes a **directory-local grouping/secondary
filter** defined only for the media directory — it is *not* retro-fitted onto performances.

### 1.3 Filter state pattern (to reuse)
- **URL query params are the single source of filter truth.** The page reads them server-side
  from `searchParams` (`src/app/search/page.tsx` `parseFilters`), and the client mutates them via
  `useRouter().push()` + `useSearchParams()` (`FilterRail.tsx` `useFilterNav`).
- Param key for country is **`country`**, value = full country name (`?country=Germany`).
- Filter controls are client components wrapped in `<Suspense>` (required so `useSearchParams`
  compiles). Facet rows are simple toggle buttons with `aria-pressed`/`aria-current`.

### 1.4 Design system (to reuse)
- **Tokens:** `tailwind.config.ts` — White Gradient Luxury. Key classes we'll use:
  `bg-stage*` (warm whites), `text-ivory*` (ink), `text-gold`/`text-gold-deep`,
  `rounded-glass`, `shadow-card`/`shadow-card-hover`, `hairline`, plus the `glass-card`
  and `specular` utilities (in `globals.css`).
- **Text-only "art" already exists** — `src/components/shared/GradientArt.tsx` +
  `src/components/shared/design.ts` (`monogram()`, `gradientFor()`). This renders an oversized
  Playfair monogram on a jewel-tone gradient with **no external image** — it *is* the mechanism
  that satisfies the no-logo legal guardrail. Reuse it for the media card's brand block.
- **Card shell to mirror:** `src/components/journal/ArticleCard.tsx`
  (`group glass-card specular block overflow-hidden rounded-glass h-full`).

### 1.5 Routing & nav — **collision finding**
- Nav is a hardcoded `LINKS` array in `src/components/layout/Navbar.tsx` (desktop + mobile).
- **`/journal` is already taken** by the existing editorial layer (hand-written travel guides /
  work explainers, nav label **"Journal"**, data in `src/data/journal.ts`, route
  `src/app/journal/`). The media directory therefore **cannot use `/journal`**.
- **Decision:** new route **`/read`**, nav label **"Read"** (the spec explicitly allows
  "Journal / Read"). Placed in nav after "Journal". *(Owner: confirm label — see §6 Q1.)*

### 1.6 i18n
- **No i18n framework** (no next-intl / no `[locale]` segment). UI copy is English-only.
- Language codes in this feature (`languages: ["en","fr"]`) are **display-only metadata**
  (ISO 639-1), not an app locale. No language *filter* in v1 (spec Non-goal / parking lot).

---

## 2. Confirmed data model

Location: type + data in **`src/data/media-sources.ts`** (self-contained, mirrors the
`journal.ts` convention of colocating a feature type with its data). Validation added to
`scripts/validate-data.ts` so it runs in CI.

```ts
// src/data/media-sources.ts
export type MediaRegion =
  | 'Europe' | 'North America' | 'Asia' | 'Russia' | 'Latin America' | 'Oceania'

export type MediaScope = 'international' | 'national'
export type MediaStatus = 'ok' | 'verify'

export interface MediaSource {
  id: string            // stable kebab-case slug (unique)
  name: string          // display name — TEXT-RENDERED, never a logo
  url: string           // outbound link (validated as URL)
  region: MediaRegion   // directory-local grouping (see §1.2)
  country: string       // full country name; MUST match Première's country strings, or null-if-global
  country_code: string  // ISO 3166-1 alpha-2, lowercase (e.g. "gb")
  scope: MediaScope     // 'international' also surfaces in the Global bucket (Phase 3)
  languages: string[]   // ISO 639-1, display-only
  type: string[]        // free-text tags ("reviews","listings",…)
  blurb: string         // owner-authored, non-empty; NEVER the publisher's own tagline
  status: MediaStatus   // 'verify' = flag URL for owner confirmation, still renders
}
```

Notes:
- `country`/`country_code` use **Première's exact values** (full name + lowercase ISO), so a
  future "media in {country}" filter is consistent with performances. For a truly global source
  with no home country, `country` may be `""`/null and only `region` + `scope:international` apply.
- `region` is **directory-local** and does not need to exist in the performances model.

### Validation (Phase 1 will implement)
Extend `scripts/validate-data.ts` with a `MediaSourceSchema` asserting: unique kebab-case `id`,
valid `url`, `country_code` matches `^[a-z]{2}$`, `region` in the `MediaRegion` union, non-empty
`blurb`, `scope`/`status` in their unions. Cross-check: warn if a `country_code` is not among
Première's known company countries (informational — new countries like `es` are allowed, see §4).

---

## 3. Region / country identifiers to use + mapping table

**Country = Première's real model** (full display name + lowercase ISO code).
**Region = directory-local taxonomy** (§2), since Première has no region enum.

| id | name | spec region | spec ctry | → **country (Première)** | → **country_code** | in dataset? | scope (recommended) | status |
|----|------|-------------|-----------|--------------------------|--------------------|-------------|---------------------|--------|
| bachtrack | Bachtrack | Europe | GB | United Kingdom | gb | ✅ | international | ok |
| fjord-review | Fjord Review | North America | US | United States | us | ✅ | international | ok |
| ballet-herald | The Ballet Herald | North America | US | United States | us | ✅ | national | ok |
| dance-magazine | Dance Magazine | North America | US | United States | us | ✅ | national | ok |
| pointe-magazine | Pointe Magazine | North America | US | United States | us | ✅ | national | ok |
| dance-europe | Dance Europe | Europe | GB | United Kingdom | gb | ✅ | international | ok |
| criticaldance | CriticalDance | North America | US | United States | us | ✅ | international | ok |
| dancetabs | DanceTabs | Europe | GB | United Kingdom | gb | ✅ | international | ok |
| ballett-journal | Ballett-Journal | Europe | DE | Germany | de | ✅ | national | ok |
| tanznetz | tanznetz.de | Europe | DE | Germany | de | ✅ | national | **verify** |
| dance-for-you | Dance for You Magazine | Europe | DE | Germany | de | ✅ | international | ok |
| danser-canal-historique | Danser Canal Historique | Europe | FR | France | fr | ✅ | national | ok |
| resmusica | ResMusica (Danse) | Europe | FR | France | fr | ✅ | national | **verify** |
| ballet2000 | Ballet2000 | Europe | IT | Italy | it | ✅ | international | **verify** |
| la-personne | La Personne | Russia | RU | Russia | ru | ✅ | national | ok |
| chacott-dance-magazine | Chacott / Dance Magazine (JP) | Asia | JP | Japan | jp | ✅ | national | ok |
| ballet-channel | Ballet Channel | Asia | JP | Japan | jp | ✅ | national | **verify** |
| danza-ballet | Danza Ballet | Europe | ES | **Spain** | **es** | ❌ **new** | international | **verify** |

**Flags / non-clean mappings:**
- **`danza-ballet` → Spain (`es`) is NOT in Première's company dataset.** This is fine —
  `country_code` is just metadata here and `es` is a valid ISO code — but it means Spain won't
  match any performance country. Validation should *warn, not fail*, on unknown countries.
- **`scope` is not in the spec's seed table** — I assigned it per the blurbs (worldwide / "international
  eye" / multi-country → `international`; single-market → `national`). **Owner: confirm §6 Q2.**
- Region `Russia` is kept as its own bucket (matches spec); `Latin America` and `Oceania` are
  defined but empty in v1 (room to grow, per spec §7).

---

## 4. Reuse map (what Phases 1–5 import, by path)

| Need | Reuse (path) |
|------|--------------|
| Text-only brand block (monogram, no logo) | `src/components/shared/GradientArt.tsx`; `monogram()`,`gradientFor()` in `src/components/shared/design.ts` |
| Card shell / hover language | mirror `src/components/journal/ArticleCard.tsx` (`glass-card specular … rounded-glass`) |
| Index page layout / hero | mirror `src/app/journal/page.tsx` (header + responsive grid) |
| Filter UI + URL-param state | pattern from `src/components/search/FilterRail.tsx` (`useFilterNav`) + server read in `src/app/search/page.tsx` (`parseFilters`, `<Suspense>` wrappers) |
| Active filter chips | `src/components/search/ActiveFilters.tsx` |
| Country identifiers (names + codes) | `src/data/companies.ts` / `src/lib/types.ts` (`country`, `country_code`) |
| Nav registration | `src/components/layout/Navbar.tsx` `LINKS` array |
| Validation harness | `scripts/validate-data.ts` (+ `npm run validate:data`, already in CI) |
| Design tokens | `tailwind.config.ts`, `src/app/globals.css` |

---

## 5. `status: "verify"` entries — **owner to confirm live URLs before launch**

1. **tanznetz.de** — https://www.tanznetz.de/
2. **ResMusica (Danse)** — https://www.resmusica.com/
3. **Ballet2000** — https://www.ballet2000.com/
4. **Ballet Channel** — https://balletchannel.jp/
5. **Danza Ballet** — https://www.danzaballet.com/

These will render on the site (flagged internally via `status:"verify"`), but the owner should
confirm each resolves to the intended live publication before public launch.

---

## 6. Open questions for the owner

1. **Route + nav label.** `/journal` is taken by the editorial layer. Recommend route **`/read`**,
   label **"Read"**. Alternatives: `/media` ("Media") or `/press` ("Press"). OK to proceed with
   `/read`?
2. **`scope` assignments.** The spec's seed table has no `scope` column; I inferred
   international/national from the blurbs (§3). Please sanity-check — it only affects which cards
   also appear in the "Global / International" bucket when a filter is active (Phase 3).
3. **Region filter granularity.** Since Première has no region enum, the directory defines its own
   6-region taxonomy (§2). Confirm the labels (esp. "Russia" as a standalone region vs folding into
   "Europe").
4. **Spain (`es`).** Not currently a Première country. Keep `danza-ballet` as-is (metadata only) —
   confirmed acceptable?

---

## 7. Summary

- Première's geography is **country-only** (full-name + lowercase ISO code); **no region enum
  exists** → `country` mirrors the site exactly; `region` is a new directory-local taxonomy.
- **`/journal` is taken** → new route **`/read`** ("Read").
- The **no-logo guardrail is already solved** by the existing `GradientArt`/`monogram` system.
- Filter state = **URL query params** (reuse `/search`'s pattern).
- Data = typed TS in **`src/data/media-sources.ts`**; validation extends **`scripts/validate-data.ts`**
  (CI-covered). One seed country (**Spain/`es`**) is new; **5 entries are `status:"verify"`**.

Ready for Phase 1 (data layer) once the owner confirms §6.

---

## 8. Build log — decisions taken (Phases 1–5)

Owner directed autonomous progression through Phases 0–5 (site review at the end). The
in-code confirmation prompt could not be delivered (harness error), so the §6 **recommended
defaults were adopted** and are easily changed:
- **Route/nav:** `/read`, label **"Read"** (Q1).
- **Region taxonomy:** 6 regions, **Russia standalone** (Q3).
- **Scope:** inferred international/national assignments per §3 (Q2).
- **Spain (`es`):** kept as metadata-only; validation warns (not fails) on non-dataset countries (Q4).

## 9. Phase 5 — QA result (against spec §9 "Success criteria")

| Criterion | Status |
|---|---|
| Directory reachable from primary nav ("Read") | ✅ `Navbar.tsx` LINKS |
| All seed sources render; `verify` listed in notes | ✅ 18 cards · §5 / §9 lists verify |
| Filter by country and by region, reusing performances UX | ✅ `MediaFilterRail` + URL params |
| International/Global reachable regardless of region filter | ✅ Global bucket beneath results |
| Every card: text-only, "External ↗", new tab + `rel="noopener noreferrer"`, "External media" | ✅ `MediaSourceCard.tsx` |
| No third-party logo/image/favicon loaded | ✅ grep-audited; monogram/CSS only |
| Responsive to mobile; empty-state on no results | ✅ `flex-col lg:flex-row`; filtered empty state + Global bucket |
| a11y: keyboard-focusable links, visible focus ring, contrast | ✅ anchor cards, gold `focus-visible` ring, SR link text |
| CLAUDE.md documents feature + "how to add a source" | ✅ CLAUDE.md §7 |

**Verification:** `npm run validate:data`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
all green; `/read` rendered on desktop + mobile, filtered (Germany/Asia), empty state, and
keyboard focus confirmed via screenshots.

## 10. `status:"verify"` — owner to confirm live URLs before launch (repeat)

1. **tanznetz.de** — https://www.tanznetz.de/
2. **ResMusica (Danse)** — https://www.resmusica.com/
3. **Ballet2000** — https://www.ballet2000.com/
4. **Ballet Channel** — https://balletchannel.jp/
5. **Danza Ballet** — https://www.danzaballet.com/
