# Exprifi 3b — "Official" Facelift, Access Model & Plans

*Written Jul 27, 2026. This is a build spec, not a redesign. **3a stays locked** — same tokens, same fonts, same 5c notch, same motion rules. 3b changes how those tokens are *deployed*, plus the access model, auth, plans, and settings. Every item is scoped so it can be handed to an executor with no context.*

**Blocker on this session:** the app repo (`~/Desktop/NeedIt/needit`) is not mounted in Cowork — only `Developing NeedIt Official` is. Reconnect the Cowork folder to `~/Desktop/NeedIt` and this spec becomes code.

**Decisions locked by Kyle, Jul 27 (do not relitigate):**
1. **Fee model:** seller subscription gates *features*, not access. Buyer 5% finder's fee applies to **high-end singles only** — never to bulk. Sellers keep 100% of the sale price. This closes the open item in `Board-Reference/fees-and-monetization.md`.
2. **Account model:** one account. "Buyer" is the free default; **Seller is an upgrade toggle**, not a separate account type. Signup offers "Buyer" and "Buyer + Seller (recommended)" — but both create the same row; the second just flips `is_seller` on.
3. **Launch date moves.** See `exprifi-launch-roadmap.md` for the replanned schedule.

---

## Part 0 — The diagnosis: why it reads "eBay"

Kyle's instinct is right, and the cause is specific. Five things are doing it, and none of them are the brand:

| # | The tell | Why it reads cheap/eBay | Fix |
|---|---|---|---|
| 1 | **The inline facet bar** — Type / Sport / Condition / $min / $max / Sort, six raw `<select>`s in a row with an "Apply" button | This is *literally* eBay's and Craigslist's chrome. Native selects in a horizontal strip is the single loudest "amateur marketplace" signal on the page. It's also the most moving parts on screen — exactly what the older crowd bounces off. | Collapse to one **"Refine"** button → slide-over sheet. Active filters render as removable chips. §1.3 |
| 2 | **Green as the button color** | #00A968 filled buttons everywhere makes green mean "click me," so it stops meaning "money" and "live." Saturated accent on every CTA is the #1 tell of a template site. | **Green becomes a data color only** — money, live counts, positive state. Primary buttons go ink (#0B0E11). This one change does most of the work. §1.1 |
| 3 | **No institutional frame** | No footer, no legal links, no entity line, no support link, no "how it works." Nothing on the page says a company is behind it. Officialness is mostly *furniture*, not styling. | Masthead utility strip + real footer with policies + entity line. §1.5 |
| 4 | **14px base type, tight leading, low-contrast grays** | Reads as dense/technical, and it's genuinely hard for the 45+ collector. | 16px base, 1.6 leading, minimum contrast 4.5:1, 44px tap targets. §1.6 |
| 5 | **Two competing primaries** — "Post a need" in the header *and* in the board panel, both green, both same weight | Nothing is the main action, so everything feels like an ad. | One primary per screen. §1.2 |

**The principle for the whole pass:** *official = restraint + furniture.* We are not adding visual interest. We are removing accent, adding air, and adding the boring institutional elements (footer, policies, entity, support, how-it-works) that make a site feel like a business rather than a project.

---

## Part 1 — Visual pass (within locked 3a)

### 1.1 Accent discipline — the highest-leverage change

