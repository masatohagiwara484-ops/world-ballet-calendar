-- =============================================================
-- World Ballet & Opera Calendar
-- Migration 004 — ingestion bookkeeping (diff state + Telegram queue)
--
-- Additive & idempotent. Run after 003. Adds:
--   • performances.change_kind / content_hash / confidence — diff & trust signals
--   • ingest_sources  — per-source crawl state (hash/etag cache, robots/ToS gate,
--                       earned auto-approve)
--   • ingest_batches  — one Telegram digest per company per run; the approval
--                       state machine the webhook flips.
--
-- The review queue itself REUSES performances.review_status='pending' (added in
-- 003) — there is deliberately no parallel staging mirror, so scraped and seed
-- rows stay structurally identical.
-- =============================================================

-- -------------------------
-- PERFORMANCES — diff + provenance signals written by the ingestion job.
-- -------------------------
-- How this row changed vs. what the DB already had, decided by the differ.
alter table public.performances add column if not exists change_kind text
  check (change_kind in ('new','date-changed','price-changed','cancelled','unchanged'));
-- Hash of the source fields the row was extracted from — lets a re-run detect an
-- identical row cheaply and skip re-resolution.
alter table public.performances add column if not exists content_hash text;
-- Extraction confidence: feed parses = 1.0; LLM extraction reports its own. Low
-- confidence forces manual review even for otherwise auto-approvable changes.
alter table public.performances add column if not exists confidence numeric
  check (confidence is null or (confidence >= 0 and confidence <= 1));

create index if not exists idx_performances_change_kind on public.performances (change_kind);
create index if not exists idx_performances_source_url  on public.performances (source_url);

-- -------------------------
-- INGEST_SOURCES — one row per data source (mirrors a docs/SOURCES.md entry).
-- Holds everything the Fetcher needs to decide whether to spend a download / an
-- LLM call, plus the earned-trust auto-approve flag.
-- -------------------------
create table if not exists public.ingest_sources (
  slug                  text primary key,           -- company slug (matches companies.slug)
  listing_url           text,                        -- the season / what's-on page
  feed_kind             text not null default 'html'
    check (feed_kind in ('api','ical','rss','jsonld','html')),
  last_hash             text,                        -- content hash of the last MAIN content seen
  last_fetched          timestamptz,
  etag                  text,                        -- HTTP ETag for conditional GETs
  robots_ok             boolean not null default false,
  tos_ok                boolean not null default false,
  auto_approve          boolean not null default false,
  consecutive_clean_runs integer not null default 0, -- clean human-approved runs in a row
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- -------------------------
-- INGEST_BATCHES — one Telegram digest per company per run; the approval state
-- machine the /api/telegram/webhook route flips on a button tap.
-- -------------------------
create table if not exists public.ingest_batches (
  id                  text primary key,              -- '<run_id>:<company_slug>'
  company_slug        text not null,
  run_id              text not null,
  created_at          timestamptz not null default now(),
  telegram_chat_id    text,
  telegram_message_id text,
  status              text not null default 'sent'
    check (status in ('sent','approved','rejected','expired')),
  performance_ids     text[] not null default '{}',  -- pending rows this digest governs
  counts              jsonb  not null default '{}'    -- {new, date-changed, cancelled, ...}
);
create index if not exists idx_ingest_batches_run    on public.ingest_batches (run_id);
create index if not exists idx_ingest_batches_status on public.ingest_batches (status);

-- -------------------------
-- TIMESTAMP TRIGGER (reuse set_updated_at from migration 002)
-- -------------------------
drop trigger if exists ingest_sources_set_updated_at on public.ingest_sources;
create trigger ingest_sources_set_updated_at before update on public.ingest_sources
  for each row execute function public.set_updated_at();

-- -------------------------
-- ROW-LEVEL SECURITY — these are operational tables, NOT public data. Enable RLS
-- with no public policy, so the anon key sees nothing; only the service-role key
-- (ingestion job + the server-side webhook) can read/write them.
-- -------------------------
alter table public.ingest_sources enable row level security;
alter table public.ingest_batches enable row level security;
