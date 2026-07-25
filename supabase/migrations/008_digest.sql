-- 008: weekly digest — recommendation de-duplication.
--
-- The digest's "worth the journey" section picks from EVERY company, so the
-- same production could otherwise be recommended to the same reader week after
-- week. One row per (email, performance) makes a recommendation permanent:
-- once suggested, never suggested again. The reader's own followed companies
-- are NOT filtered by this — "this week on stage" repeats a run across the
-- weeks it is playing, which is the point of a calendar.
--
-- Weekly idempotency itself needs no new table: notification_log already has
-- UNIQUE (batch_id, email), and the digest writes batch_id = 'digest:<ISO week>'.

create table if not exists digest_recommendations (
  id bigint generated always as identity primary key,
  email text not null,
  performance_id text not null,
  sent_at timestamptz not null default now(),
  unique (email, performance_id)
);

create index if not exists digest_recommendations_email_idx
  on digest_recommendations (email);

-- RLS on with no policies = service-role only (same posture as 005/007).
alter table digest_recommendations enable row level security;
