# Exprifi — Master Questionnaire

**Created Aug 2, 2026.** Answer inline under each `**A:**`. Skip anything you're not ready for — write `SKIP` and it stays open rather than getting a default I invented. Partial is fine; I'd rather have 10 real answers than 40 guesses.

**How to use:** copy this whole thing into a doc, answer at your own pace, paste it back. Length doesn't matter. Rambling is genuinely useful — I can extract structure from mess, but I can't extract detail from a one-word answer.

**Legend:** 🔴 blocks something dated · 🟡 shapes the work · 🟢 nice to have

---

# PART 1 — The Four Legal Decisions 🔴

These four block publishing your ToS and Privacy Policy. Right now your site footer has **no policy links** on purpose, because I won't publish legal text nobody has read. A marketplace handling other people's money and personal data without published terms is a real exposure, so these gate the Sep 26 launch.

Important framing: **you are not writing the legal document.** You're making business decisions a lawyer then drafts around. Answering these is what makes a lawyer's hour cheap instead of expensive — you walk in with decisions instead of paying someone to interview you.

---

## Decision 1 — Governing state 🔴

**What it means:** which state's law interprets your Terms, and where a lawsuit would be filed. If someone sues Exprifi, this determines whose courts and whose rules.

**Why it matters:** if you don't specify, a user in California can sue you in California under California law. That means hiring a California lawyer and possibly travelling. Specifying your home state means disputes come to you.

**My lean:** **Connecticut.** You're there, VoloksVault Sports Card LLC is there. It's the obvious, defensible answer.

**The catch worth knowing:** some states — California especially — have consumer-protection laws that partially override a contract's choice of law for their own residents. A Connecticut clause doesn't perfectly immunize you. It still helps substantially and is standard practice.

**Q1.1** — Is VoloksVault Sports Card LLC registered in Connecticut, or somewhere else (Delaware, Wyoming)?
**A:**

**Q1.2** — Do you live in Connecticut year-round, and expect to for the next few years?
**A:**

**Q1.3** — Any plan to reincorporate in Delaware for investors? (Common if you raise. Changes the answer.)
**A:**

---

## Decision 2 — Arbitration clause 🔴

**The one that actually deserves thought.** The other three are close to obvious; this one is a genuine values trade-off, which is why your draft flags it and says have a lawyer write it.

**What it means:** a clause saying disputes go to private arbitration instead of court, that users waive the right to a jury trial, and that they waive the right to join a class action.

**The case for including it:**
- Standard for marketplaces — eBay, StockX, Whatnot all have one.
- Class-action waiver is the real protection. A single bad policy affecting 5,000 users becomes 5,000 separate small claims instead of one existential lawsuit.
- Arbitration is usually cheaper and faster than litigation.

**The case against:**
- It genuinely removes rights from your users. Arbitration favors the repeat player — the company — and outcomes are private, so patterns of harm stay invisible.
- Your brand is "the sharp friend at the card show," built on trust with a tight-knit hobby community. A hostile-feeling ToS cuts against that, and this crowd talks.
- Mass arbitration has become a real counter-tactic: thousands of individual filings, each with a filing fee you pay. It has bankrupted companies that assumed arbitration was a shield.
- You're pre-revenue with no users. The exposure you're protecting against is hypothetical; the trust cost is immediate.

**My honest read:** include it, with a **30-day opt-out** and a **small-claims carve-out**. That's the version that protects you from class actions without feeling predatory — a user who dislikes it can opt out, and anyone with a genuine small grievance can still use small-claims court. But this is your call and I don't think the other answer is wrong.

**Q2.1** — Gut reaction, before tactics: does binding arbitration feel consistent or inconsistent with how you want Exprifi to treat people?
**A:**

**Q2.2** — Include arbitration + class-action waiver? (yes / no / want to discuss more)
**A:**

**Q2.3** — If yes: 30-day opt-out window? Small-claims carve-out? (I recommend both)
**A:**

**Q2.4** — How much do you expect disputes to be a real problem? Your trust-and-safety doc says CS load is your biggest personal worry — say more about what you're picturing.
**A:**

---

## Decision 3 — Minimum age 🔴

**What it means:** the minimum age to hold an account.

**Why it's not just a number:** under-13 triggers **COPPA** in the US — parental consent, strict data limits, real penalties. 13–17 can't form binding contracts, so a minor's "binding offer to sell" isn't enforceable, and you're mediating money between a minor and an adult stranger.

