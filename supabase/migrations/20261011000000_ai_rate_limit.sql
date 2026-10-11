-- Rate-limit log for the lingo-chat Edge Function (one row per AI request).
-- Only the Edge Function (service role) reads/writes it: RLS is on and there are no policies,
-- so the anon/authenticated keys used by the app cannot touch it.

create table if not exists public.ai_requests (
  id bigint generated always as identity primary key,
  key text not null,              -- "user:<uuid>" or "ip:<address>"
  created_at timestamptz not null default now()
);

create index if not exists ai_requests_key_created_at_idx on public.ai_requests (key, created_at desc);

alter table public.ai_requests enable row level security;

-- Housekeeping: drop rows older than a day (call from a scheduled job, or run manually now and then)
create or replace function public.prune_ai_requests() returns void
language sql security definer set search_path = public as $$
  delete from public.ai_requests where created_at < now() - interval '1 day';
$$;
revoke all on function public.prune_ai_requests() from public, anon, authenticated;