Green (#00A968 / live #2ED98A) is **reserved for**: money figures, live counts, the LIVE BOARD dot, positive states ("racing", "matched", "funded"), and the wordmark bar. Nothing else.

- **Primary button:** background `--foreground` #0B0E11, text #FFFFFF, radius 2px. Hover: #23272C. *(This also fixes an accessibility defect — see the contrast table in §1.6: white on #00A968 is 3.05:1 and fails AA.)*
- **Secondary button:** transparent, 1px `--border`, text `--foreground`. Hover: border→#0B0E11.
- **Destructive:** text-only #B4232A until confirm step.
- **Only exception:** the single "success" moment — the match panel CTA stays green. One green button in the entire app, at the one moment green means something.

Amber (#F5A623) stays locked to urgency (<24h) only.

### 1.2 One primary per screen

| Screen | The one primary | Everything else |
|---|---|---|
| Logged-out landing | Post a need (Find door) | Browse the board = secondary door, equal size, secondary style |
| Board (logged in) | Post a need (large block, top of board) | Header link becomes text, not a button |
| Need detail (non-owner) | Make an offer | Share / Watch = ghost icons |
| Need detail (owner) | Review offers (N) | Edit / Close = text links |
| Match panel | Complete the deal (green — the exception) | — |
| Plans page | Start free (buyer) | Add selling = secondary |

### 1.3 Kill the facet bar

Replace the six-control strip with:

```
Open demand                                    27 open · 84 offers in play
[ Refine ]  [ Sport: Basketball ×] [ Bulk ×]              Sort: Newest ⌄
```

- **Refine** = one ink-outlined button, opens a right slide-over (desktop) / bottom sheet (mobile) with the full filter set, generous 44px rows, one "Show N results" button at the bottom. Live result count updates as they toggle.
- **Active filters** render as removable chips inline. This is the entire filter UI at rest — two controls instead of seven.
- **Sort** stays as a single inline control, right-aligned, because sort is not a filter and hiding it costs more than it saves.
- Filter state stays in `searchParams` exactly as today — this is a presentation change only, no logic rewrite.

### 1.4 Density and rhythm

- Page max-width 1120px, 24px gutters (currently the content column floats oddly narrow inside a very wide viewport — see the live screenshot; the board panel is ~780px in a 1518px window with nothing beside it, which reads unfinished).
- Vertical rhythm on an 8px grid. Section spacing 48px, not 16px.
- LIVE BOARD panel keeps hairline rows, no per-row radius — **already correct, don't touch.**

### 1.5 The furniture (this is where "official" actually comes from)

**a) Utility strip** — 32px, `--board` #101114, above the masthead:
`Trusted seller marketplace` · `Buyer protection` · `Help` — right side: `Sign in` / `@username`. Static text, 12px, `--board-muted`. No links to nowhere; each must resolve.

**b) Masthead** — white, 72px, hairline bottom border. Wordmark left (with locked static green bar). Center: `Board` · `How it works` · `Plans`. Right: bell, avatar. On the logged-out state, right side = `Sign in` (text) + `Create account` (ink button).

**c) Footer** — the single biggest officialness-per-pixel item on the list. Dark `--board`, four columns:
- **Exprifi** — How it works · Plans & pricing · The board · Founding members
- **Trust & safety** — Buyer protection · Prohibited items · Counterfeit policy · Report a problem
- **Legal** — Terms of Service · Privacy Policy · Off-platform solicitation policy · Cookie notice
- **Support** — Help center · Contact support · support@exprifi.com

Bottom rule: `© 2026 Exprifi. Exprifi is a service of VoloksVault Sports Card LLC. Payments processed by Stripe. Exprifi is a venue for collector-to-collector transactions and is not a party to any sale.`

That last sentence is worth more trust than any graphic we could commission — and it's also legally load-bearing (§8 of the roadmap).

**d) Trust strip on the board**, one line under the H1, static, no icons-as-decoration:
`Structured offers only · No public contact sharing · Identities stay private until a deal is agreed`

### 1.6 Accessibility / the older-collector pass

This is not a checkbox exercise — it is the beachhead's actual demographic.

