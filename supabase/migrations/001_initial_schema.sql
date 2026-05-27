-- =============================================
-- World Ballet & Opera Calendar
-- Initial Schema v1.0 + Seed Data
-- Run this entire file in the Supabase SQL Editor
-- =============================================

-- -------------------------
-- CLEANUP (drop old tables if they exist)
-- -------------------------

drop table if exists public.performances cascade;
drop table if exists public.companies cascade;
drop function if exists public.update_updated_at_column() cascade;

-- -------------------------
-- SCHEMA
-- -------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_local text,
  type text not null check (type in ('ballet', 'opera', 'both')),
  country text not null,
  city text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  website text,
  instagram text,
  hero_image text,
  description text,
  description_short text,
  founded_year integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  title_original text,
  composer text,
  choreographer text,
  start_date date not null,
  end_date date,
  venue text,
  venue_address text,
  ticket_url text,
  affiliate_url text,
  description text,
  image_url text,
  price_range text,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, title, start_date)
);

-- Indexes
create index if not exists idx_companies_type on public.companies(type);
create index if not exists idx_companies_country on public.companies(country);
create index if not exists idx_companies_is_active on public.companies(is_active);
create index if not exists idx_performances_company_id on public.performances(company_id);
create index if not exists idx_performances_start_date on public.performances(start_date);

-- RLS
alter table public.companies enable row level security;
alter table public.performances enable row level security;

drop policy if exists "Companies are viewable by everyone" on public.companies;
drop policy if exists "Performances are viewable by everyone" on public.performances;

create policy "Companies are viewable by everyone"
  on public.companies for select using (true);

create policy "Performances are viewable by everyone"
  on public.performances for select using (true);

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_companies_updated_at on public.companies;
create trigger update_companies_updated_at
  before update on public.companies
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_performances_updated_at on public.performances;
create trigger update_performances_updated_at
  before update on public.performances
  for each row execute procedure public.update_updated_at_column();

-- -------------------------
-- SEED DATA — Companies
-- -------------------------

insert into public.companies
  (slug, name, name_local, type, country, city, lat, lng,
   website, instagram, hero_image, description, description_short, founded_year)
values
  (
    'royal-ballet',
    'The Royal Ballet',
    'The Royal Ballet',
    'ballet', 'United Kingdom', 'London',
    51.5129, -0.1243,
    'https://www.roh.org.uk', 'royalballetofficial',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1600&auto=format&fit=crop',
    'One of the world''s greatest ballet companies, based at the Royal Opera House in Covent Garden, London. Founded in 1931, the Royal Ballet is celebrated for its exceptional classical and contemporary repertoire.',
    'World-leading ballet company at the Royal Opera House, London.',
    1931
  ),
  (
    'paris-opera-ballet',
    'Paris Opéra Ballet',
    'Ballet de l''Opéra de Paris',
    'ballet', 'France', 'Paris',
    48.8719, 2.3316,
    'https://www.operadeparis.fr', 'operadeparis',
    'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1600&auto=format&fit=crop',
    'The world''s oldest national ballet company, founded in 1661 by King Louis XIV. Based at the Palais Garnier and Opéra Bastille, it is a cornerstone of French cultural heritage.',
    'World''s oldest ballet company, founded in 1661 by Louis XIV.',
    1661
  ),
  (
    'bolshoi-ballet',
    'Bolshoi Ballet',
    'Большой балет',
    'both', 'Russia', 'Moscow',
    55.7603, 37.6189,
    'https://www.bolshoi.ru', 'bolshoi_theatre',
    'https://images.unsplash.com/photo-1580809361436-42a7ec20488f?q=80&w=1600&auto=format&fit=crop',
    'One of the most prestigious and historically significant ballet companies in the world. The Bolshoi Theatre in Moscow has been home to extraordinary productions since 1776.',
    'Russia''s legendary ballet company, home of Swan Lake and The Nutcracker.',
    1776
  ),
  (
    'metropolitan-opera',
    'Metropolitan Opera',
    'Metropolitan Opera',
    'opera', 'United States', 'New York',
    40.7730, -73.9831,
    'https://www.metopera.org', 'metropolitanopera',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=1600&auto=format&fit=crop',
    'The largest classical music organization in North America. The Met presents approximately 220 performances of some 25 operas each season at Lincoln Center.',
    'North America''s leading opera house at Lincoln Center, New York.',
    1883
  )
