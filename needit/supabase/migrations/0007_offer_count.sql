-- 0007 — Public offer-count badge (social proof, leak-safe)
-- Offer ROWS are private to the buyer via RLS, so the board can't count them.
-- Denormalize an aggregate-only counter onto requests (already publicly
-- readable) and keep it in sync with a SECURITY DEFINER trigger on offers.
-- Only the number is ever exposed — never who offered or at what price.
--
-- ⚠️ Run this WHOLE file in the Supabase SQL editor, then verify the trigger
-- exists under Database → Triggers (recurring lesson: partial runs fail silently).

alter table requests
  add column if not exists offer_count integer not null default 0;

create or replace function sync_offer_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_request_id uuid := coalesce(NEW.request_id, OLD.request_id);
begin
  update public.requests r
    set offer_count = (
      select count(*) from public.offers o where o.request_id = v_request_id
    )
    where r.id = v_request_id;
  return null;
end;
$fn$;

drop trigger if exists offers_count_sync on offers;
create trigger offers_count_sync
  after insert or delete on offers
  for each row execute function sync_offer_count();

-- Backfill existing rows.
update requests r
  set offer_count = (select count(*) from offers o where o.request_id = r.id);
