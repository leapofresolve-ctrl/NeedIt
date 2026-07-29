# Handoff prompt — reconcile migration 0015 across two Cowork sessions

*Copy everything below the line into the other chat. Written Jul 29, 2026.*

---

Before you do anything else: **do not write, edit, or run any SQL in this session yet.** I have two Cowork chats open on the Exprifi codebase at the same time and I think both of them have been working on the same database migration. I need you to audit the current state and report back before anything changes.

## Context you need

- Repo is at `~/Desktop/NeedIt`. The Next.js app is in `needit/`. Working docs are in `Developing NeedIt Official/`.
- Exprifi is a reverse marketplace for sports cards (internal codename "needit"). Launch is Sep 26, 2026 — it is **not** launched yet.
- In my other session, a migration was written to `needit/supabase/migrations/0015_public_browsing_rls.sql`. Its job: open the site to logged-out browsing safely. It adds explicit `anon`-role RLS on `requests` and `profiles`, adds **column-level** GRANTs on `profiles` (so anon can't read `is_admin`, `stripe_account_id`, notification prefs, etc.), revokes anon access to `offers`/`deals`/`notifications`/`demand_alerts`/`seller_inventory`, and ends with a runnable deny-test `DO` block.
- It was paired with a change to `needit/lib/supabase/proxy.ts` that **inverted the auth gate from an allowlist to a denylist**, so anonymous visitors now reach the board and need pages. That means the database is now the only real access boundary.
- **As of that session, 0015 had NOT been run in Supabase yet.** I don't know what the other session did after that.
- There are ~15 uncommitted modified files and ~13 untracked new files in the repo. Nothing has been committed or pushed.

## The specific risk

`0015` contains a `DO` block that loops over `pg_policies` and **drops every SELECT policy on `public.profiles`** before recreating two of its own. That is deliberate — RLS policies are OR'd, so leaving an unknown permissive policy in place would silently override anything restrictive. But it means:

- If two different versions of 0015 exist, whichever ran last defines who can read `profiles`.
- If one version already ran and a *different* version runs after it, the policies from the first are gone.
- If a session wrote a `0016` that assumes 0015's policy names, and 0015 was replaced, that breaks too.

## What I want you to do — audit only, change nothing

1. List everything in `needit/supabase/migrations/`. Report the exact filenames and the modification timestamp of anything numbered 0015 or higher.
2. Read `needit/supabase/migrations/0015_public_browsing_rls.sql` in full. Summarise: which tables it touches, which policies it drops, which it creates, which column GRANTs it issues, and whether it ends with a deny-test block.
3. Check whether more than one file in that directory tries to modify `profiles` or `requests` policies. If two files fight over the same policy, say so explicitly.
4. Read `needit/lib/supabase/proxy.ts` and report whether the auth gate is currently an allowlist or a denylist, and which routes are listed as protected.
5. Run `git status` and `git log --oneline -5` from `~/Desktop/NeedIt` (read-only — **do not** commit, stage, or push; git is run by me from my own terminal, never from the sandbox, because it leaves a stale `.git/index.lock`).
6. Check `Developing NeedIt Official/build-log.md` for the most recent entry and tell me what it claims was completed.

## Then tell me, in plain terms

- Is there exactly one 0015, or more than one?
- Does what's on disk match what the build log claims?
- If I run the 0015 that's currently on disk in the Supabase SQL editor, what will it do, and is there anything in it that could break a signed-in user's ability to read profiles or the board?
- Is there anything in this repo right now that two sessions have both edited and that looks contradictory?

**Do not write files, do not run SQL, do not change the migration.** Report first. I'll decide what to do after I've heard from both sessions.
