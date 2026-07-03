# Next-session plan (prioritized Jul 2, 2026)

Kyle brought an advisor-generated list; this is Claude's re-ordering by perceived importance for M1. Metrics dashboard = already DONE (avatar menu → Metrics, admin-only).

## Priority order

**1. Offer-count badge on board cards.** Cheapest "this place is alive" signal — the cold-start weapon for the follower launch. Offers are private by RLS, so this needs a denormalized `offer_count` on requests kept in sync by a trigger (the existing `notify_offer_change` trigger pattern is the template). Expose ONLY the count; verify RLS still hides offer rows. Maybe pair with a "sellers race" cue ("3 sellers competing").

**2. Board filters + sort.** Same surface as #1 — do in the same pass. Filter: sport, single/bulk, budget range, condition. Sort: newest / expiring soon / highest budget. Serves sellers scanning for deals worth chasing. URL searchParams like the History pagination.

**3. Design direction mockups → theme refactor.** Kyle's stated goal ("less basic, modern marketplace") and a trust lever before showing followers. Plan already agreed: 2–3 standalone HTML mockups with the SAME real board content — (a) StockX-adjacent black/white + one accent, photo-forward; (b) darker collector/treasure-hunt; (c) hybrid. Kyle picks; then one Tailwind/shadcn theme pass across the app.

**4. Concierge seeding view (~30 min).** Add to /metrics: needs approaching expiry with ZERO offers — Kyle's intervention list during M1 seeding. Directly protects the headline metric. Extend `admin_metrics()` or a small second query on the page.

**5. Mandatory offer photos for singles.** Locked-adjacent trust decision: required for single-card offers, optional for bulk (don't suppress bulk liquidity). Enforce at BOTH form validation and a DB check constraint (can't be bypassed). Small.

**6. Seller demand alerts (inverted saved search).** "Alert me when someone wants Jordan slabs." Strongest seller-retention loop pre-payments. Sellers save criteria (keyword/sport/budget); a DB trigger on newly published needs matches criteria → in-app + email via the EXISTING notification/Resend pipeline, respecting the opt-out toggle. Bigger than 1–5; schedule as its own session.

## Explicitly NOT yet (agreed)
- Buyer/seller split landing (polish; after vertical value).
- Anything touching seller inventory/showcase — Lane 1 limb; guardrails say talk Kyle out of it until Lane 2 liquidity is proven.

## Why this order
1–2 make the board credible the moment followers arrive and cost the least; 3 is the trust wrapper around them; 4 protects the metric during seeding; 5 hardens trust on singles; 6 is the retention engine once there's demand flowing to alert on.