on conflict (slug) do update set
  name           = excluded.name,
  name_local     = excluded.name_local,
  type           = excluded.type,
  country        = excluded.country,
  city           = excluded.city,
  lat            = excluded.lat,
  lng            = excluded.lng,
  website        = excluded.website,
  instagram      = excluded.instagram,
  hero_image     = excluded.hero_image,
  description    = excluded.description,
  description_short = excluded.description_short,
  founded_year   = excluded.founded_year,
  updated_at     = now();

-- -------------------------
-- SEED DATA — Performances
-- (company_id resolved via subquery)
-- -------------------------

insert into public.performances
  (company_id, title, composer, choreographer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'Swan Lake',
  'Pyotr Ilyich Tchaikovsky',
  'Marius Petipa & Lev Ivanov',
  '2026-06-01', '2026-06-28',
  'Royal Opera House', 'Bow St, London WC2E 9DD',
  'https://www.roh.org.uk', '£25 – £250', true
from public.companies c where c.slug = 'royal-ballet'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer, choreographer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'The Sleeping Beauty',
  'Pyotr Ilyich Tchaikovsky',
  'Frederick Ashton',
  '2026-07-15', '2026-08-10',
  'Royal Opera House', 'Bow St, London WC2E 9DD',
  'https://www.roh.org.uk', '£30 – £280', false
from public.companies c where c.slug = 'royal-ballet'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer, choreographer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'Giselle',
  'Adolphe Adam',
  'Jean Coralli & Jules Perrot',
  '2026-06-10', '2026-07-05',
  'Palais Garnier', 'Place de l''Opéra, 75009 Paris',
  'https://www.operadeparis.fr', '€15 – €210', true
from public.companies c where c.slug = 'paris-opera-ballet'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer, choreographer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'The Nutcracker',
  'Pyotr Ilyich Tchaikovsky',
  'Rudolf Nureyev',
  '2026-12-01', '2026-12-31',
  'Opéra Bastille', 'Place de la Bastille, 75012 Paris',
  'https://www.operadeparis.fr', '€15 – €195', false
from public.companies c where c.slug = 'paris-opera-ballet'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer, choreographer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'Don Quixote',
  'Ludwig Minkus',
  'Marius Petipa',
  '2026-06-20', '2026-07-10',
  'Bolshoi Theatre', 'Teatralnaya pl., 1, Moscow, 125009',
  'https://www.bolshoi.ru', '₽3,000 – ₽30,000', true
from public.companies c where c.slug = 'bolshoi-ballet'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'La Traviata',
  'Giuseppe Verdi',
  '2026-06-05', '2026-06-25',
  'Metropolitan Opera House', '30 Lincoln Center Plaza, New York, NY 10023',
  'https://www.metopera.org', '$25 – $399', true
from public.companies c where c.slug = 'metropolitan-opera'
on conflict (company_id, title, start_date) do nothing;

insert into public.performances
  (company_id, title, composer,
   start_date, end_date, venue, venue_address, ticket_url, price_range, is_featured)
select c.id,
  'Carmen',
  'Georges Bizet',
  '2026-07-10', '2026-08-05',
  'Metropolitan Opera House', '30 Lincoln Center Plaza, New York, NY 10023',
  'https://www.metopera.org', '$30 – $450', false
from public.companies c where c.slug = 'metropolitan-opera'
on conflict (company_id, title, start_date) do nothing;

-- -------------------------
-- Verify
-- -------------------------
select name, city, type from public.companies order by founded_year;
select p.title, c.name as company, p.start_date
from public.performances p join public.companies c on p.company_id = c.id
order by p.start_date;
