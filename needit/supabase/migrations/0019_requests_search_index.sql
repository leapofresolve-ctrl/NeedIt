-- ============================================================
-- EXPRIFI — migration 0019: trigram index for board search
-- Aug 8, 2026.  Run this whole file in the Supabase SQL Editor.
-- Safe to run more than once.
--
-- ⚠️  THIS FILE TOUCHES NO POLICY ON `requests`, DELIBERATELY.
--     Migrations 0002 and 0015 both create a policy named "requests readable".
--     Re-running 0002 silently kills public browsing. Nothing below drops,
--     creates or alters a policy, and the VERIFY block re-lists pg_policies as
--     a paranoia check.
--
-- WHY THIS EXISTS
--
-- The board's locked header shipped with a search field (3b addendum §2.3a).
-- It is deliberately dumb — plain text across `title` and `description`, no
-- parsing of "under 500", nothing structured — and it debounces at 350ms with
-- a 2-character minimum. Which still means it runs a query on very nearly every
-- keystroke, and that query is:
--
--   ... or(title.ilike.%foo%, description.ilike.%foo%)
--
-- A LEADING-wildcard ILIKE cannot use a btree index. Postgres has no choice but
-- to sequentially scan every open, public need and lower-case both columns for
-- each one. At 0 needs that's instant; at a few thousand it's a full table scan
-- per keystroke per seller, and the first symptom is the search field feeling
-- broken under exactly the load that means the product is working.
--
-- §3 of the addendum called this out as a ship blocker — "add a trigram or FTS
-- index before shipping — this runs on every keystroke" — and it was missed.
-- The search shipped in 181a8c6 without it.
--
-- WHY TRIGRAM AND NOT FULL-TEXT SEARCH
--
-- FTS (to_tsvector / websearch_to_tsquery) is the better tool for long prose
-- and word-stem matching. It is the WRONG tool here for two reasons:
--
--   1. It matches lexemes, not substrings. A seller typing "jordan" would hit
--      "Jordan", but typing "prizm sil" mid-word would not hit "Prizm Silver",
--      and typing a partial set name is exactly how people search a card board.
--      Trigram indexes accelerate the leading-wildcard ILIKE we already run, so
--      the behaviour the seller sees does not change at all — only the speed.
--
--   2. Swapping to FTS would change which rows match, which would put the query
--      back out of step with `matches()` in lib/board-facets.ts, and the counts
--      in the rail would start disagreeing with the rows on the board. That
--      invariant has already drifted once. An index that changes nothing about
--      the result set cannot break it.
--
-- Revisit if the board ever carries long descriptions and relevance ranking
-- starts mattering more than substring hits. It doesn't today.
--
-- COST
--
-- Two GIN indexes on a table with 0 rows: nothing. Writes to `requests` are
-- rare (a need is posted once and read many times), so the write amplification
-- GIN normally costs you is not a concern on this table.
-- ============================================================


-- ===== 1. The extension =====================================================
-- Supabase ships pg_trgm available but not always enabled, and installs
-- extensions into a schema that is NOT public on newer projects.
create extension if not exists pg_trgm;


-- ===== 2. The indexes =======================================================
-- gin_trgm_ops lives wherever pg_trgm was installed, so schema-qualify it from
-- the catalog rather than assuming `public` or `extensions`. Same defensive
-- pattern as cards_player_trgm_idx in 0014 — copied on purpose, because that
-- one was written after this exact assumption failed.
do $$
declare
  trgm_schema text;
begin
  select n.nspname into trgm_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'pg_trgm';

  if trgm_schema is null then
    raise exception 'pg_trgm is not installed — cannot create the search indexes';
  end if;

  -- Two separate indexes rather than one over `title || description`:
  -- PostgREST's or() emits two independent ilike predicates, and the planner
  -- can only use an index that matches a predicate as written. A concatenated
  -- expression index would sit there unused.
  execute format(
    'create index if not exists requests_title_trgm_idx '
    'on requests using gin (title %I.gin_trgm_ops)',
    trgm_schema
  );

  execute format(
    'create index if not exists requests_description_trgm_idx '
    'on requests using gin (description %I.gin_trgm_ops)',
    trgm_schema
  );
end $$;


-- ===== 3. Comments ==========================================================
comment on index requests_title_trgm_idx is
  'Accelerates the leading-wildcard ILIKE behind the board search field (3b addendum §2.3a). Does not change which rows match — only how fast they are found — which is deliberate: the result set must stay identical to matches() in lib/board-facets.ts or the rail counts drift from the board rows.';

comment on index requests_description_trgm_idx is
  'Pair of requests_title_trgm_idx. PostgREST or() emits two independent ilike predicates, so each column needs its own index.';


-- ============================================================
-- VERIFY — run after the file above and eyeball the output.
-- Expect: 1 extension row, 2 index rows.
-- ============================================================
select 'extension' as kind, extname as name
  from pg_extension where extname = 'pg_trgm'
union all
select 'index', indexname from pg_indexes
 where schemaname = 'public'
   and indexname in ('requests_title_trgm_idx','requests_description_trgm_idx')
 order by 1, 2;

-- Public browsing must still work. 0019 does not touch policies; this is the
-- paranoia check for the 0002/0015 "requests readable" collision.
select policyname, cmd from pg_policies
 where schemaname = 'public' and tablename = 'requests';

-- Sanity: the search still returns what it returned before. Substitute any
-- string. This is a behaviour check, not a performance one — at 0 rows the
-- planner will seq scan regardless and that is fine.
select id, title
  from requests
 where status = 'open'
   and visibility = 'public'
   and (title ilike '%jordan%' or description ilike '%jordan%');
