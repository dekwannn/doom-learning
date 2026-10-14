-- Leaderboard XP and profiles: the app is a static site, so nothing the browser sends is trusted.
--
-- 1. xp_progress is only written by upsert_xp (no direct insert/update from the app any more), and upsert_xp
--    limits what one call and one day can add: at most 600 XP and 1 stage per call (a perfect stage with a
--    x2 combo is 600), at most 10 000 XP per language per day, only the app's languages, nothing negative.
-- 2. profiles.save_data (each learner's whole progress) is readable only by its owner, through get_my_save_data;
--    the public columns (name, avatar, streak, ...) stay readable for the leaderboard.
-- 3. Learners can change only their name, avatar and save_data on their own profile (not streak).

-- ── 1. XP ────────────────────────────────────────────────────────────────────────────────────────────
drop policy if exists xp_own_update on public.xp_progress;
drop policy if exists xp_own_insert on public.xp_progress;
revoke insert, update, delete, truncate on public.xp_progress from anon, authenticated;

alter table public.xp_progress
  add column if not exists xp_day date not null default current_date,
  add column if not exists xp_today integer not null default 0;

create or replace function public.upsert_xp(p_language_code text, p_xp_to_add integer, p_stages_to_add integer default 0)
returns public.xp_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_call constant integer := 600;
  max_per_day constant integer := 10000;
  uid uuid := auth.uid();
  add_xp integer := least(greatest(coalesce(p_xp_to_add, 0), 0), max_per_call);
  add_stages integer := least(greatest(coalesce(p_stages_to_add, 0), 0), 1);
  result public.xp_progress;
begin
  if uid is null then
    raise exception 'Sign in to earn leaderboard XP' using errcode = '42501';
  end if;
  if p_language_code is null or p_language_code not in ('en', 'ja', 'zh', 'ko') then
    raise exception 'Unknown language %', p_language_code using errcode = '22023';
  end if;

  insert into public.xp_progress as x (user_id, language_code, total_xp, stages_completed, xp_day, xp_today, updated_at)
  values (uid, p_language_code, add_xp, add_stages, current_date, add_xp, now())
  on conflict (user_id, language_code) do update set
    -- what is still allowed today: the daily limit minus what was already added today
    total_xp = x.total_xp + greatest(0, least(excluded.xp_today,
      max_per_day - case when x.xp_day = current_date then x.xp_today else 0 end)),
    xp_today = case when x.xp_day = current_date then x.xp_today else 0 end + greatest(0, least(excluded.xp_today,
      max_per_day - case when x.xp_day = current_date then x.xp_today else 0 end)),
    xp_day = current_date,
    stages_completed = x.stages_completed + excluded.stages_completed,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.upsert_xp(text, integer, integer) from public, anon;
grant execute on function public.upsert_xp(text, integer, integer) to authenticated;

-- ── 2 & 3. Profiles ──────────────────────────────────────────────────────────────────────────────────
revoke select, update on public.profiles from anon, authenticated;
grant select (id, username, avatar_url, streak, last_active, created_at) on public.profiles to anon, authenticated;
grant update (username, avatar_url, save_data) on public.profiles to authenticated;

create or replace function public.get_my_save_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select save_data from public.profiles where id = auth.uid();
$$;

revoke all on function public.get_my_save_data() from public, anon;
grant execute on function public.get_my_save_data() to authenticated;

-- The sign-up trigger runs with full rights: give it a fixed search_path too
alter function public.handle_new_user() set search_path = public;
