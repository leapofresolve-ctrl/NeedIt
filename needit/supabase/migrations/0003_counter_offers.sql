-- 0003 — Counter-offers
-- Lightweight, structured price negotiation (no chat). The negotiation lives on
-- the offer row: current_price_cents is the live ask, counter_by records who made
-- the last move (null = seller's original offer), counter_round bounds the haggling.
-- The party who did NOT make the last move is the one who can accept/counter/decline.

alter table offers
  add column if not exists current_price_cents integer;
update offers
  set current_price_cents = price_cents
  where current_price_cents is null;
alter table offers
  alter column current_price_cents set not null;

alter table offers
  add column if not exists counter_by text check (counter_by in ('buyer', 'seller'));
alter table offers
  add column if not exists counter_round integer not null default 0;

-- ===== accept_offer: party-aware, locks in the live price =====
create or replace function accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer   public.offers;
  v_request public.requests;
  v_uid     uuid := auth.uid();
begin
  select * into v_offer from public.offers where id = p_offer_id;
  if not found then raise exception 'offer not found'; end if;

  select * into v_request from public.requests where id = v_offer.request_id;
  if not found then raise exception 'request not found'; end if;

  if v_request.status <> 'open' then raise exception 'request not open'; end if;
  if v_offer.status <> 'pending' then raise exception 'offer not actionable'; end if;

  -- The accepting party is whoever did NOT make the last move.
  if v_offer.counter_by = 'buyer' then
    if v_uid <> v_offer.seller_id then raise exception 'not your turn'; end if;
  else
    -- counter_by is null (seller's original) or 'seller'
    if v_uid <> v_request.buyer_id then raise exception 'not your turn'; end if;
  end if;

  update public.offers
    set status = 'accepted',
        price_cents = coalesce(current_price_cents, price_cents)
    where id = p_offer_id;

  update public.offers
    set status = 'declined'
    where request_id = v_offer.request_id
      and id <> p_offer_id
      and status = 'pending';

  update public.requests set status = 'matched' where id = v_offer.request_id;

  insert into public.deals (request_id, offer_id, buyer_id, seller_id)
  values (v_offer.request_id, p_offer_id, v_request.buyer_id, v_offer.seller_id);
end;
$$;

-- ===== decline_offer: either party may end the negotiation =====
create or replace function decline_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer   public.offers;
  v_request public.requests;
  v_uid     uuid := auth.uid();
begin
  select * into v_offer from public.offers where id = p_offer_id;
  if not found then raise exception 'offer not found'; end if;

  select * into v_request from public.requests where id = v_offer.request_id;
  if not found then raise exception 'request not found'; end if;

  if v_uid <> v_offer.seller_id and v_uid <> v_request.buyer_id then
    raise exception 'not a party to this offer';
  end if;
  if v_offer.status <> 'pending' then raise exception 'offer not actionable'; end if;

  update public.offers set status = 'declined' where id = p_offer_id;
end;
$$;

-- ===== counter_offer: propose a new price, hand the turn to the other party =====
create or replace function counter_offer(p_offer_id uuid, p_price_cents integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer   public.offers;
  v_request public.requests;
  v_uid     uuid := auth.uid();
  v_role    text;
  v_max     integer := 10;  -- total counters allowed (≈5 per side)
begin
  if p_price_cents is null or p_price_cents <= 0 then
    raise exception 'price must be greater than 0';
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  if not found then raise exception 'offer not found'; end if;

  select * into v_request from public.requests where id = v_offer.request_id;
  if not found then raise exception 'request not found'; end if;

  if v_request.status <> 'open' then raise exception 'request not open'; end if;
  if v_offer.status <> 'pending' then raise exception 'offer not actionable'; end if;
  if v_offer.counter_round >= v_max then raise exception 'counter limit reached'; end if;

  -- Whose turn is it? (the party who did NOT make the last move)
  if v_offer.counter_by = 'buyer' then
    v_role := 'seller';
    if v_uid <> v_offer.seller_id then raise exception 'not your turn'; end if;
  else
    v_role := 'buyer';
    if v_uid <> v_request.buyer_id then raise exception 'not your turn'; end if;
  end if;

  update public.offers
    set current_price_cents = p_price_cents,
        counter_by = v_role,
        counter_round = counter_round + 1
    where id = p_offer_id;
end;
$$;
