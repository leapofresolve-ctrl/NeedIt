-- 0010 — Allow users to create/update their OWN profile row
--
-- The app's onboarding step writes the signed-in user's profile, but the
-- profiles table had no INSERT/UPDATE policy for the owner, so the write was
-- blocked by row-level security ("new row violates row-level security policy").
-- These policies scope the permission to strictly the user's own row
-- (auth.uid() = id) — a user can never touch anyone else's profile.
--
-- Idempotent: safe to run more than once.

alter table public.profiles enable row level security;

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
