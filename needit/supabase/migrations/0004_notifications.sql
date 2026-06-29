-- 0004 — Notifications
-- In-app notifications so a seller doesn't have to sit on their profile to catch
-- a counter. Rows are written by a SECURITY DEFINER trigger on `offers`, so they
-- stay consistent no matter how an offer changes (new offer / counter / accept / decline).

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,  -- recipient
  type       text not null,            -- 'new_offer' | 'counter' | 'accepted' | 'declined'
  request_id uuid references requests(id) on delete cascade,
  offer_id   uuid references offers(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);

alter table notifications enable row level security;

-- You can only see and update (mark read) your own notifications.
drop policy if exists "own notifications readable" on notifications;
create policy "own notifications readable" on notifications
  for select using ((select auth.uid()) = user_id);

drop policy if exists "update own notifications" on notifications;
create policy "update own notifications" on notifications
  for update using ((select auth.uid()) = user_id);
-- No INSERT policy on purpose: only the SECURITY DEFINER trigger writes rows.

-- ===== Trigger: generate notifications from offer activity =====
create or replace function notify_offer_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_buyer     uuid;
  v_uid       uuid := auth.uid();
  v_recipient uuid;
  v_type      text;
begin
  select buyer_id into v_buyer from public.requests where id = NEW.request_id;

  if TG_OP = 'INSERT' then
    v_type := 'new_offer';
    v_recipient := v_buyer;                       -- the need's owner gets pinged
  elsif TG_OP = 'UPDATE' then
    if OLD.status = 'pending' and NEW.status = 'accepted' then
      v_type := 'accepted';
      v_recipient := case when v_uid = NEW.seller_id then v_buyer else NEW.seller_id end;
    elsif OLD.status = 'pending' and NEW.status = 'declined' then
      v_type := 'declined';
      v_recipient := case when NEW.seller_id <> v_uid then NEW.seller_id else v_buyer end;
    elsif NEW.counter_round > OLD.counter_round then
      v_type := 'counter';
      v_recipient := case when NEW.counter_by = 'buyer' then NEW.seller_id else v_buyer end;
    else
      return NEW;
    end if;
  else
    return NEW;
  end if;

  -- Never notify the person who performed the action.
  if v_recipient is not null and v_recipient <> coalesce(v_uid, '00000000-0000-0000-0000-000000000000'::uuid) then
    insert into public.notifications (user_id, type, request_id, offer_id)
    values (v_recipient, v_type, NEW.request_id, NEW.id);
  end if;

  return NEW;
end; $$;

drop trigger if exists offers_notify_ins on offers;
create trigger offers_notify_ins
  after insert on offers
  for each row execute function notify_offer_change();

drop trigger if exists offers_notify_upd on offers;
create trigger offers_notify_upd
  after update on offers
  for each row execute function notify_offer_change();
