-- 009: link follows/subscribers to Supabase Auth, additively.
--
-- Anonymous email capture via /api/follow (service-role, see src/lib/audience.ts)
-- must keep working exactly as today — user_id is nullable, and the existing
-- write path is untouched. This migration only adds the optional linkage so
-- an authenticated visitor's own follows can be read/written under RLS from
-- their session, without requiring an account to use the site.

alter table public.follows
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.subscribers
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists follows_user_id_idx on public.follows (user_id);

-- Authenticated users may read/write only their own rows. Anonymous writes
-- (service-role, bypasses RLS) and the weekly digest's email-keyed reads
-- (also service-role) are unaffected.

create policy "follows_select_own" on public.follows
  for select to authenticated
  using (user_id = auth.uid());

create policy "follows_insert_own" on public.follows
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "follows_delete_own" on public.follows
  for delete to authenticated
  using (user_id = auth.uid());

-- subscribers: authenticated users may read only their own row (so the
-- browser client can check "am I already on the list").
create policy "subscribers_select_own" on public.subscribers
  for select to authenticated
  using (user_id = auth.uid());
