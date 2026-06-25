# Needit — Master Plan & Day-One Build Guide

*A reverse marketplace for the card hobby. Buyers post what they need; sellers bring it to them.*

**How to use this doc:** Part 1 locks the strategy so you stop re-litigating it. Part 2 is the exact build you execute tomorrow — copy-paste SQL, copy-paste Cursor prompts, and an hour-by-hour schedule. The single goal for tomorrow is one working vertical slice, not a finished product.

---

# PART 1 — THE PLAN

## 1.1 The one-sentence version

Needit is a **reverse marketplace for sports cards**: a buyer posts the card or lot they want, and sellers come to *them* with structured offers — starting with the bulk / low-end "treasure-hunt" crowd you already reach, then climbing up-market into high-value singles where the money is.

## 1.2 Why *reverse*, and why that's the whole moat

A forward marketplace (eBay, Whatnot, CollX) is "list it and hope a buyer comes." Everyone already does that. Needit inverts it.

| | Forward marketplace | Reverse marketplace (Needit) |
|---|---|---|
| Who acts first | Seller lists | Buyer posts a need |
| Seller effort | High (list everything, hope) | Low (respond only to confirmed demand) |
| Buyer experience | Scroll endlessly | Post once, offers come to you |
| Unique data created | What *sold* | **What people want and can't find** ← the moat |

That last row is the asset no competitor has: a clean, real-time map of unmet demand. It's valuable to dealers (what to stock), breakers (what to rip), and eventually manufacturers. A calculator could never produce it.

## 1.3 The two-lane architecture

**Lane 1 — Instant Match (the differentiator).** Buyer posts a *single card* picked from a catalog → the system checks digitized seller inventories → privately pings only the sellers who already own it: "someone wants this, name your price." Zero browsing, zero public posting, leak-resistant.

**Lane 2 — Open Board (the workhorse, and your MVP).** Bulk lots and "filter" requests ("all your /99 rookies," "a Cowboys lot") *can't* be catalog-matched, so they post to an open board sorted by sport / low-end / high-end / bulk. Single cards with no inventory match also spill here.

| | Lane 1 — Instant Match | Lane 2 — Open Board |
|---|---|---|
| Handles | Catalogable single cards | Bulk lots + filter requests + unmatched singles |
| Requires | Digitized seller inventory | Nothing |
| Build complexity | High (catalog + inventory + matching) | Low |
| **Build order** | **Milestone 2+** | **Build first (tomorrow)** |

The lucky alignment: your audience is bulk/low-end, bulk *only* works on Lane 2, and Lane 2 is the cheap thing to build. The product you build first is exactly the product your audience wants.

### Lane 1 in detail — the price-match engine (Milestone 2)

The mechanic, step by step:

