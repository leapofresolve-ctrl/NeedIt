-- 0013 — Sign in with username OR email (3b)
--
-- Supabase Auth is keyed on email, so signing in with a username needs a
-- username → email resolver. This is trivially easy to build as an accidental
-- data breach, so the guard rails below are not optional.
--
-- THREAT: an unauthenticated caller invokes the resolver in a loop with common
-- usernames and walks away with an email list for every member on the platform.
-- On a marketplace whose entire premise is pseudonymity — where the whole point
-- is that your identity is hidden until a deal is agreed — that is the single
-- worst leak available.
--
-- DEFENCES, all three required:
--   1. SECURITY DEFINER with a pinned empty search_path (our standing pattern).
--   2. EXECUTE revoked from anon AND authenticated. The only caller is the
--      server action, going through the service-role client. The browser can
--      never reach this function.
--   3. The calling action returns an identical message and burns identical time
--      whether the username is unknown or the password is wrong, so failures
--      are indistinguishable. Rate limiting lives with the action.

create or replace function public.resolve_login_email(identifier text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(identifier))
    and p.deletion_requested_at is null
  limit 1;
$$;

comment on function public.resolve_login_email(text) is
  'Username → email for sign-in. SERVER-SIDE ONLY: execute is revoked from anon and authenticated. Exposing this to the browser turns it into a member email-enumeration endpoint.';

-- Lock it down. `public` is included because Postgres grants EXECUTE to PUBLIC
-- on new functions by default — without this revoke, the two below are moot.
revoke all on function public.resolve_login_email(text) from public;
revoke all on function public.resolve_login_email(text) from anon;
revoke all on function public.resolve_login_email(text) from authenticated;

-- Case-insensitive uniqueness on usernames. Without this, "Kyle" and "kyle"
-- can both exist and the resolver's lower() match becomes ambiguous — which is
-- also a straightforward impersonation vector.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));
