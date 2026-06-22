-- 005_audience.sql — the capture layer.
--
-- The product's go-to-market rests on owning an audience: every viral visitor
-- must be capturable, and the entire downstream funnel (free list → premium
-- newsletter → tour leads) is extracted from this list. Until now there was no
-- way to capture a single visitor — this migration adds that primitive.
--
-- Two tables:
--   subscribers — one row per email address (the master audience list)
--   follows     — what each email asked to be notified about (work/person/
--                 company/city). The join of intent + email is the lead.
--
-- Writes happen ONLY through the server (service-role API route /api/follow).
-- RLS is enabled with NO public policies, so the anon key cannot read or write
-- the audience list (emails are PII); the service role bypasses RLS server-side.

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  -- UI language at capture time, so the newsletter can be sent in their tongue.
  locale      text,
  -- Where the capture happened (e.g. 'work:swan-lake', 'home', 'city:paris').
  source      text,
  -- Double-opt-in flag. Captured rows start unconfirmed; a later confirmation
  -- email flips this. We can still count unconfirmed for momentum metrics.
  confirmed   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  -- What the visitor wants to be alerted about.
  entity_type  text not null check (entity_type in ('work', 'person', 'company', 'city')),
  entity_slug  text not null,
  -- Human label snapshot ("Swan Lake", "Paris") so a digest reads well without
  -- a join back to the entity graph.
  entity_label text,
  created_at   timestamptz not null default now(),
  -- A person follows a given thing once.
  unique (email, entity_type, entity_slug)
);

create index if not exists follows_email_idx on public.follows (email);
create index if not exists follows_entity_idx on public.follows (entity_type, entity_slug);

alter table public.subscribers enable row level security;
alter table public.follows enable row level security;

-- No policies are created on purpose: the anon/public role gets no access.
-- The /api/follow route uses the service-role key, which bypasses RLS.
