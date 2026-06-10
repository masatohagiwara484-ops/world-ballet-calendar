-- =============================================================
-- World Ballet & Opera Calendar
-- Migration 002 — schema rebuild to match src/lib/types.ts
--
-- Run in the Supabase SQL editor (or via the CLI). Idempotent:
-- it drops the old tables and recreates them in the canonical shape.
--
-- Data is NOT embedded here — load it with `npm run seed`, which upserts
-- the curated dataset from src/data/. This keeps a single source of truth.
-- =============================================================

-- -------------------------
-- CLEANUP
-- -------------------------
drop table if exists public.performances cascade;
drop table if exists public.companies cascade;
drop function if exists public.set_updated_at() cascade;

-- -------------------------
-- TIMESTAMP TRIGGER
-- -------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------
-- COMPANIES
-- Mirrors the Company interface in src/lib/types.ts.
-- `id` is text (stable human-readable ids like 'c-royal-ballet') so the
-- static dataset and the database share identical primary keys.
-- -------------------------
create table public.companies (
  id                text primary key,
  slug              text unique not null,
  name              text not null,
  name_local        text,
  type              text not null check (type in ('ballet', 'opera', 'both')),
  country           text not null,
  country_code      text not null check (char_length(country_code) = 2),
  city              text not null,
  lat               double precision not null check (lat between -90 and 90),
  lng               double precision not null check (lng between -180 and 180),
  website           text,
  instagram         text,
  venue             text,
  hero_image        text,
  description_short text,
  description       text,
  founded_year      integer,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_companies_country      on public.companies (country);
create index idx_companies_country_code on public.companies (country_code);
create index idx_companies_type         on public.companies (type);
create index idx_companies_is_active    on public.companies (is_active);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- -------------------------
-- PERFORMANCES
-- Mirrors the Performance interface in src/lib/types.ts.
-- company_slug is denormalized (kept in sync with companies.slug) so the
-- data layer can filter without a join when running against the static set.
-- -------------------------
create table public.performances (
  id             text primary key,
  company_id     text not null references public.companies(id) on delete cascade,
  company_slug   text not null,
  title          text not null,
  title_original text,
  kind           text not null check (kind in ('ballet', 'opera')),
  composer       text,
  choreographer  text,
  start_date     date not null,
  end_date       date not null,
  venue          text,
  ticket_url     text,
  affiliate_url  text,
  description    text,
  image_url      text,
  price_range    text,
  is_featured    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint performances_dates_valid check (end_date >= start_date)
);

create index idx_performances_company_id        on public.performances (company_id);
create index idx_performances_company_slug       on public.performances (company_slug);
create index idx_performances_kind               on public.performances (kind);
create index idx_performances_start_date         on public.performances (start_date);
create index idx_performances_end_date           on public.performances (end_date);
create index idx_performances_is_featured        on public.performances (is_featured);
-- Composite index supporting the common company + date-window query.
create index idx_performances_company_dates
  on public.performances (company_slug, start_date, end_date);

create trigger performances_set_updated_at
  before update on public.performances
  for each row execute function public.set_updated_at();

-- -------------------------
-- ROW-LEVEL SECURITY
-- Public read-only. Writes are performed only by the seed/scrape jobs using
-- the service-role key, which bypasses RLS. No client write policy exists,
-- so anon/authenticated users cannot INSERT/UPDATE/DELETE.
-- -------------------------
alter table public.companies    enable row level security;
alter table public.performances enable row level security;

drop policy if exists companies_public_read    on public.companies;
drop policy if exists performances_public_read on public.performances;

create policy companies_public_read
  on public.companies
  for select
  using (true);

create policy performances_public_read
  on public.performances
  for select
  using (true);

-- Intentionally NO insert/update/delete policies for anon or authenticated
-- roles. Ingestion runs with the service-role key, which is exempt from RLS.
