-- 0006 — Admin metrics (M1 liquidity dashboard)
-- Adds profiles.is_admin and an admin-only SECURITY DEFINER function that
-- computes the M1 liquidity metrics straight from existing tables.
-- No new tracking events; everything derives from requests/offers/deals.
--
-- Gating: RLS can't gate a cross-user aggregate, so the pattern is a
-- SECURITY DEFINER function that first checks profiles.is_admin for
-- auth.uid() and raises for everyone else. The /metrics page ALSO checks
-- is_admin server-side before rendering.
--
-- ⚠️ Run this WHOLE file in the Supabase SQL editor (functions included),
-- then verify under Database → Functions. (Recurring lesson: partial runs
-- create tables but not functions, and the app fails silently.)

-- 1. Admin flag. Default false; flip on for the founder account.
alter table profiles
  add column if not exists is_admin boolean not null default false;

update profiles set is_admin = true where username = 'voloksvault';

-- 2. Metrics function.
create or replace function admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  result jsonb;
begin
  select p.is_admin into v_is_admin
  from public.profiles p
  where p.id = auth.uid();

  if v_is_admin is distinct from true then
    raise exception 'not authorized';
  end if;

  with published as (
    -- Every need that has ever been on the board. (Publish time isn't stored
    -- separately for private→published wants, so created_at is the baseline;
    -- fine for now since nearly all needs are posted straight to the board.)
    select r.id, r.created_at, r.status
    from public.requests r
    where r.visibility = 'public'
  ),
  first_offers as (
    select o.request_id, min(o.created_at) as first_offer_at
    from public.offers o
    join published p on p.id = o.request_id
    group by o.request_id
  ),
  ttfo as (
    select extract(epoch from (f.first_offer_at - p.created_at)) as secs
    from first_offers f
    join published p on p.id = f.request_id
    where f.first_offer_at >= p.created_at
  ),
  offer_counts as (
    select p.id, count(o.id)::int as n
    from published p
    left join public.offers o on o.request_id = p.id
    group by p.id
  ),
  days as (
    select generate_series(
      date_trunc('day', now()) - interval '6 days',
      date_trunc('day', now()),
      interval '1 day'
    ) as day
  ),
  trend as (
    select
      d.day::date as day,
      (select count(*) from published p
        where p.created_at >= d.day and p.created_at < d.day + interval '1 day') as needs,
      (select count(*) from public.offers o
        where o.created_at >= d.day and o.created_at < d.day + interval '1 day') as offers,
      (select count(*) from public.deals dl
        where dl.created_at >= d.day and dl.created_at < d.day + interval '1 day') as matches
    from days d
  )
  select jsonb_build_object(
    'published_needs',    (select count(*) from published),
    'needs_with_offer',   (select count(*) from first_offers),
    'pct_with_offer',     (select case when count(*) = 0 then null
                             else round(100.0 * (select count(*) from first_offers) / count(*), 1)
                           end from published),
    'ttfo_median_secs',   (select percentile_cont(0.5) within group (order by secs) from ttfo),
    'ttfo_p90_secs',      (select percentile_cont(0.9) within group (order by secs) from ttfo),
    'offers_total',       (select count(o.id) from public.offers o
                             join published p on p.id = o.request_id),
    'offers_per_need',    (select case when count(*) = 0 then null
                             else round(avg(n), 2) end from offer_counts),
    'offers_per_engaged_need', (select round(avg(n), 2) from offer_counts where n > 0),
    'avg_counter_rounds_negotiated', (select round(avg(o.counter_round), 2)
                             from public.offers o where o.counter_round > 0),
    'negotiated_offers',  (select count(*) from public.offers o where o.counter_round > 0),
    'matched_needs',      (select count(*) from published where status = 'matched'),
    'match_rate_pct',     (select case when count(*) = 0 then null
                             else round(100.0 * count(*) filter (where status = 'matched') / count(*), 1)
                           end from published),
    'trend',              (select jsonb_agg(jsonb_build_object(
                             'day', day, 'needs', needs, 'offers', offers, 'matches', matches
                           ) order by day) from trend)
  ) into result;

  return result;
end;
$$;

-- Only logged-in users may even attempt the call (the admin check does the rest).
revoke all on function admin_metrics() from public;
grant execute on function admin_metrics() to authenticated;
