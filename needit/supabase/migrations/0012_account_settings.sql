-- 0012 — Account settings (3b)
--
-- Settings was a single "email me about activity" checkbox. This adds the
-- columns behind a real settings surface: identity, per-event notification
-- control, buying/selling defaults, privacy, and a safe account-closure path.
--
-- Design notes:
--  * Per-event notification prefs are individual boolean columns rather than a
--    jsonb blob, so they're cheap to filter on from the notification triggers
--    and can't drift into malformed shapes.
--  * `email_notifications` is retained as the master switch. An event email
--    sends only when the master switch AND the per-event switch are on, so the
--    existing opt-out keeps working exactly as it does today.
--  * Account deletion is a *request* with a grace period, not an immediate
--    hard delete: the account deactivates at once (profile hidden, needs
--    pulled from the board) but the row survives long enough to undo a
--    mistake or resolve a deal that was in flight.

alter table public.profiles
  -- Identity
  add column if not exists display_name          text,
  add column if not exists username_changed_at   timestamptz,

  -- Account type: one account always; "seller" is a reversible upgrade, never
  -- a separate signup path. See exprifi-3b-facelift-and-access-spec.md §4.2.
  add column if not exists is_seller             boolean not null default false,

  -- Per-event email notifications (gated by email_notifications master switch)
  add column if not exists notify_offer_received boolean not null default true,
  add column if not exists notify_counter        boolean not null default true,
  add column if not exists notify_your_move      boolean not null default true,
  add column if not exists notify_offer_decided  boolean not null default true,
  add column if not exists notify_match          boolean not null default true,
  add column if not exists notify_demand_match   boolean not null default true,
  add column if not exists notify_expiring       boolean not null default true,
  add column if not exists notify_digest         boolean not null default true,
  add column if not exists notify_product        boolean not null default false,

  -- Buying defaults (prefill the post-a-need form)
  add column if not exists default_expiry_hours  integer,
  add column if not exists default_sport         text,
  add column if not exists default_private       boolean not null default false,

  -- Selling profile
  add column if not exists ships_from_state      text,
  add column if not exists handling_time_days    integer,

  -- Privacy
  add column if not exists profile_public        boolean not null default true,
  add column if not exists allow_indexing        boolean not null default true,

  -- Account closure (grace period, see note above)
  add column if not exists deletion_requested_at timestamptz;

-- Guard rails on the free-text/numeric fields. Named constraints added
-- conditionally so this migration stays re-runnable.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_len') then
    alter table public.profiles
      add constraint profiles_display_name_len
      check (display_name is null or char_length(display_name) between 1 and 40);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_default_expiry_valid') then
    alter table public.profiles
      add constraint profiles_default_expiry_valid
      check (default_expiry_hours is null or default_expiry_hours in (24, 72, 168));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_handling_time_valid') then
    alter table public.profiles
      add constraint profiles_handling_time_valid
      check (handling_time_days is null or handling_time_days between 1 and 30);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_ships_from_len') then
    alter table public.profiles
      add constraint profiles_ships_from_len
      check (ships_from_state is null or char_length(ships_from_state) <= 40);
  end if;
end $$;

-- Deactivated accounts must disappear from public surfaces immediately, even
-- though the row is retained through the grace period.
create index if not exists profiles_deletion_requested_idx
  on public.profiles (deletion_requested_at)
  where deletion_requested_at is not null;

comment on column public.profiles.is_seller is
  'Seller mode. One account always does both; this only gates seller tooling and the Pro upgrade path.';
comment on column public.profiles.deletion_requested_at is
  'Set when the member closes their account. Account is deactivated immediately; hard deletion happens after the grace period.';
comment on column public.profiles.username_changed_at is
  'Last username change. Enforces the 30-day cooldown — usernames are the trust anchor and silent swapping is a scam vector.';