- Base font **16px** (from 14). Small/meta 14px minimum. Nothing below 13px anywhere.
- Line-height 1.6 body, 1.2 display.
- **Contrast — computed, not eyeballed** (WCAG AA needs 4.5:1 for normal text, 3:1 for large/UI):

  | Pair | Ratio | Verdict |
  |---|---|---|
  | `--muted-foreground` #6E7378 on #FAFAFA | **4.59** | Passes, but with no margin — don't darken the background |
  | `--board-muted` #8A8F96 on #101114 | **5.80** | Passes |
  | `--board-secondary` #C6CAD0 on #101114 | **11.47** | Passes |
  | `--primary-live` #2ED98A on #101114 | **10.26** | Passes — green is excellent *as data on the dark board* |
  | `--board-faint` #5C6167 on #101114 | **3.02** | **Fails for text.** Restrict to hairlines/non-text, or lift to #7A8087 (4.73). |
  | **White text on a #00A968 filled button** | **3.05** | **Fails for normal text.** |
  | White text on an ink #0B0E11 button | **19.35** | Passes comfortably |

  That second-to-last row is the finding worth pausing on: **every green filled button in the app currently fails AA for its label text.** The accent-discipline change in §1.1 isn't only an aesthetic call — going ink for buttons fixes a real accessibility defect at the same time, and green tests beautifully in the one role we're moving it to (data on the dark board, 10.26:1).
- All tap targets ≥44×44px, including filter chips and the bell.
- Visible focus ring on every interactive element: 2px `--primary`, 2px offset. Currently missing.
- `prefers-reduced-motion` already disables blink + match-in — **verify it still holds after this pass.**
- Every form field gets a persistent label (not placeholder-as-label — the Condition field currently uses "e.g. psa 9" as its only in-field hint).
- Money and dates never abbreviated below clarity: "$1,200" not "$1.2k".

### 1.7 Copy: "official" is a register, not a font

Current copy is good and locked at the taglines. The additions:

- Errors state what happened and the next step: "That offer is no longer available — the buyer accepted a different one." Never "Something went wrong."
- Never exclamation points outside the match celebration.
- Pluralization: fix **"1 offers in play"** → "1 offer in play". (Known nit, still open from Jul 4.)
- Empty board must recruit, not apologize. Replace "The demand exchange — post what you want, sellers come to you." + button with a three-step **How it works** block (Post what you want → Sellers bring it to you → You pick the best offer) plus one example need card rendered in a `sample` state. An empty dark panel with one button is the current state and it reads dead.

---

## Part 2 — The first screen

Kyle: *"the first screen that pops up when you open the app should be larger, the buttons to 'post a need' or 'browse the board' should be more accessible."*

### 2.1 Logged-out landing (`/`)

Full-viewport-height hero, everything above the fold at 390px and at 1440px.

```
┌──────────────────────────────────────────────────────────┐
│  [utility strip]                                          │
│  [masthead]                                               │
│                                                           │
│         The marketplace that hunts for you.               │  ← clamp(40px, 7vw, 72px), 700
│         Post what you want. Sellers race to fill it.      │  ← clamp(17px, 2vw, 21px), muted
│                                                           │
│   ┌────────────────────┐  ┌────────────────────┐          │
│   │ FIND               │  │ SELL               │          │  ← 2 doors, min 180px tall
│   │ Where demand       │  │ Where supply       │          │     notched top-right (5c)
│   │ finds supply.      │  │ finds demand.      │          │
│   │                    │  │                    │          │
│   │ [ Post a need  → ] │  │ [ Browse the board]│          │  ← 56px tall, full door width
│   └────────────────────┘  └────────────────────┘          │
│         every account does both — intent, not identity     │
│                                                           │
│   ● LIVE   27 open needs · 84 offers in play · 12 filled  │  ← real counts, mono, static
└──────────────────────────────────────────────────────────┘
```

- **Doors are the buttons.** The whole 180px door is the click target; the inner button is the affordance, not the hit area. This is the "more accessible" ask answered properly — a 56px button inside a 180px target, rather than a 36px chip in a header.
- Mobile: doors stack, each min 140px, both still above the fold at 390×844 (iPhone 14). Verify at 375×667 (iPhone SE) too — the beachhead is not all on new phones.
- **Live stats bar is real data**, not decoration. If counts are 0, it says `● LIVE  The board opens with founding members — 0 open` and we never fake it. (When the seeding sprint lands, this becomes the strongest single element on the page.)
- Below the fold: How it works (3 steps) → What makes it safe (structured offers / private identity / on-platform escrow) → Plans teaser → footer.

