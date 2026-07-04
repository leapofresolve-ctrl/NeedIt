# Exprifi Brand System — LOCKED (from "Exprifi Brand Directions" artifact, saved Jul 4 2026)

Source: Kyle's Claude design artifact ("Exprifi Brand Directions", 5 iteration boards). The locked outcome is **3a — finalized brand system · Precise / Global / Live** (= direction 2a with the voice system folded in and motion rules locked). This file is the working reference for all UI work.

## Positioning / voice (locked)

- **Hero tagline** (landing H1, app store, socials): **"The marketplace that hunts for you."**
- **System line** (sub-head, onboarding, empty states): **"The demand exchange — post what you want, sellers come to you."**
- **Split landing** (two intent doors, NOT account types):
  - Find: **"Where demand finds supply."** — "Post a need. Watch sellers race to fill it." → CTA "Post a need"
  - Sell: **"Where supply finds demand."** — "Browse open needs. Be first to strike the deal." → CTA "Browse the board"
  - Footer line: "every account does both — intent, not identity"
- Board header: **"LIVE BOARD"** + live stats ("27 open · 84 sellers on").
- Wordmark: lowercase **exprifi**.

## Tailwind theme — 3a tokens (locked)

```css
:root {
  --background: #FAFAFA; --foreground: #0B0E11;
  --card: #FFFFFF; --border: #E6E7E9;
  --board: #101114; --board-border: #24262B;
  --board-fg: #F2F3F5; --board-muted: #8A8F96;
  --primary: #00A968; --primary-live: #2ED98A;
  --warn: #F5A623; --radius: 0.75rem;
}
```

- Palette swatches: #FFFFFF · #101114 · #00A968 (green) · #F5A623 (amber)
- **Fonts:** Display + body = **Instrument Sans** (700 display / 500 body). Numerals = **Spline Sans Mono**, tabular-nums (money + countdowns).
- Category accents extensible later (e.g. TCG #B78AE8).
- Concept: light platform chrome around a **neutral dark live board** (#101114) — "no CRT green", platform-grade.

## Need-card anatomy (from 1a/2a boards)

1. **Type badge** — Bulk = filled plate, Single = outlined. First read.
2. **Title** — one-line clamp on feed, full on detail.
3. **Budget** — the largest element, bottom-left anchor, green mono ("$420 max").
4. **Countdown** — mono; amber under 24h; **blinks only under 12h** ("closing 6h 12m").
5. **Offer count** — competition signal, mono; "N offers · racing" when hot; "no offers — be first" as the empty state.
6. Hover: border→ink, 1px lift, shadow. Active: accent ring.

## Motion rules — ONE JOB ONLY (locked)

- **Blink is reserved for countdowns under 12h.** Nothing else on the board moves.
- Live dot, "racing" labels, wordmark: **static**. "Presence is shown, not flashed."
- **One-shot scale-in on the match panel only** — celebration, then still.

## Match panel (3a form)

"It's a match ✓" + price large ($395), item line + counters used, buyer ⇄ seller pseudonyms revealed, "identities revealed · escrow opens next", CTA "Complete the deal".

## Edge treatment (section 5 — explored, NOT locked)

- 5a Sharp (2px, terminal) · 5b Soft (20/24px, consumer) · **5c Notched (one clipped top-right corner 14px, "ticket stub" — ownable signature; urgency fills the notch amber)**. Doc's "try next" leaned toward applying 5c across the board. Default until Kyle decides: keep --radius 0.75rem (3a as printed).

## Profile page (section 4, in 3a system)

Pseudonymous header (@handle, member since), trust strip (✓ 12 deals completed · 98% close rate · avg match 1.4d), tabs Want board / Offers made / Completed, "MY OPEN NEEDS — N live" list with per-need state lines ("YOUR MOVE — 1 offer", "no offers — boost visibility?"), RECENT DEALS with counterparty revealed post-match. Note "pseudonymous — your name is shared only when a deal matches".

## Alternate directions kept for reference (not chosen)

- 1a clean light w/ orange #FF4A00 (Archivo) · 1b dark treasure-hunt gold/ember (Barlow Cond.) · 1c light chrome + phosphor-green dark board (Familjen) · 2b unified light (no dark panel) · 2c full dark glassy (#2EE58A).

## Implementation notes

- The artifact references a fuller handoff (`design_handoff_exprifi_brand/README.md`) that never made it into the folder; this file reconstructs the spec from the artifact itself.
- Map tokens into shadcn/ui CSS variables in `app/globals.css`; load Instrument Sans + Spline Sans Mono via `next/font/google`; money/time always tabular mono.
