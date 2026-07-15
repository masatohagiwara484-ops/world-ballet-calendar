-- =============================================================
-- World Ballet & Opera Calendar
-- Migration 006 — cancellation debounce (miss tracking)
--
-- Additive & idempotent. Run after 005.
--
-- WHY: the crawl renders a JavaScript listing and the number of cards it manages
-- to load varies slightly run-to-run (network/pagination timing). A production
-- that is momentarily absent from one render was being cancelled immediately —
-- so a real, still-running show could vanish from the live site for a day and
-- reappear the next morning ("flicker"). Cancellation is the traveller-plan-
-- breaking change, so it must be debounced: only cancel a row after it has been
-- MISSING for two consecutive runs, not one.
--
-- Adds two columns to performances:
--   • miss_count   — consecutive runs this row was absent from its source's crawl
--                    (reset to 0 the moment it reappears)
--   • last_seen_at — when the crawl last saw this row (diagnostics / future TTL)
-- =============================================================

alter table public.performances add column if not exists miss_count integer not null default 0;
alter table public.performances add column if not exists last_seen_at timestamptz;