**My lean: 18.** Simplest, safest, standard.

**But — this is a live tension for you.** Card collecting skews young. Some of your treasure-hunt audience are teenagers, and some breakers' customers are kids buying with a parent's card. An 18+ rule may exclude real users. The workable answer is usually 18 to *hold an account*, with under-18s participating through a parent's account.

**Q3.1** — Minimum age: 18, or something else?
**A:**

**Q3.2** — Realistically, what share of your VoloksVault audience is under 18?
**A:**

**Q3.3** — Comfortable with "under 18 may use a parent's account under their supervision," or keep it strictly 18+?
**A:**

---

## Decision 4 — Data retention after account closure 🔴

**What it means:** what happens to someone's data when they delete their account.

**The tension:** users expect deletion to mean deletion. But completed deals are the **ledger** — the record their counterparty relied on. If a seller deletes their account, the buyer shouldn't lose proof the deal happened. Tax and dispute obligations also require keeping transaction records.

**My lean:** deactivate immediately → hold **14 days** so they can change their mind → then anonymize the profile. **Completed transaction records kept indefinitely**, but detached from identity.

**Q4.1** — Is 14 days the right grace period? (7 / 14 / 30)
**A:**

**Q4.2** — Comfortable keeping anonymized deal records indefinitely? (I recommend yes — it's the ledger)
**A:**

**Q4.3** — Any plan to serve users in the EU or California? (GDPR/CCPA add deletion rights that change this)
**A:**

---

## Decision 5 (bonus) — Lawyer review 🔴

Your own draft says the launch budget has room for this, and that a marketplace ToS with an arbitration clause and liability disclaimer is exactly the document worth paying to check. I agree.

**Q5.1** — Have you found a lawyer yet? If not, is that scheduled before Sep 26?
**A:**

**Q5.2** — Rough budget for legal review?
**A:**

**Q5.3** — Want me to prep a "questions for the lawyer" packet so you're not paying hourly for them to ask what you already know?
**A:**

---

# PART 2 — Open Exprifi Decisions 🔴🟡

Things your own docs flag as unresolved that block or shape real work.

---

## The two numbers blocking `/plans` 🔴

`/plans` is scheduled for Phase 2 (Aug 11–24). It can't be written honestly without these.

**Q6.1** — **Exprifi Pro monthly price.** My rec: one price, under $30, founding members grandfathered permanently. What feels right — and what would *you* pay as a seller?
**A:**

**Q6.2** — **Free demand-alert cap.** Free users get N alerts, Pro unlimited. Rec: 3. The locked boundary is that free alerts must not do the seller's matching for them.
**A:**

**Q6.3** — Annual option, or monthly only? (Annual improves cash flow but complicates the founding-member promise)
**A:**

---

## Stealth vs. liquidity 🔴

Your `gtm.md` flags this as unresolved and says it needs resolution before launch. It's still open.

**Your worry:** launching loudly tips off eBay, they redevelop, you lose everything.

**The counterpoints on the table:** incumbents rarely cannibalize their own listing-fee model to copy a zero-revenue startup; the defensible asset is the demand graph and community, which only accrues by launching; a marketplace kept quiet dies of emptiness, which is the far likelier failure mode.

**My read:** the empty-board risk is real and present. The eBay risk is speculative and, if anything, arrives *after* you've proven the model. But it's your company and your call.

**Q7.1** — Where do you actually land now: launch loud, or staged invite waves?
**A:**

**Q7.2** — If staged: what's the trigger to go loud? (a user count? a fill rate? a date?)
**A:**

**Q7.3** — Has the eBay worry changed since July, or is it as strong?
**A:**

---

## The Sep 26 date 🔴

**Q8.1** — Is Sep 26 confirmed, or still provisional? (The roadmap says "Kyle to confirm," alternate Sep 12)
**A:**

**Q8.2** — The Sep 14 gate is ≥50 users · ≥20 needs · ≥40% offer rate · median TTFO <24h. **If you miss it again, do you actually stop?** Be honest — a gate you'll override isn't a gate.
**A:**

**Q8.3** — School starts in the fall. How many real Exprifi hours per week during the seeding sprint?
**A:**

---

## Dispute resolution 🟡

Your trust-and-safety doc: *"Formal dispute-resolution policy is not yet designed — board agenda item before payments become the default rail."* Still undesigned, and it interacts with Decision 2.

**Q9.1** — When a deal goes wrong pre-escrow (buyer says never arrived, seller says shipped) — what do you *want* to happen?
**A:**

**Q9.2** — Are you willing to be the arbiter early, or should it be structurally hands-off ("we're a venue, not a party")?
**A:**

**Q9.3** — What's your actual fear here? Volume of complaints, confrontation, being blamed, something else?
**A:**

---

# PART 3 — Voice & Content 🔴

The 17 social skills are **completely inert** until this is done. Scheduled for Phase 2.

**Q10.1** — Can you drop 3–5 real writing samples into the folder? VoloksVault captions, TikTok/Reel scripts, Whatnot blurbs, Facebook-group posts. **Real ones you actually published** — the skill analyzes real patterns and explicitly won't invent what isn't there.
**A:**

**Q10.2** — Anyone whose content voice you admire and want to borrow from?
**A:**

**Q10.3** — Anything you refuse to post about? (politics, personal life, other people's businesses)
**A:**

**Q10.4** — Should Exprifi's account be *you* (Kyle, a person) or a *brand* voice? Affects everything downstream.
**A:**

**Q10.5** — Is VoloksVault staying separate from Exprifi, or merging into one presence?
**A:**

---

# PART 4 — Skill Customization 🟡

96 skills installed across 5 departments. These questions shape how I tailor them.

**Q11.1** — Any department that feels like overkill, or one you want to lean on much harder than the others?
**A:**

**Q11.2** — The `design-vault` / `skill-vault` pattern (parked but invokable) — keep it, or just delete what you don't use?
**A:**

**Q11.3** — Where do you want me to **push back hard** vs. **just do it**? Your standing guardrail says talk you out of escrow/catalog/Lane 1 before liquidity. Anything else on that list?
**A:**

**Q11.4** — More departments coming, or is 5 the set? (Engineering, Product Management, Ops, Customer Support, Sales, Data all exist in the Anthropic repo)
**A:**

**Q11.5** — Any skill you've noticed misfiring or producing output that doesn't sound like Exprifi?
**A:**

**Q11.6** — Should skills default to *drafts for your review*, or *ship-ready output*?
**A:**

---

# PART 5 — Agents 🟡

Five marketing agents exist as untailored drafts. This is where we decide the real roster.

**Current drafts:** `seeding-outreach` · `board-copy` · `demand-content` · `launch-runway` · `liquidity-analyst`

**Q12.1** — Reading those five names: which sound genuinely useful, and which sound like something you'd never actually invoke?
**A:**

**Q12.2** — What do you find yourself asking me to do **repeatedly**? That repetition is the best signal for what deserves an agent.
**A:**

**Q12.3** — Your roadmap mentions two planned agents — **Concierge Scout** ("which needs have no offers and who should you DM") and **Morning Metrics**. Still want those? They sound like the highest-value ones on the whole list.
**A:**

**Q12.4** — Should any agent run on a **schedule** (daily/weekly) rather than waiting for you to ask? Morning Metrics is the obvious candidate.
**A:**

**Q12.5** — Which of the other departments deserve agents — Legal? Finance? Design? Or keep those as skills you invoke manually?
**A:**

**Q12.6** — Do you want an agent that's explicitly the **skeptic** — one whose job is to tell you when you're pulling scope forward, over-building, or launching into an empty board? (Your founder profile flags execution and saying no as your growth areas.)
**A:**

---

# PART 6 — Working Style 🟢

Calibration. Skip freely.

**Q13.1** — When I disagree with you, how do you want it delivered? (blunt / diplomatic / with options)
**A:**

**Q13.2** — Has anything I've done in these sessions annoyed you or wasted your time?
**A:**

**Q13.3** — Preferred output: short answers in chat, or written to files you can read later?
**A:**

**Q13.4** — Your profile says avoidance spirals are a known failure mode. Is there a way I can help there, or is that off-limits?
**A:**

**Q13.5** — Anything about Exprifi you believe that isn't written down anywhere in the docs?
**A:**

---

# PART 7 — Anything Else 🟢

**Q14.1** — What's the thing you're most worried about that we haven't discussed?
**A:**

**Q14.2** — What's the thing you're most excited about?
**A:**

**Q14.3** — If Exprifi fails, what's the most likely reason?
**A:**
