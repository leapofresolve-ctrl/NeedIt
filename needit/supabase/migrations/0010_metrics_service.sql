-- 0010 — Machine-readable metrics + concierge targets (for the Claude agents)
-- Two SECURITY DEFINER functions that the token-protected API routes call via
-- the service-role client. They compute the same M1 numbers as admin_metrics()
-- (0006) but skip the per-user is_admin check, because the gate here is the
-- bearer token on /api/metrics/* plus service_role-only execute grants — not a
-- logged-in session. Nothing new is tracked; everything derives from
-- requests/offers/deals, exactly like the dashboard.
--
-- ⚠️ Run this WHOLE file in the Supabase SQL editor (functions included), then
-- verify under Database → Functions. (Recurring lesson: partial runs create
-- some objects but not others and the endpoint fails silently.)

-- 1. Metrics snapshot — identical query to admin_metrics(), no auth gate.
create or replace function metrics_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  with published as (
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

revoke all on function metrics_snapshot() from public;
revoke all on function metrics_snapshot() from authenticated;
grant execute on function metrics_snapshot() to service_role;

-- 2. Concierge targets — open, public needs with ZERO offers that expire within
-- the given window, most-urgent first. This is the daily worklist for the
-- Concierge Scout agent: which needs are about to die unanswered, and enough
-- context to draft seller outreach. Contact info is never exposed — only the
-- buyer's pseudonym, matching the platform's masked-identity rule.
create or replace function concierge_targets(hours_ahead int default 48)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select coalesce(jsonb_agg(t order by t.expires_at asc), '[]'::jsonb)
  into result
  from (
    select
      r.id,
      r.title,
      r.type,
      r.sport,
      r.budget_cents,
      r.condition_pref,
      r.expires_at,
      round(extract(epoch from (r.expires_at - now())) / 3600.0, 1) as hours_left,
      r.created_at,
      p.username as buyer_username
    from public.requests r
    join public.profiles p on p.id = r.buyer_id
    where r.visibility = 'public'
      and r.status = 'open'
      and r.offer_count = 0
      and r.expires_at is not null
      and r.expires_at > now()
      and r.expires_at <= now() + make_interval(hours => hours_ahead)
  ) t;

  return result;
end;
$$;

revoke all on function concierge_targets(int) from public;
revoke all on function concierge_targets(int) from authenticated;
grant execute on function concierge_targets(int) to service_role;
