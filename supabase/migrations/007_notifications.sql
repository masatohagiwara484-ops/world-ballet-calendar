-- 007: follower email alerts — unsubscribe support + send log.
--
-- subscribers gains a per-address unsubscribe token (emailed in every alert's
-- footer + List-Unsubscribe header) and an unsubscribed_at timestamp. The
-- notification_log's (batch_id, email) unique pair is the idempotency guard:
-- a double-tapped approval or a retried webhook can never email twice.

alter table subscribers
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists token uuid not null default gen_random_uuid();

-- Token must be unique (it is the unsubscribe credential).
create unique index if not exists subscribers_token_idx on subscribers (token);

create table if not exists notification_log (
  id bigint generated always as identity primary key,
  batch_id text not null,
  email text not null,
  sent_at timestamptz not null default now(),
  unique (batch_id, email)
);

create index if not exists notification_log_batch_idx on notification_log (batch_id);

-- RLS on with no policies = service-role only (same posture as 005_audience).
alter table notification_log enable row level security;
