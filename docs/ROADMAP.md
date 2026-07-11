# ROADMAP — World Ballet & Opera Calendar (single source of truth)

> **これが最新かつ唯一の実行計画書です。** 散在した古い docs（STRATEGY.md /
> PHASE1_LAUNCH_PLAN.md 等）は背景資料として残しますが、矛盾する場合はこの
> ROADMAP が優先します。方針・ブランドは `CLAUDE.md` の Brand Charter（§2）、
> 日次記録は `reports/day-XX-report.md`。
>
> **This is the current, canonical plan.** Older docs are background only and are
> superseded here on conflict.

Last updated: 2026-07-11

---

## North star / 事業の指針
**Discovery → itinerary → booking, beautifully and trustworthily.** A curated
travel product for the world's ~30–80 greatest ballet & opera houses — not an
Operabase coverage clone. Four moats: **Curation · Trust · Travel · Design.**
(詳細は CLAUDE.md §2 Brand Charter。)

---

## Task backlog & status / タスク一覧と状況

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⏸ deferred (post-traction)

### A. Launch-critical / ローンチ必須
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Verified-dates trust badge | ✅ | `VerifiedDates` on perf page + cards. Shows on `last_verified` (full "dates confirmed" claim) OR `source_url` (precise "listing from the official source" link). Surfaces on real ingested rows. |
| 2 | Affiliate live (`affiliate.ts`) | ⬜ | Code ready; needs network sign-up + IDs. External review pending. |
| 3 | **Data verification & publishing** | ⬜ | **Highest priority.** Published data ≈ empty → site looks unchanged. Run ingestion / seed verified rows. Root cause of "site is blank." |
| 4 | OG / share images | ✅ | Shipped (root OG fixed). |
| 5 | Email alert MVP | ✅ | `FollowButton` + `/api/follow` + `NewsletterCapture`. |

### B. Fast-follower / ローンチ直後
| # | Task | Status | Notes |
|---|------|--------|-------|
| 6 | Curated "Unmissable this season" rail | ✅ | `CuratedRail` on home; `is_featured` picks first, else falls back to soonest upcoming (one per company). Shows whenever performance data exists. Max 12, typically 4–6. No dedicated page (owner's call). |
| 7 | Venue map / "near me" | ✅ | `/map` explorer + per-house map + geolocation near-me. **Google Maps** primary when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set (gold 📍 pins, InfoWindow → house), **Leaflet/CARTO fallback** when not. Renders today (company lat/lng exist). |
| 8 | "Plan the trip" panel | ✅ | `PlanYourTrip` on perf pages (hotels/experiences/tours). Monetizes once #2 IDs land. |

### C. Growth / 集客・成長
| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | Editorial long-tail SEO | ✅ | `/journal` + `/journal/[slug]`: 5 evergreen articles (travel guides, work explainers, company stories), per-article SEO + Article JSON-LD + sitemap, related-house links, trip/newsletter CTAs. Add more articles over time. |
| 10 | Auto social cards ("this week") | ✅ | `/this-week` page + auto-generated weekly OG card (`renderWeekCard`) + share/download affordances. Merged & deployed. |

### D. Quality & infra / 品質・基盤
| # | Task | Status | Notes |
|---|------|--------|-------|
| 11 | Automated tests / test runner | 🟡 | CI now runs lint + `validate:data` + `ingest:selftest` + production build on every PR (`.github/workflows/ci.yml`, 2026-07-11). Remaining: a real test runner + unit/e2e tests. Visual checks stay manual (`verifier-web`). |
| 12 | Ingestion 403 / automation | ⬜ | GitHub Action DC-IP gets 403 on major houses. Needs residential proxy / self-hosted runner. Key to scale. |
| 13 | People bios | ⬜ | Some placeholders (Day 9). Small effort. |

### E. Deferred (intentional) / 意図的に後回し
i18n · user accounts / favorites · PWA · B2B casting tool — all post-traction.

---

## Recently shipped (this work-stream) / 直近の成果
- **#1 Verified-dates badge** — `src/components/shared/VerifiedDates.tsx` (full +
  compact), wired into perf page & list rows; `last_verified`/`source_url` added
  to the `Performance` type.
- **Newsletter popup** — `src/components/audience/NewsletterPopup.tsx`,
  intent-triggered (dwell → scroll/exit-intent), localStorage-gated, global.
- **#6 Curated rail** — `src/components/home/CuratedRail.tsx`, home, above
  "This week."
- **#7 Venue map** — `src/components/map/VenueMap.tsx` + `VenueMapLoader.tsx`,
  `/map` page, per-house map, nav link, gold-pin CSS.

> Note: #1 and #6 now surface on the real performance data in Supabase — the rail
> falls back to upcoming runs when nothing is flagged `is_featured`, and the badge
> shows on `last_verified` OR `source_url`. They still hide gracefully when there
> is genuinely no data. #7 and #9 render immediately (company data + evergreen
> editorial). The remaining "site looks empty" risk is purely about how much
> verified performance data is published (#3 / ingestion ops).

---

## Priority order / 推奨優先順
1. **#3 Data verification & publishing** — more verified rows = a fuller site
   (and more for #1/#6 to show). Ingestion/approval ops — the owner-run
   `--live`/`--local` ingest for the 7 missing houses is the current step.
2. **#2 Affiliate IDs** — turn on revenue once traffic exists.
3. **#12 Ingestion automation** — scale coverage of the curated set.
4. **#11 Tests · #13 bios** — hardening.
5. **Bigger bets** — performance-trip bundle, premium tier, data-model flip.

## Bigger bets (from strategy) / 大きな賭け
- **Performance-trip bundle** (ticket + hotel + flight) — the killer travel unit.
  Owner-approved plan (2026-07): Phase 1 = deep-link Trip Bundle Card from venue
  lat/lng + run dates (no inventory, needs #2 IDs) → Phase 2 = honest "from ¥X"
  estimated totals → Phase 3 = bundle builder (premium groundwork).
- **Editorial journal `/journal`** — SEO compounding + curation moat.
- **Premium tier** — follow + alerts + multi-city planner.
- **Data-model flip** — houses push feeds in; B2B "what's on + book" widget.
