# Live Data Ingestion — architecture (human overview)

This is the plain-language companion to the `data-ingest` skill (which is the
operational checklist). It answers: *how do real performances get onto the site
without anyone typing them in by hand?*

## The shape of the system

```
                 every 1–2 days (Vercel Cron / GitHub Actions)
                                  │
        ┌─────────────────────────▼─────────────────────────┐
        │  for each source in docs/SOURCES.md                │
        │                                                    │
        │  1. FETCH   feed (iCal/RSS/API) preferred,         │
        │             else the listing HTML page             │
        │  2. EXTRACT feed-parse  OR  Claude structured       │
        │             extraction (HTML → JSON, layout-proof) │
        │  3. NORMALIZE credits, prices, work titles          │
        │             (src/lib/normalize.ts — shared with    │
        │              the in-memory graph)                  │
        │  4. RESOLVE people / works / venues → canonical ids │
        │  5. DIFF    vs current DB → new / changed / gone     │
        └─────────────────────────┬─────────────────────────┘
                                  │
                      ┌───────────▼───────────┐
                      │   REVIEW QUEUE         │   review_status = 'pending'
                      │   (Supabase)           │   ← you approve here
                      └───────────┬───────────┘
                                  │ approve
                                  ▼
                      review_status = 'published'
                      last_verified = now()
                                  │
                                  ▼
                      Site search (the entity graph) — live in minutes
```

## The two extraction styles

| | Feed adapter | LLM-extraction adapter |
|---|---|---|
| Input | iCal / RSS / JSON API | Rendered HTML of the listing page |
| Robustness | Highest — survives redesigns | High — Claude re-reads structure each run |
| Maintenance | None once written | None per-selector; just the prompt + schema |
| Use when | The house publishes a feed | HTML only (most houses) |

We **always** prefer a feed. That is why `docs/SOURCES.md` asks you to rate the
feed for every house — one iCal link removes a whole class of breakage.

## Why a review queue (and not full auto-publish)

Patrons book flights around these dates. A wrong date destroys trust faster than
a missing one earns it. So the pipeline is *trust-first*: scraped rows are
`pending` until approved. High-confidence, unchanged-shape new rows can be
auto-approved later once we trust a source; **date changes and cancellations are
always reviewed**. Every row keeps `source_url` + `last_verified` for provenance.

## What runs this

- **Schema**: `supabase/migrations/003_entity_graph.sql` (people, works, venues,
  productions, credits, review/provenance columns, the `search_performances` RPC).
- **Code**: `scripts/scrapers/` (adapters + `normalize.ts` + `run.ts` CLI).
- **Shared logic**: `src/lib/normalize.ts`, `src/lib/graph.ts` — the same code
  the live search uses, so seed and scraped data are structurally identical.

## Your part vs. the agent's part

- **You**: keep `docs/SOURCES.md` filled (URLs, feeds, affiliate, robots), and
  approve the review queue. No coding.
- **The agent / engineer**: turn each filled source into an adapter, run the
  schedule, resolve entity aliases, and keep the queue healthy.