1. Buyer picks a card from the catalog and sets a **max price** they'll pay.
2. The system queries seller inventories and instantly reports: **is there a match, and how many matches sit at or under the buyer's max?**
3. The system suggests an **opening offer** — *not* literally the lowest, but the **lowest offer likely to be accepted** (at or just under the cheapest matching seller's ask). Save the buyer money without lowballing sellers into silence.
4. The offer is **broadcast to all matching sellers in range**, who can accept or counter.
5. **Sellers race — first to accept claims the sale.** The buyer gets their card at their price no matter which seller fills it, so the buyer is happy by default; the sellers compete on speed.
6. **A final confirmation locks the deal:** the accepting seller confirms the card is still in hand *and* the buyer gives a final yes. Only then does the deal commit — atomically — and every other seller's offer voids. This double-confirm is the guard against stale inventory and accidental matches.
7. *Later:* seller **auto-accept** — a standing rule ("auto-sell this card to any offer ≥ $X"), effectively a hidden reserve that closes a deal instantly. Pure liquidity.

**Implementation flags (don't skip these at M2):**
- **Concurrency:** the seller race + buyer final-yes must resolve in one atomic transaction with a row lock / status guard, so exactly one deal commits and the card is never double-sold; all sibling offers void in the same transaction.
- **The final-confirm step is load-bearing**, not optional polish — it's what makes a match against possibly-stale inventory trustworthy.
- **Offer etiquette:** the suggested opening is pegged to the cheapest seller's ask — competitive, never an insulting lowball, or sellers disengage and the lane dies.

## 1.4 The four leak-defense rules (non-negotiable from day one of payments)

Matching marketplaces die when buyer and seller connect, then transact off-platform to dodge your fee. Designed-in defenses:

1. **No public chat.** Seller responses are *structured offers* (price · condition · photo), not free-text messages.
2. **Private accounts / masked identity** until a deal is funded.
3. **Escrow only exists on-platform** (Stripe Connect) — going around you means losing buyer protection.
4. **Shipping + protection live inside the deal**, so on-platform is the path of least resistance.

*(For tomorrow's no-payments MVP these are partially stubbed — see §1.8 — but the data model is built so they slot in cleanly.)*

## 1.5 Go-to-market: the Whatnot-seller beachhead

Your sharpest unlock: target **bulk/low-end resellers, breakers, and treasure-hunters** — the audience you already have. They are *both sides at once*: they buy constantly to resell/rip, **and** they sit on inventory to sell. Acquiring one of them seeds both sides of the marketplace. That is the closest thing to a cold-start cheat code.

## 1.6 Monetization: ignition vs. revenue (they're different audiences)

The uncomfortable truth: **the audience that's cheapest to ignite is the worst to monetize.** 5% of an $8 lot is 40¢, and Stripe eats most of it. So split the two jobs:

| Lane | Audience | Monetization | Why |
|---|---|---|---|
| Bulk / low-end | Treasure-hunters, breakers, flippers | **Subscription** for repeat buyers (or small flat per-deal minimum) | Percentage can't survive low tickets; high-frequency repeat users suit flat pricing |
| High-end singles | Serious collectors/investors (grow into) | **5% finder's fee** | Take rate + demand-data moat only pay at higher value |

Early bulk activity runs at roughly break-even — treat it as **customer acquisition cost**, not profit. Revenue comes once you climb up-market.

**Two stacked expansion axes:** price (low-end → high-end), then category (sports → TCG → collectibles → beyond). Bulk is the on-ramp, not the destination.

**Open decision to resolve from real usage (not now):** does your crowd skew toward repeat resellers who'd pay monthly, or casual hunters who'll only pay per-deal? That answer picks subscription-first vs. flat-fee-first. You do **not** need to answer this to build tomorrow, because the MVP charges nothing.

## 1.7 How Needit compares to what exists

| Platform | Model | What you beat them on |
|---|---|---|
| eBay | Forward, ~13% seller fee | No seller fee; demand-driven instead of scroll |
| Whatnot | Live forward auctions | Source without watching 100 streams; post once |
| CollX / Ludex | Scanner + forward marketplace | They own inventory data; you own *demand* data |
| Facebook ISO groups | Unstructured, no protection | Structured offers, escrow, no leakage, real matching |

Protect the *reverse* mechanic above all. Build a plain bulk marketplace and you're just a worse Whatnot.

## 1.8 Roadmap

- **M0 — Vertical slice (TOMORROW):** auth → post a need → board with filters → make a structured offer w/ photo → accept/deny → match unlocks. No payments.
- **M1 — Liquidity test:** seed it with your audience; you personally concierge fulfillment. Measure: % of needs that get an offer, and time-to-first-offer.
- **M2 — Lane 1 (the price-match engine):** normalized card catalog + seller inventory upload (CSV import, *not* manual entry) + auto-match → suggested opening offer → first-to-accept (atomic, anti-double-sell) → counters → later, seller auto-accept. See §1.4 for the full mechanic and the concurrency/freshness flags.
- **M3 — Payments:** Stripe Connect escrow, masked identity, shipping labels, leak defenses live. (Requires a legal/entity + money-transmitter review first.)
- **M4 — Monetize + expand:** turn on subscription/fee; climb price tiers, then categories.

---

# PART 2 — THE BUILD (do this tomorrow)

## 2.1 Stack (you already have all of it)

- **Next.js (App Router) + TypeScript** on **Vercel** — frontend + server actions
- **Supabase** — Postgres, Auth, Row-Level Security, Storage (offer photos), Realtime (later)
- **Tailwind + shadcn/ui** — UI (comes pre-wired in the starter below)
- **Cursor** — your build copilot
- **Stripe Connect** — *deferred to M3.* Do not touch it tomorrow.

## 2.2 The MVP scope contract (read before you write a line)

**IN (the vertical slice):**
1. Sign up / log in (email magic link).
2. Create a profile (username).
3. Post a need: title, description, type (single/bulk), sport, max budget, condition preference, expiry.
4. Browse the board: filter by sport / type, sort by budget (low/high) and newest.
5. View a need → submit a **structured offer** (price, condition, photo, short note).
6. Buyer views offers on their need → **accept** or **decline**.
7. On accept → a **deal** record is created and contact/match unlocks.

**OUT (resist all of these today):** payments/escrow, inventory upload + Lane 1 auto-match, the normalized card catalog, subscriptions, real-time chat, email notifications, native mobile. Each is a future milestone. Adding any of them tomorrow guarantees you finish nothing.

**Definition of done for the day:** logged in as User A you post a need; logged in as User B (second browser/incognito) you see it and submit an offer with a photo; back as User A you accept it and see the match unlock. That's "something real."

## 2.3 Step 1 — Scaffold from the official Supabase starter (don't hand-wire auth)

The single biggest time-saver: the official starter ships auth, the SSR Supabase clients, middleware, and shadcn/ui already wired. Per Supabase's current docs the `@supabase/ssr` package is the supported approach (the old `auth-helpers` is deprecated), and this template uses it correctly.

In your terminal:

```bash
npx create-next-app@latest needit -e with-supabase
cd needit
```

This gives you a working Next.js App Router app with login/signup already built. Get the CI/CD loop working *before* building features (see Step 6) so you're not debugging deploys at midnight.

## 2.4 Step 2 — Environment variables

In the Supabase dashboard open your project's **Connect** modal (or Settings → API). Copy the project URL and the publishable/anon key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

> Supabase is mid-transition from legacy `anon`/`service_role` keys to new `publishable`/`secret` keys (legacy deprecates end of 2026). Either works today; the starter expects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. If your dashboard only shows `NEXT_PUBLIC_SUPABASE_ANON_KEY`, you can use that value under either name. Never put the **secret/service_role** key in a `NEXT_PUBLIC_` variable.

## 2.5 Step 3 — The data model (paste into Supabase SQL Editor)

Open Supabase → **SQL Editor** → New query → paste this whole block → Run. It creates the schema, auto-creates a profile on signup, and locks everything down with RLS.

```sql
-- ========== ENUMS ==========
create type request_type as enum ('single', 'bulk');
create type request_status as enum ('open', 'matched', 'closed', 'expired');
create type offer_status as enum ('pending', 'accepted', 'declined', 'withdrawn');

-- ========== PROFILES ==========
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique,
  display_name text,
  is_seller   boolean default true,
  created_at  timestamptz default now()
);

-- auto-create a profile when a user signs up
create function handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ========== REQUESTS (the "needs") ==========
create table requests (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  type          request_type not null default 'single',
  sport         text,                         -- 'basketball','football',...
  budget_cents  integer,                      -- max the buyer will pay
  condition_pref text,                         -- 'any','raw','psa9+',...
  status        request_status not null default 'open',
  expires_at    timestamptz,
  created_at    timestamptz default now()
);
create index requests_status_idx on requests(status);
create index requests_sport_idx  on requests(sport);

-- ========== OFFERS (seller responses) ==========
create table offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references requests(id) on delete cascade,
  seller_id   uuid not null references profiles(id) on delete cascade,
  price_cents integer not null,
  condition   text,
  photo_url   text,
  note        text,
  status      offer_status not null default 'pending',
  created_at  timestamptz default now()
);
create index offers_request_idx on offers(request_id);

-- ========== DEALS (created on accept) ==========
create table deals (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references requests(id) on delete cascade,
  offer_id    uuid not null references offers(id)   on delete cascade,
  buyer_id    uuid not null references profiles(id),
  seller_id   uuid not null references profiles(id),
  status      text default 'unlocked',  -- M3: 'funded','shipped','released'
  created_at  timestamptz default now()
);

-- ========== ROW-LEVEL SECURITY ==========
alter table profiles enable row level security;
alter table requests enable row level security;
alter table offers   enable row level security;
alter table deals    enable row level security;

-- profiles: anyone logged in can read (to show usernames); you edit only your own
create policy "profiles readable" on profiles
  for select using ((select auth.uid()) is not null);
create policy "update own profile" on profiles
  for update using ((select auth.uid()) = id);

-- requests: any logged-in user can read the board; you write only your own
create policy "requests readable" on requests
  for select using ((select auth.uid()) is not null);
create policy "insert own request" on requests
  for insert with check ((select auth.uid()) = buyer_id);
create policy "update own request" on requests
  for update using ((select auth.uid()) = buyer_id);

-- offers: visible ONLY to the offer's seller and the request's buyer (not public)
create policy "offers visible to parties" on offers
  for select using (
    (select auth.uid()) = seller_id
    or (select auth.uid()) in (select buyer_id from requests where requests.id = offers.request_id)
  );
create policy "insert own offer" on offers
  for insert with check ((select auth.uid()) = seller_id);
create policy "update own offer" on offers
  for update using ((select auth.uid()) = seller_id);

-- deals: visible only to the two parties; buyer creates it on accept
create policy "deals visible to parties" on deals
  for select using ((select auth.uid()) in (buyer_id, seller_id));
create policy "buyer creates deal" on deals
  for insert with check ((select auth.uid()) = buyer_id);
```

Then create a **Storage bucket** for offer photos: Storage → New bucket → name it `offer-photos` → mark it public for the MVP (revisit privacy at M3). Cursor will upload to this bucket from the offer form.

## 2.6 Step 4 — The Supabase clients (already in the starter — for reference)

The starter creates these under `lib/supabase/` (or `utils/supabase/`). You shouldn't need to write them, but this is what correct looks like so you can recognize breakage:

```ts
// client component client
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```ts
// server component / action / route-handler client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()   // note: await — cookies() is async now
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* called from a Server Component; middleware persists it */ }
        },
      },
    }
  )
}
```

In server code, verify the user with `supabase.auth.getUser()` (not `getSession`) before trusting identity.

## 2.7 Step 5 — Build the features (paste these into Cursor, one at a time)

Work one prompt at a time, run the app after each, commit when it works. Give Cursor the schema context first.

**Prompt 0 — context (paste once at the start of your Cursor session):**
> This is a Next.js App Router + Supabase project using @supabase/ssr (clients live in lib/supabase/client.ts and lib/supabase/server.ts). My Postgres schema has tables: profiles(id, username, display_name, is_seller), requests(id, buyer_id, title, description, type['single'|'bulk'], sport, budget_cents, condition_pref, status['open'|'matched'|'closed'|'expired'], expires_at, created_at), offers(id, request_id, seller_id, price_cents, condition, photo_url, note, status['pending'|'accepted'|'declined'|'withdrawn'], created_at), deals(id, request_id, offer_id, buyer_id, seller_id, status). RLS is on. Use server components + server actions for data access, shadcn/ui for components, and keep money as integer cents. Don't add payments. Confirm you understand before we start.

**Prompt 1 — onboarding:**
> After login, if the current user's profile has no username, show a one-field onboarding form to set a username (must be unique). On submit, update their row in `profiles`. Use a server action.

**Prompt 2 — post a need:**
> Build a "Post a Need" page at /post with a form: title (required), description, type (single/bulk toggle), sport (select: Basketball, Football, Baseball, Hockey, Soccer, Pokémon, Other), max budget in dollars (store as budget_cents), condition preference, and "expires in" (24h/3d/7d → compute expires_at). On submit via a server action, insert into `requests` with buyer_id = current user and status 'open', then redirect to the new request's detail page.

**Prompt 3 — the board:**
> Build the home board at / that lists all requests with status 'open'. Each card shows title, sport badge, single/bulk badge, budget, time left, and a link to /request/[id]. Add filter controls: sport (all + each), type (all/single/bulk), and a sort toggle (Newest / Budget high→low / Budget low→high). Filtering/sorting can be query params handled server-side. Make it look clean and mobile-first — most of my users are on phones.

**Prompt 4 — request detail + make an offer:**
> Build /request/[id]. Show the full request. If the viewer is NOT the buyer, show a "Make an Offer" form: price (dollars → price_cents), condition, a photo upload to the Supabase Storage bucket 'offer-photos' (store the public URL in photo_url), and an optional note. Insert into `offers` with seller_id = current user, status 'pending'. If the viewer IS the buyer, instead show the list of offers received (price, condition, photo, note, seller username) — RLS already restricts offer visibility to the buyer and each seller.

**Prompt 5 — accept / decline:**
> On /request/[id], for the buyer only, add Accept and Decline buttons to each pending offer. Decline sets that offer's status to 'declined'. Accept (server action, ideally one transaction): set the offer to 'accepted', set the request to 'matched', and insert a row into `deals` (request_id, offer_id, buyer_id, seller_id). After accepting, show an "It's a match!" panel revealing the seller's username and a placeholder line: "Payments & shipping coming soon — coordinate your first deals manually." Other pending offers on that request can be auto-declined.

**Prompt 6 — polish (only if time):**
> Add a simple top nav (logo, "Post a Need", "My Needs", profile/logout), a /my-needs page listing the current user's own requests with their offer counts, and empty-states everywhere. Seed 6 realistic dummy requests so the board doesn't look empty.

## 2.8 Step 6 — Deploy (do this early, not last)

You already have GitHub + Vercel connected. Right after Step 1:

```bash
git init && git add -A && git commit -m "scaffold"
# create an empty GitHub repo, then:
git remote add origin https://github.com/YOURNAME/needit.git
git push -u origin main
```

In Vercel: New Project → import the repo → add the two env vars (or use the Supabase–Vercel integration, which injects them automatically) → Deploy. Confirm the live URL loads and login works **before** building features. From then on, every `git push` auto-deploys. Point your domain at the Vercel project when you're ready.

## 2.9 Tomorrow, hour by hour

| Block | Time | Goal |
|---|---|---|
| 1 | 45 min | Scaffold (Step 1) + deploy skeleton + confirm login works live (Steps 6 + 2) |
| 2 | 60 min | Paste schema + RLS, create storage bucket, verify in Table Editor (Steps 3) |
| 3 | 45 min | Onboarding + username (Prompt 1) |
| 4 | 90 min | Post-a-Need form writing to DB (Prompt 2) |
| 5 | 60 min | The board with filters/sort (Prompt 3) |
| 6 | 75 min | Request detail + make-offer with photo upload (Prompt 4) |
| 7 | 60 min | Accept/decline + deal unlock (Prompt 5) |
| 8 | 40 min | Seed data, polish, redeploy, test the full loop on your phone |
|   | buffer | Things will break; leave slack |

**End state:** the full post → offer → accept loop works on your live URL, on a phone. Ship it to a handful of your most active followers and watch what happens.

## 2.10 Guardrails for the day

- **Build the slice end-to-end before polishing anything.** A working ugly loop beats a beautiful half.
- **Commit every time something works.** Cheap rollbacks keep you fearless.
- **If you're tempted to add escrow, catalog, or inventory matching — stop.** Those are M2/M3. Today is the reverse mechanic, nothing else.
- **Keep money as integer cents** everywhere to avoid float bugs.
- **Don't put the service_role/secret key in any `NEXT_PUBLIC_` var.**

## 2.11 Decisions parked for later (don't let them block tomorrow)

1. Subscription-first vs. flat-fee-first for the bulk lane → decide from real M1 usage.
2. Legal entity + money-transmitter posture → settle before M3 payments (read Stripe Connect's marketplace docs; likely worth a short lawyer consult since you'll hold funds in escrow).
3. Identity-masking + leak-defense implementation → lands with payments at M3.

---

*You've done the groundwork. Tomorrow is just one loop: post → offer → accept. Build that, put it in front of your people, and let their behavior tell you what to build next.*
