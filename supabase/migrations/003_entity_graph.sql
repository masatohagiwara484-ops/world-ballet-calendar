-- =============================================================
-- World Ballet & Opera Calendar
-- Migration 003 — entity graph for cross-cutting search
--
-- Adds the normalized graph that powers "one word → every matching
-- performance on earth": people, works, venues, productions, and the
-- performance↔person credit junction. Mirrors src/lib/types.ts and the
-- in-memory builder in src/lib/graph.ts 1:1, so the scraper ingestion job can
-- populate these tables and the search layer reads the same shape it does today.
--
-- Additive & idempotent: it does NOT touch the existing companies/performances
-- data, only extends performances with searchable columns. Run after 002.
--
-- NOTE: the live site still reads the in-memory graph derived from src/data/.
-- These tables are the production target for the real-data phase; nothing here
-- is required for the current static deployment.
-- =============================================================

-- -------------------------
-- PEOPLE  (choreographers, composers, dancers, conductors, …)
-- De-duplicated across the whole catalogue by slug, exactly like graph.ts.
-- -------------------------
create table if not exists public.people (
  id         text primary key,            -- 'pe-<slug>'
  slug       text unique not null,
  name       text not null,
  sort_name  text not null,               -- "Surname, Forename"
  roles      text[] not null default '{}', -- subset of the role vocabulary below
  bio        text,
  country    text,
  born_year  integer,
  died_year  integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_roles_valid check (
    roles <@ array['choreographer','composer','dancer','conductor','director','singer','musician']::text[]
  )
);
create index if not exists idx_people_sort_name on public.people (sort_name);
create index if not exists idx_people_roles      on public.people using gin (roles);

