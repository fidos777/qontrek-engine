create extension if not exists pgcrypto;
create table if not exists notify_dlq (
  dlq_id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  channel text not null check (channel in ('slack','whatsapp','email')),
  payload jsonb not null,
  retry_count int not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  payload_checksum text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_notify_dlq_next on notify_dlq(next_attempt_at);