### 2.2 Logged-in board (`/board`, and `/` redirects here)

- **"Post a need" becomes a first-class block** at the top of the board — full-width, 88px, notched, ink border, with the prompt "What are you hunting for?" and an ink CTA. Not a header chip.
- Header "Post a need" button demotes to a text link (it's now a duplicate).
- Board panel gets the H1, the trust strip, then Refine + chips, then rows.

---

## Part 3 — Access model: public browsing, gated interaction

Kyle: *"you shouldn't be required to have an account to see the website. However you should have to have an account in order to respond to or interact with any deals/post a need."*

This is correct and it's also an SEO and acquisition unlock — §4A/§7 of the roadmap already wants need pages indexable, which is impossible behind a login.

### 3.1 The two lists

**Public (no session required — full render, indexable):**
`/` · `/board` · `/needs/[id]` · `/u/[username]` (public wants only) · `/plans` · `/how-it-works` · `/help` · `/legal/*` · `/api/health` · OG image routes · `sitemap.xml` · `robots.txt`

**Protected (session required):**
`/post` · `/settings/*` · `/notifications` · `/alerts` · `/completed-deals` · `/metrics` (admin) · all offer/counter/accept/decline server actions · all Stripe routes

### 3.2 Implementation

**The gate flips from allowlist to denylist.** *(Corrected Jul 27 after reading the code: there is no `middleware.ts`. The gate lives in `lib/supabase/proxy.ts` → `updateSession()`, wired through the root `proxy.ts` — Next 16's proxy convention. The logic is exactly the allowlist described here.)*

Today it redirects **everything** to `/auth/login` unless the path is `/`, `/login`, `/auth/*`, `/api/notifications/email`, or `/api/stripe/webhook` — a hand-maintained exemption list, which is why the Resend webhook 307'd in July and why the Stripe webhook needed its own line. Every new public route means another negation. Invert it:

```ts
// lib/supabase/proxy.ts
const PROTECTED = [/^\/post/, /^\/settings/, /^\/notifications/, /^\/alerts/,
                   /^\/completed-deals/, /^\/metrics/, /^\/deals/, /^\/onboarding/];
const needsAuth = PROTECTED.some((re) => re.test(request.nextUrl.pathname));
if (needsAuth && !user) { /* redirect to /auth/login?next=<path> */ }
// everything else renders publicly; the session is still read so the header
// can personalize and so getClaims() keeps refreshing the token.
```

Two bonuses beyond Kyle's ask: webhook routes stop needing bespoke exemptions (they're simply not in `PROTECTED`), and the `?next=` param is what makes the §3.3 "return to the exact action" behaviour work.

**Guardrail that must not be lost:** the standing rule is *"middleware is never the only auth check."* Every protected page and every server action keeps its own `getUser()` check. The middleware inversion is a UX optimization only — if it were the sole gate, this change would be a security regression. Re-run the RLS deny-tests (§5A) after this lands, specifically confirming that an anonymous role can read `requests` where `visibility = 'public'` and **nothing else** — not offers, not private wants, not profiles' emails.

**RLS additions required:**
- `requests`: add an `anon`-role SELECT policy for `visibility = 'public' AND status = 'open'`. Today's policy almost certainly assumes `authenticated`.
- `profiles`: `anon` may read `username`, `created_at`, and trust aggregates. **Never** `email`, never `is_admin`.
- `offers`: no anon policy. The public `offer_count` already lives denormalized on `requests` (migration 0007) — that's how the board shows counts without exposing offers. This pattern is already correct; just confirm the anon role inherits it.

### 3.3 The auth wall pattern — do not redirect

When a logged-out visitor hits an action, **do not** bounce them to `/login`. Render the page fully; swap the action control:

- Need detail, logged out: the offer form renders **disabled with real structure visible** (price field, condition, photo slot) behind a one-line bar: `Sign in to make an offer` → opens a modal. On success, the modal closes and they land back on the same need with the form live. No page loss, no lost scroll position.
- Board, logged out: rows fully visible; "Watch" and "Offer" open the same modal.
- Post a need, logged out: `/post` shows the **form** with a sign-in bar at the submit step, so they compose first and commit second. Draft persists in component state through the auth modal (never `localStorage` for need content — it may contain photos).

Rationale: showing a logged-out user the *shape* of the thing they'd get is the conversion event. Bouncing them to a login form loses most of them, and it loses exactly the cautious older buyer we're designing for.

---

## Part 4 — Auth upgrades

### 4.1 Sign in with username OR email

Supabase Auth is email-keyed, so this needs a resolver. It is easy to build insecurely — the notes below are not optional.

**Flow:** single "Email or username" field. If the input contains `@` **and** parses as an email, pass through to `signInWithPassword` unchanged. Otherwise call a resolver.

**Resolver:** `SECURITY DEFINER` function `resolve_login(identifier text) returns text` that returns the email for an exact, case-folded username match.

Required properties:
- `SET search_path = ''` and schema-qualify everything (the standing pattern for our definer functions).
- **`REVOKE EXECUTE FROM anon, authenticated`** — this function must be callable only by the server action using the service-role client, never from the browser. Otherwise it is a username→email enumeration endpoint, which is a data-breach-by-design.
- Rate limit the sign-in action per IP **and** per identifier (Upstash, already on the W1 shopping list). 10/min/IP, 5/min/identifier.
- **Uniform failure:** wrong username, nonexistent username, and wrong password all return the identical message — "That username/email and password don't match." Never "no such user." Never a different response time; if the username misses, still run a dummy bcrypt-cost operation before returning.
- Log failures to the flag queue for the Leak Patrol agent; a single IP failing 50 identifiers is a credential-stuffing run.

**Signup** keeps email as the identity (needed for confirmation, notifications, and Stripe). Username is chosen at onboarding as it is today — add live availability checking and the existing handle/contact-pattern validation (usernames are already validated against contact patterns per §5B layer 1; keep that).

### 4.2 Signup path selection (the "soft split")

Step 2 of onboarding, after email + password:

```
How will you use Exprifi?

┌──────────────────────────┐  ┌────────────────────────────────┐
│ Buyer                    │  │ Buyer + Seller     RECOMMENDED │  ← ink border, notched
│ Free, forever            │  │ Free to start                  │
│ Post needs, get offers,  │  │ Everything in Buyer, plus       │
│ pay only a 5% finder's   │  │ answer open needs and sell.     │
│ fee on high-end singles. │  │ Seller tools are a paid upgrade │
│                          │  │ when you're ready — never       │
│                          │  │ required to sell.               │
└──────────────────────────┘  └────────────────────────────────┘
             You can switch either on at any time in Settings.
```

**Both choices create the same account row.** The difference is one boolean, `profiles.is_seller`, and which onboarding follow-up they see. This is the entire implementation of the "split" — and it is deliberately reversible in one click from Settings, because the beachhead breaker is both sides and we must never make them re-onboard.

The "recommended" treatment is: ink border + `RECOMMENDED` chip + pre-selected. Not a green glow, not a badge with a starburst. **The tacky failure mode for this exact element is a shiny "MOST POPULAR" ribbon** — we're not doing that.

**Reconciliation with the locked brand system:** 3a says the split landing is *"two intent doors, NOT account types"* with the footer line "every account does both — intent, not identity." That still holds and is unchanged — the landing doors stay Find/Sell **intent**. The account choice lives one level deeper, at signup step 2, and even there it is not really an account type: both options write the same row and differ by one reversible boolean. Nothing about this contradicts the locked decision; it just gives the "Sell" intent a place to land.

### 4.3 Auth completeness gaps (currently missing or unverified)

- Password reset ("forgot password") flow — **verify it exists and that its email deliverable lands** via the Resend pipeline.
- Email confirmation ON (on the W1 security list, confirm it shipped).
- Leaked-password protection (HIBP) + min length 10.
- Turnstile captcha on signup/login.
- Change email (with confirm-to-both-addresses).
- Change password (requires current password).
- MFA for Kyle's admin account at minimum.
- Session list + "sign out everywhere".
- **Delete my account** — required by the Privacy Policy we're about to publish; needs a decision on what happens to completed deals (recommendation: anonymize the profile, retain deal records as the transaction ledger, disclose exactly that in the policy).

---

## Part 5 — Plans & pricing

### 5.1 The model (per Kyle's Jul 27 decision)

| | **Buyer** | **Seller** |
|---|---|---|
| Cost to join | Free, forever | Free, forever |
| Post needs | ✓ | ✓ (every account is a buyer) |
| Answer open needs / send offers | — | ✓ |
| Fee on a completed deal | **5% finder's fee — high-end singles only.** No fee on bulk lots or filter requests, ever. | **$0. Sellers keep 100%.** |
| Paid tier | — | **Exprifi Pro** — monthly. Gates *tools*, not access. |

**What Exprifi Pro unlocks (all M2 features — this is the point of the tier):**
- Demand alerts beyond the free cap (free: 3 saved alerts; Pro: unlimited)
- Instant price-match / Lane 1 matching when it ships
- Seller inventory upload + the Showcase carousel
- Priority position when multiple sellers respond to the same need
- Seller analytics: fill rate, average response time, what demand you're missing
- Bulk-lane flat rate — heavy bulk sellers never feel a per-deal tax

**Pricing to be set** (see open decisions). Recommendation when we get there: one Pro price, monthly, under $30, with founding members grandfathered.

**The headline this buys us, verbatim for marketing:**
> eBay takes about 13% from the seller. On Exprifi the seller keeps 100%, and the buyer pays 5% only on high-end singles — because we found the card, at their price, without the search.

**Why the fee never touches bulk:** bulk margins are thin, bulk is the beachhead, and a 5% tax on a $60 lot of commons is the fastest way to kill the exact volume the liquidity test needs. This is not a temporary carve-out — it is the model.

### 5.2 `/plans` page structure

Public, linked from the masthead, the footer, the signup step, and the board's "Selling on Exprifi?" strip.

1. **H1** "Simple, honest pricing." Sub: "Free to join, either way. You only pay when you get value."
2. **Comparison table** — three columns: Buyer (free) · Seller (free) · Exprifi Pro (monthly). Rows are plain feature statements, ✓ / — only. No checkmark art, no gradients.
3. **The fee explainer** — a worked example, because this is where trust is won or lost:
   > *A $1,400 Jordan rookie:* buyer pays $1,470 ($1,400 + $70 finder's fee). Seller receives $1,400. On eBay that same seller would net about $1,218.
   > *A $60 bulk lot:* buyer pays $60. Seller receives $60. **No fee, either side.**
4. **What Pro unlocks** — the M2 list above, each marked `Available now` or `Coming with Lane 1`. **Never sell a feature that isn't built without labeling it.**
5. **FAQ** — When am I charged? What counts as "high-end"? Can I cancel? What if a deal falls through? Do you hold my money? *(The "what counts as high-end" answer needs a hard number — see open decisions.)*
6. **CTA** — "Start free" (ink) / "Add selling to my account" (secondary).

### 5.3 Sequencing guardrail — read this before building any of it

**Ship the pricing page. Do not ship billing.** The standing guardrail is that monetization is M4 and liquidity comes first, and the board currently has 0 open needs. A Stripe Billing subscription integration right now would be the second paywall built on an empty room.

What ships in this pass: `/plans` as a **public, static, honest page** that says what the model *will* be, with a "free during founding" banner and a "Notify me when Pro launches" capture. That gets Kyle 100% of the recruiting value ("sellers keep 100%") and 0% of the risk and build cost. Billing code, plan enforcement, and the 5% collection wire up at M4, after liquidity — and the fee can only be *collected* once payments are the default path anyway (off-platform settlement can't be taxed).

---

## Part 6 — Settings (the biggest hole)

Current state: **one checkbox.** Here is the full structure. Tabbed left-nav on desktop, accordion on mobile.

### Account
Username (change, with a 30-day cooldown and a public "formerly @x" note for 30 days — usernames are the trust anchor and silent swapping is a scam vector) · Display name (optional, separate from username) · Avatar upload · Email address (change w/ dual confirm) · Password · Time zone · **Delete account**

### Notifications
A grid — rows = event, columns = In-app / Email / (later: Push):
Offer received · Counter received · Your move (turn-based reminder) · Offer accepted / declined · Deal matched · Demand alert match · Need expiring in 12h · Weekly digest of hot needs · Product announcements
Plus: quiet hours · digest instead of individual emails · **one-click unsubscribe honoring the existing opt-out flag.**

*(Today this whole section is a single "Email me about activity" boolean. Granularity here directly reduces unsubscribes, which directly protects the notification loop the whole marketplace runs on.)*

### Buying
Default need expiry (24h / 3d / 7d) · Default sport/category · Default visibility for new wants (public / private wishlist) · Auto-decline offers above my max budget · Show my want board publicly (on/off)

### Selling
**Seller mode toggle** (this is the whole "account split" at rest) · Payout account (Stripe Connect status + connect button) · Categories I sell · Ships from (state) · Typical handling time · Auto-hide needs I can't fill · Demand alert management (link to `/alerts`) · Plan & billing (link to `/plans`)

### Privacy & safety
Profile visibility (public / members only) · Let search engines index my profile · Block a member · Reported content history · **Download my data** · Review the off-platform policy

### Security
Two-factor authentication · Active sessions + sign out everywhere · Recent sign-in activity (time, approximate location) · Connected accounts

### Support
Help center · Contact support · Report a problem · Policies · App version + a "what's new" link

**Build order if it must be split:** Account + Notifications + Selling toggle first (they unblock the facelift and the account model). Privacy, Security, Support second. Buying defaults last — nice, not load-bearing.

---

## Part 7 — Other holes found

Ordered by (damage if missing) ÷ (effort to fix).

**Ship-blockers for a public launch:**
1. **No footer, no legal pages live.** ToS / Privacy / Prohibited items / Off-platform policy were drafted-in-plan for W1 and are not published. A public marketplace without these is both untrustworthy and exposed.
2. **No `/help` or `/support`.** Planned W2, not built. Support with no front door means every issue arrives as a DM to Kyle.
3. **`exprifi.com` still parks at Namecheap.** Everything above is being polished at a `need-it.vercel.app` URL. Nothing reads "official" at a vercel.app domain — **this single item may be worth more perceived legitimacy than the entire visual pass.** Do it first.
4. **No branded 404 / 500 / offline pages.** Default Next.js error pages are the loudest "this is a side project" signal that exists.
5. **No favicon, no OG image, no app icon, no PWA manifest.** Every share of a need currently renders as a blank card. §4A already wants dynamic OG cards — until then, even a static one beats nothing.

**Trust surface:**
6. No "How it works" page — critical for the older, cautious collector who will not sign up for a mechanic they don't understand.
7. No reviews / trust strip on profiles yet (spec'd in 3a §Profile, unbuilt). The trust chips are what make a pseudonym safe to deal with.
8. No "report" affordance anywhere. Needed before public launch, and it's the input to the Leak Patrol agent.
9. Offer photos still optional for singles — the agreed rule is required-for-singles, optional-for-bulk. Still open since Jun 27.
10. No watermarking on offer photos (planned W3) — reverse-image search is a live leak vector.

**Product / conversion:**
11. Empty board doesn't recruit (§1.7).
12. No onboarding tour, no first-need guidance. A blank "title / description / budget" form is a high-abandon moment; needs example placeholders and a "good need looks like this" hint.
13. Username selection has no availability check or guidance.
14. No shareable need URLs promoted anywhere — every need should have a Share control, since §7's referral plan v1 *is* organic sharing.
15. "1 offers in play" pluralization — open since Jul 4, visible on the live site, small but exactly the kind of thing that reads unprofessional.
16. No saved/watched needs for buyers or sellers ("watch this need" is the cheapest possible retention hook).

**Technical hygiene:**
17. Realtime still a 15s poll (planned W2).
18. `published_at` not stored for private→published wants, so TTFO is measured from `created_at` — the north-star metric is currently slightly wrong. One column, one migration.
19. Service-role key + webhook secret **have not been rotated** since they traveled through July debugging sessions (on the W1 list, unconfirmed).
20. No rate limiting on any API route (Vercel provides none by default). This becomes urgent the moment the site is public and unauthenticated — which is exactly what Part 3 does. **Rate limiting must ship with, not after, public access.**
21. No security headers (CSP / HSTS / X-Frame-Options / referrer-policy).
22. No Sentry, no uptime monitor, no `/api/health`.

---

## Part 8 — Build order

Grouped so each block is shippable and verifiable on its own. Nothing here requires touching the locked 3a tokens.

**Block A — Legitimacy (do first; cheapest officialness per hour)**
Domain cutover to exprifi.com · footer + utility strip + entity line · legal pages published · branded 404/500 · favicon + static OG · `/how-it-works` · `/help` stub. *Verify: every footer link resolves; no dead ends.*

**Block B — Public access (ships with its own security)**
Middleware allowlist→denylist · anon RLS policies + deny-tests · auth-wall modal pattern · rate limiting (Upstash) · security headers · sitemap + indexable need pages. *Verify: signed-out, confirm you can read the board and a need, and confirm you cannot read offers, private wants, or any email — by direct API call, not just by UI.*

**Block C — Visual pass**
Accent discipline (green→data only, buttons→ink) · one-primary-per-screen · Refine sheet replaces facet bar · 16px/1.6 type + focus rings + 44px targets · contrast fix on `--board-faint` · larger first screen + door hit areas · empty-state rebuild · pluralization fix. *Verify: side-by-side screenshots at 390px and 1440px, before/after; re-check `prefers-reduced-motion`.*

**Block D — Accounts**
Username-or-email sign-in (with the full §4.1 security list) · signup path selection + `is_seller` boolean · Settings: Account + Notifications + Selling toggle · password reset / change email / change password verified end-to-end.

**Block E — Plans**
`/plans` public page · fee explainer with worked examples · "free during founding" banner · Pro waitlist capture. **No billing code.**

**Block F — Remaining settings + trust**
Privacy · Security (MFA, sessions) · Support · report affordance · watch/save needs · `published_at` migration.

---

## Open decisions (Kyle's, blocking specific items)

1. **What counts as a "high-end single"** for the 5% fee? A hard dollar threshold is required before `/plans` can be honest. Recommendation: **$250+**, disclosed as a number, revisited quarterly. *Blocks Block E.*
2. **Exprifi Pro price point.** Recommendation: one price, monthly, under $30, founding members grandfathered permanently. *Blocks Block E's table, not the page.*
3. **Free-tier demand-alert cap** — recommendation 3. *Blocks Block E.*
4. **Delete-account semantics** — recommendation: anonymize profile, retain deal records as the ledger, disclose it. *Blocks the Privacy Policy and Block F.*
5. **New launch date** — see the replanned roadmap.
6. Still open from before: processing-fee pass-through · auto-release timer 3 vs 7 days · founding-100 perk · reviews public at launch · Discord.

---

*Companion docs: `exprifi-brand-system.md` (3a, locked — this spec never overrides it) · `exprifi-launch-roadmap.md` (schedule) · `Board-Reference/fees-and-monetization.md` (now resolved to the model in Part 5) · `build-log.md` (engineering source of truth).*
