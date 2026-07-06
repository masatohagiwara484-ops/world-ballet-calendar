---
name: data-ingest
description: Ingestion protocol for replacing seed data with live, real-world ballet & opera performances. Use when adding a data source, writing a scraper adapter, running the scheduled crawl, resolving people/works into the entity graph, or wiring the human-in-the-loop review queue. Covers feed-first and LLM-extraction paths, entity resolution, and trust/provenance rules.
---

# Data Ingestion — World Ballet & Opera Calendar

## Why this exists
The catalogue's promise is "the world's great stages, with never a wrong date."
That is only credible if the data is **real and current**. Hand-entry does not
scale to hundreds of houses, and brittle per-site CSS scrapers break on every
redesign. This skill defines the durable pipeline that keeps the entity graph
(`src/lib/graph.ts` ↔ `supabase/migrations/003_entity_graph.sql`) fed.

## The non-negotiable rule: trust before freshness
People book flights and hotels around these dates. **A wrong date is worse than
a missing one.** Therefore:
- Scraped rows land as `review_status = 'pending'`, never straight to `published`.
- Every performance carries `source_url` + `last_verified`.
- Only high-confidence, schema-valid, diff-reviewed rows are auto-published;
  anything ambiguous waits for a human approval.

## Pipeline (per source, per run)

```
fetch → extract → normalize → resolve entities → diff → review → publish
```

1. **Fetch** — prefer a real feed over HTML, always:
   `API ▸ iCal ▸ RSS ▸ JSON-in-page ▸ HTML`. The chosen feed is recorded in
   `docs/SOURCES.md`. Respect `robots.txt`, rate-limit, send the
   `WorldBalletCalendarBot/1.0 (+contact)` UA (already set in `scripts/scrapers/run.ts`).

2. **Extract** — two adapter styles under `scripts/scrapers/adapters/`:
   - **Feed adapter** (preferred): deterministic parse of iCal/RSS/JSON. Robust.
   - **LLM-extraction adapter** (for HTML-only sites): pass the cleaned page to
     Claude with the `RawPerformance` JSON schema and have it return structured
     rows. Resilient to layout changes; no per-selector maintenance. Validate
     the model output with the existing `zod` schemas before trusting it.
   The three existing adapters (`royal-ballet`, `paris-opera-ballet`,
   `wiener-staatsoper`) are the CSS-selector templates; keep their shape.

3. **Normalize** — `scripts/scrapers/normalize.ts` + `src/lib/normalize.ts`:
   parse credits (`parseCredits`), prices (`parsePrice` → price_min/max/currency
   + `toEur`), and the work merge key (`workTitleKey`). These are the SAME
   helpers the in-memory graph uses, so a scraped "Kenneth MacMillan" resolves
   to the same `pe-kenneth-macmillan` id as a seeded one.

4. **Resolve entities** — upsert `people`, `works`, `venues`, `productions`,
   and `performance_credits`. Slugs are the identity. The hard case is aliases
   ("Balanchine" vs "George Balanchine", "Petipa" vs "Marius Petipa"): maintain
   an alias map and/or use Claude for fuzzy resolution, then write the canonical
   `person_id`. This is where search quality is won or lost.

5. **Diff** — compare against existing rows by stable id. Classify each change as
   `new` / `date-changed` / `price-changed` / `cancelled`. New + low-risk →
   candidate for auto-publish; date/cancellation changes → always review.

6. **Review & publish** — write the `search_text` document (same string as
   `graph.doc`), set `last_verified = now()`, and flip approved rows to
   `published`. The `search_performances` RPC only ever returns `published`.

## Scheduling
Run the crawl on a schedule (every 1–2 days): **Vercel Cron** (`vercel.json`)
hitting an authenticated route, or a **GitHub Actions** `schedule:` workflow
running `npm run scrape -- --all --live`. Per-adapter isolation is already in
`run.ts` (one failure never aborts the batch).

## Commands
```bash
npm run scrape -- --adapter <slug> --fixture   # offline parse from a saved fixture
npm run scrape -- --adapter <slug> --live      # fetch the live source
npm run scrape -- --all --live                 # full scheduled run
npm run validate:data                          # integrity checks before publish
```
Set `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` to enable upserts;
without them the run is a safe dry run that only prints results.

## Adding a new source — checklist
1. Fill the row in `docs/SOURCES.md` (listing URL, feed, affiliate, robots).
2. Add `scripts/scrapers/adapters/<slug>.ts` (feed parser or LLM-extraction).
3. Save a fixture under `scripts/scrapers/fixtures/<slug>.html` for offline tests.
4. Register it in the `ADAPTERS` map in `scripts/scrapers/run.ts`.
5. Run `--fixture`, confirm valid rows; then `--live`; then review & publish.

## Definition of done for an ingestion change
- Adapter yields schema-valid rows on its fixture.
- Entities resolve to canonical slugs (no duplicate people for the same person).
- New/changed rows enter the review queue; nothing wrong is auto-published.
- `last_verified` and `source_url` are stamped.
