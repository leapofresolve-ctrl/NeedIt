# CardHedge AI — Reply Draft (River)

**Date drafted:** July 29, 2026
**Status:** Ready to send
**Context:** Response to CardHedge AI inbound re: commercial card/pricing API. Quoted $500–1,000/mo. Clients named: Arena Club, Mantel, Courtyard.io.

---

**Subject:** Re: Exprifi — API use case

Hi River,

Thanks for the detailed overview, and for the duplicate — it landed fine.

Quick context so a call is useful: I'm building Exprifi, a reverse marketplace for sports cards. Buyers post the card or lot they want, sellers bring it to them. The MVP is live but pre-revenue — I'm in a seeding phase and haven't turned on payments yet.

What I need from a data partner, in priority order:

1. **Card data / catalog** — clean, structured player, set, year, parallel, and grade fields, so buyers can specify a request precisely and sellers can match against it. This is the core need.
2. **Price reference** — a comp or recent-sales anchor displayed alongside a request, so both sides negotiate off a real number. Nice-to-have at launch, important later.
3. **Sports coverage specifically** — baseball, basketball, football; raw and graded. Can you confirm depth there, and whether that counts as one "category" or several under your pricing?

A few things I'd want to understand before we talk:

- **Pricing tier.** Is there a startup or pre-revenue tier? $500–1,000/month is well above what a pre-launch product can carry. I'd want a path that starts small and scales with my volume, ideally with a sandbox or trial period first.
- **Caching rights.** Does the commercial agreement allow caching or storing catalog data locally, or does every lookup have to hit the API? This materially affects how I'd architect things, so I'd rather know early.
- **Volume terms.** Any call-volume caps or overage pricing at the entry tier?

On support: I'm a solo founder right now, with plans to bring on dedicated engineering as we scale. So the quality of your docs, reference implementations, and integration support genuinely factors into the decision — probably as much as the data itself. What does onboarding typically look like for a smaller client?

I'll be transparent: I'm evaluating a few providers right now to understand the landscape and what terms look like. I'd rather say that openly than pretend otherwise — if the fit and the terms are right, I'd much rather build on one partner than stitch things together.

Happy to set up a call. I'm generally flexible — send a couple of windows that work for you and I'll make one work.

Best,
Kyle
Exprifi

---

## Notes to self (do not send)

- **Caching rights is the load-bearing question.** If every lookup must hit the API, cost scales with traffic and I'm exposed. If I can cache the catalog, the recurring cost is much more predictable.
- **Don't volunteer that I'm using AI to fill technical gaps.** Not relevant to data fit, and in a sales context it invites doubt about whether the integration lands. Omission isn't misrepresentation.
- **On the call, "I don't know — walk me through it" is fine.** Real-time honesty costs nothing. Pre-emptive written self-deprecation costs leverage.
- **Reusable for other vendors.** Swap the pricing paragraph; the catalog/caching/volume/support questions apply to any provider.
- **Open question to resolve across vendors:** which of them actually have deep *sports* coverage vs. primarily Pokémon/TCG.
