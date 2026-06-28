-- 0002 — Private vs public wants
-- A "want" can be saved privately (a personal wishlist, only the owner sees it)
-- and later published to the board ("put the call out"). Expiry starts at publish.

-- 1. New column. Default 'public' so every existing need stays on the board.
alter table requests
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'private'));

-- Helps the board query (status='open' and visibility='public').
create index if not exists requests_visibility_status_idx
  on requests (visibility, status);

-- 2. Tighten read access. Replace the "any logged-in user can read every request"
--    policy so PRIVATE rows are visible only to their owner.
drop policy if exists "requests readable" on requests;

create policy "requests readable" on requests
  for select using (
    visibility = 'public'
    or (select auth.uid()) = buyer_id
  );
