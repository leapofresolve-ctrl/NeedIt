-- 0008 — Seller demand alerts (inverted saved search)
-- Sellers save criteria describing what they're sitting on; when a matching
-- need is PUBLISHED to the board, they get a notification through the existing
-- pipeline (bell + email webhook, opt-out respected by the email route).
-- Leak-safe: alerts never expose the seller; the notification just links the
-- public need. This is deliberately criteria-only — NO inventory/catalog
-- (that's Lane 1 / M2).
--
-- ⚠️ Run this WHOLE file, then verify function + BOTH triggers in the dashboard.

create table if not exists demand_alerts (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references profiles(id) on delete cascade,
  keyword          text,                                   -- matches title/description, ilike
  sport            text,                                   -- exact match, null = any
  type             text check (type in ('single', 'bulk')),-- null = any
  min_budget_cents integer,
  max_budget_cents integer,
  active           boolean not null default true,
  created_at       timestamptz default now()
);

create index if not exists demand_alerts_seller_idx on demand_alerts (seller_id);
create index if not exists demand_alerts_active_idx on demand_alerts (active) where active;

alter table demand_alerts enable row level security;

drop policy if exists "own alerts select" on demand_alerts;
create policy "own alerts select" on demand_alerts
  for select using ((select auth.uid()) = seller_id);

drop policy if exists "own alerts insert" on demand_alerts;
create policy "own alerts insert" on demand_alerts
  for insert with check ((select auth.uid()) = seller_id);

drop policy if exists "own alerts update" on demand_alerts;
create policy "own alerts update" on demand_alerts
  for update using ((select auth.uid()) = seller_id);

drop policy if exists "own alerts delete" on demand_alerts;
create policy "own alerts delete" on demand_alerts
  for delete using ((select auth.uid()) = seller_id);

-- ===== Matching: fire when a need is published (posted public, or
-- private→public later). One notification per matching seller, never the buyer.
create or replace function notify_demand_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  -- Only when the row is publicly on the board and open.
  if NEW.visibility <> 'public' or NEW.status <> 'open' then
    return null;
  end if;
  -- On UPDATE, only the moment it BECOMES public (avoid refiring on edits).
  if TG_OP = 'UPDATE' and OLD.visibility = 'public' then
    return null;
  end if;

  insert into public.notifications (user_id, type, request_id)
  select distinct a.seller_id, 'demand_match', NEW.id
  from public.demand_alerts a
  where a.active
    and a.seller_id <> NEW.buyer_id
    and (a.type is null or a.type = NEW.type::text)
    and (a.sport is null or a.sport = NEW.sport)
    and (a.keyword is null
         or NEW.title ilike '%' || a.keyword || '%'
         or coalesce(NEW.description, '') ilike '%' || a.keyword || '%')
    and (a.min_budget_cents is null or NEW.budget_cents is null
         or NEW.budget_cents >= a.min_budget_cents)
    and (a.max_budget_cents is null or NEW.budget_cents is null
         or NEW.budget_cents <= a.max_budget_cents);

  return null;
end;
$fn$;

drop trigger if exists demand_match_on_insert on requests;
create trigger demand_match_on_insert
  after insert on requests
  for each row execute function notify_demand_match();

drop trigger if exists demand_match_on_publish on requests;
create trigger demand_match_on_publish
  after update of visibility on requests
  for each row execute function notify_demand_match();
