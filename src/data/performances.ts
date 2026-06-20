/**
 * Performance dataset — World Ballet & Opera Calendar.
 *
 * ⚠️ TRUST POLICY (this is the whole product) ⚠️
 * This array is the static floor that the site falls back to when Supabase is
 * empty. It must contain ONLY performances whose dates have been verified
 * against the company's own official site/box office. A wrong date is worse
 * than a missing one.
 *
 * It is intentionally EMPTY right now. The previous contents were a *curated
 * placeholder* season ("real and plausible" repertoire with invented dates) —
 * those dates did not match reality, so they have been taken down. Nothing
 * false is shown to the public: every page degrades to an honest empty state.
 *
 * HOW REAL DATA GETS HERE (two legitimate paths, never fabrication):
 *   1. Live ingestion (preferred) — run `npm run ingest` from your own machine.
 *      It pulls each house's official feed (iCal/RSS/JSON-LD) or extracts the
 *      what's-on page, writes rows as `review_status='pending'`, and you approve
 *      them in Telegram. Approved rows go to Supabase, not to this file.
 *   2. Hand-verified seed — for a flagship house with no feed, a human confirms
 *      each run against the official site and adds it BELOW with `source_url`
 *      and a `last_verified` date in the comment. Then `npm run seed`.
 *
 * Re-seeding does NOT delete old Supabase rows (seed upserts). To remove the
 * old placeholder rows from the database, run `npm run purge:performances` once.
 */
import type { Performance } from '@/lib/types'

export const performances: Performance[] = []