-- -------------------------
-- WORKS  (the abstract piece — "Swan Lake" — independent of who stages it)
-- Merged across companies by article-folded title + kind (see workTitleKey).
-- -------------------------
create table if not exists public.works (
  id             text primary key,        -- 'w-<title>-<kind>'
  slug           text unique not null,
  title          text not null,
  title_original text,
  kind           text not null check (kind in ('ballet','opera','concert')),
  composer_id    text references public.people(id) on delete set null,
  synopsis       text,
  premiere_year  integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_works_kind        on public.works (kind);
create index if not exists idx_works_composer_id on public.works (composer_id);

-- -------------------------
-- VENUES  (one per company location today; first-class for multi-venue later)
-- -------------------------
create table if not exists public.venues (
  id           text primary key,          -- 'v-<slug>'
  slug         text unique not null,
  name         text not null,
  city         text not null,
  country      text not null,
  country_code text not null check (char_length(country_code) = 2),
  lat          double precision check (lat between -90 and 90),
  lng          double precision check (lng between -180 and 180),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_venues_country on public.venues (country);
create index if not exists idx_venues_city    on public.venues (city);

-- -------------------------
-- PRODUCTIONS  (a specific staging: work × company × choreographer)
-- -------------------------
create table if not exists public.productions (
  id               text primary key,      -- 'pr-<company>-<work>'
  work_id          text not null references public.works(id) on delete cascade,
  company_id       text not null references public.companies(id) on delete cascade,
  choreographer_id text references public.people(id) on delete set null,
  director_id      text references public.people(id) on delete set null,
  title            text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_productions_work_id    on public.productions (work_id);
create index if not exists idx_productions_company_id on public.productions (company_id);

-- -------------------------
-- PERFORMANCES — extend with graph links, structured price, provenance, FTS.
-- -------------------------
alter table public.performances add column if not exists work_id       text references public.works(id) on delete set null;
alter table public.performances add column if not exists production_id text references public.productions(id) on delete set null;
alter table public.performances add column if not exists venue_id      text references public.venues(id) on delete set null;
alter table public.performances add column if not exists price_min     numeric;
alter table public.performances add column if not exists price_max     numeric;
alter table public.performances add column if not exists currency      text;     -- ISO 4217
alter table public.performances add column if not exists price_eur_min numeric;  -- for cross-currency range filters
-- Provenance — trust & the human-in-the-loop review queue for scraped data.
alter table public.performances add column if not exists source_url    text;
alter table public.performances add column if not exists last_verified timestamptz;
alter table public.performances add column if not exists review_status text not null default 'published'
  check (review_status in ('published','pending','rejected'));
-- The full search document the ingestion job writes (title, work, company,
-- venue, city, country, every credited person) — the same string graph.ts
-- builds as `doc`. A generated tsvector keeps the FTS index in sync.
alter table public.performances add column if not exists search_text text;
alter table public.performances add column if not exists search_tsv tsvector
  generated always as (to_tsvector('simple', coalesce(search_text, ''))) stored;

create index if not exists idx_performances_work_id       on public.performances (work_id);
create index if not exists idx_performances_production_id on public.performances (production_id);
create index if not exists idx_performances_price_eur     on public.performances (price_eur_min);
create index if not exists idx_performances_review_status on public.performances (review_status);
create index if not exists idx_performances_search_tsv    on public.performances using gin (search_tsv);

-- -------------------------
-- PERFORMANCE_CREDITS  (performance ↔ person, with the capacity served)
-- This is what lets "search Nureyev" reach every run he is credited on,
-- in any role, then be narrowed by city / month / price.
-- -------------------------
create table if not exists public.performance_credits (
  performance_id text not null references public.performances(id) on delete cascade,
  person_id      text not null references public.people(id) on delete cascade,
  role           text not null check (
    role in ('choreographer','composer','dancer','conductor','director','singer','musician')
  ),
  primary key (performance_id, person_id, role)
);
create index if not exists idx_credits_person on public.performance_credits (person_id, role);

-- -------------------------
-- TIMESTAMP TRIGGERS (reuse set_updated_at from migration 002)
-- -------------------------
drop trigger if exists people_set_updated_at      on public.people;
drop trigger if exists works_set_updated_at       on public.works;
drop trigger if exists venues_set_updated_at      on public.venues;
drop trigger if exists productions_set_updated_at on public.productions;
create trigger people_set_updated_at      before update on public.people      for each row execute function public.set_updated_at();
create trigger works_set_updated_at       before update on public.works       for each row execute function public.set_updated_at();
create trigger venues_set_updated_at      before update on public.venues      for each row execute function public.set_updated_at();
create trigger productions_set_updated_at before update on public.productions for each row execute function public.set_updated_at();

-- -------------------------
-- SEARCH RPC — the production query path that search.ts will call once data
-- lives in Postgres. Mirrors the in-memory filter pipeline: free-text (FTS) +
-- structured facets + date overlap + EUR price band, paginated. Facet COUNTS
-- are computed by the app/ingestion via companion grouped queries.
-- Only 'published' rows are ever returned to the public.
-- -------------------------
create or replace function public.search_performances(
  p_q             text default null,
  p_kind          text default null,
  p_country       text default null,
  p_city          text default null,
  p_company_slug  text default null,
  p_person_slug   text default null,
  p_choreographer_slug text default null,
  p_composer_slug text default null,
  p_work_slug     text default null,
  p_start         date default null,
  p_end           date default null,
  p_price_min     numeric default null,
  p_price_max     numeric default null,
  p_limit         integer default 24,
  p_offset        integer default 0
)
returns setof public.performances
language sql
stable
as $$
  select p.*
  from public.performances p
  join public.companies c on c.id = p.company_id
  left join public.works w on w.id = p.work_id
  where p.review_status = 'published'
    and (p_q is null or p.search_tsv @@ plainto_tsquery('simple', p_q))
    and (p_kind is null or p.kind = p_kind)
    and (p_country is null or c.country = p_country)
    and (p_city is null or c.city = p_city)
    and (p_company_slug is null or c.slug = p_company_slug)
    and (p_work_slug is null or w.slug = p_work_slug)
    and (p_start is null or p.end_date >= p_start)
    and (p_end is null or p.start_date <= p_end)
    and (p_price_min is null or coalesce(p.price_eur_min, 0) >= p_price_min)
    and (p_price_max is null or coalesce(p.price_eur_min, 0) <= p_price_max)
    and (p_person_slug is null or exists (
      select 1 from public.performance_credits pc join public.people pe on pe.id = pc.person_id
      where pc.performance_id = p.id and pe.slug = p_person_slug))
    and (p_choreographer_slug is null or exists (
      select 1 from public.performance_credits pc join public.people pe on pe.id = pc.person_id
      where pc.performance_id = p.id and pc.role = 'choreographer' and pe.slug = p_choreographer_slug))
    and (p_composer_slug is null or exists (
      select 1 from public.performance_credits pc join public.people pe on pe.id = pc.person_id
      where pc.performance_id = p.id and pc.role = 'composer' and pe.slug = p_composer_slug))
  order by p.start_date asc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- -------------------------
-- ROW-LEVEL SECURITY — public read-only, same posture as migration 002.
-- Writes happen only via the service-role key (ingestion), exempt from RLS.
-- -------------------------
alter table public.people              enable row level security;
alter table public.works               enable row level security;
alter table public.venues              enable row level security;
alter table public.productions         enable row level security;
alter table public.performance_credits enable row level security;

drop policy if exists people_public_read       on public.people;
drop policy if exists works_public_read        on public.works;
drop policy if exists venues_public_read       on public.venues;
drop policy if exists productions_public_read   on public.productions;
drop policy if exists credits_public_read       on public.performance_credits;

create policy people_public_read       on public.people              for select using (true);
create policy works_public_read        on public.works               for select using (true);
create policy venues_public_read       on public.venues              for select using (true);
create policy productions_public_read  on public.productions         for select using (true);
create policy credits_public_read      on public.performance_credits for select using (true);
