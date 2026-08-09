# MASTER PROMPT D — Post a need as a right-gutter panel

> ## ⚠️ SUPERSEDED — DO NOT EXECUTE
>
> **Written and obsoleted within the same hour on Aug 8, 2026.** A parallel session built this while this prompt was being drafted: `app/@panel/(.)post` and the `panel` slot in `app/layout.tsx` both exist, and the build log's Status line already claims the panel ships at ≥1024px with a full page on direct load.
>
> Running this prompt would rebuild a shipped feature. Read the shipped code first.
>
> **The only part still worth reading** is the "Verified starting state" section — a checked survey of `/post` as it stood *before* the change, useful for diffing against what actually landed. The dirty-guard requirement in §3 and the two `redirect()` exits in §4 are worth confirming against the implementation; open item 10 in the build log says the panel has **never been submitted through**.
>
> Safe to delete once that's confirmed.

**Classification:** presentation change, not a liquidity change. It makes posting *feel* lighter once someone has decided to post; it does not make more people decide to post. The board is at 0 needs. If anything on the list gets the first needs onto the board, that goes first and this waits.

---

Continuing Exprifi. Mount `~/Desktop/NeedIt` first thing — it is the git repo root and contains both `needit/` (the Next.js app) and `Developing NeedIt Official/` (docs).

**Read before writing code:**

- `Developing NeedIt Official/plan-post-a-need-rework.md` — the "direction A" one-screen chip-first form you are about to re-present. Do not redesign it.
- `Developing NeedIt Official/exprifi-3b-addendum-board-filtering.md` — §1.4 on the dead left/right space at 1518px, §2.2 on why the rail fills it.
- `needit/components/exchange/refine-panel.tsx` — the app's only slide-over. It is dependency-free on purpose. You are reusing its shape.

---

## The ask

`/post` is a full page today. On a laptop, clicking **Post a need** from the board replaces a board the seller was reading with a form in a `max-w-lg` column, leaving most of a 1518px viewport empty on both sides.

Kyle wants: on a laptop, **Post a need opens as a panel in the right gutter over the board**. On a phone, **it stays exactly as it is** — full screen, own page, unchanged.

The form itself does not change. This is entirely about where it renders.

---

## Verified starting state

Check these before trusting them; they were true on Aug 8, 2026.

- Next **16.2.9**, App Router, Turbopack. `needit/package.json` pins `next: "latest"`.
- `app/post/page.tsx` (39 lines) is a **server** component. It auth-gates — `redirect("/auth/login")` when logged out, `redirect("/onboarding")` when the profile has no username — then renders `<SiteHeader />`, a `<FirstRunHint id="post">`, and `<PostNeedForm />` inside `max-w-lg`.
- `components/post/post-need-form.tsx` (292 lines) is a **client** component: `useActionState(createNeed, …)` plus eight `useState` fields (type, sport, priceMode, condition, gradeMin, tags, expiry, visibility) and `<PhotoPicker />` (185 lines, holds a `File`).
- `app/post/actions.ts` `createNeed` ends in `redirect("/u/<username>")` for a private need and `redirect("/")` for a public one. **A server-action redirect is how the form finishes.** That is the single most likely thing to break in a modal — verify it dismisses the panel and lands on the board rather than leaving a stuck overlay.
- `app/layout.tsx` has **no parallel route slots** today. Adding one touches the root layout, which wraps every route in the app.
- There are **seven** `href="/post"` triggers: `components/site-header.tsx:44`, `components/site-footer.tsx:55`, `components/user-menu.tsx:60`, `components/exchange/board-empty-state.tsx:140`, `app/u/[username]/page.tsx:491` and `:516`, `app/how-it-works/page.tsx:181`.
- The board is `max-w-6xl`; the docked rail is `<aside className="board-rail hidden w-[264px] shrink-0 lg:block">` in `board-rail.tsx:230`. The rail is the left gutter. This panel is the right one.
- **No dialog primitive is installed and none may be added.** Radix is partially present — `@radix-ui/react-checkbox`, `react-dropdown-menu`, `react-label`, `react-slot` — but **not** `react-dialog`. Do not read "Radix is already a dependency" as permission to add it; an npm install is friction in Kyle's workflow and this was a deliberate call, not an oversight. `refine-panel.tsx` does the whole job with `useState` and fixed positioning; copy that approach.

---

## Scope

### 1 — Intercepting route, not a state flag

Use Next's parallel + intercepting routes so the URL stays honest:

```
app/layout.tsx              add a @panel slot
app/@panel/default.tsx      returns null
app/@panel/(.)post/page.tsx the panel presentation
app/post/page.tsx           unchanged full page
```

Client-side navigation from anywhere in the app to `/post` renders the panel over whatever the seller was on. A **hard load or refresh of `/post` renders the full page** — nobody gets trapped in a modal with no page under it, and the URL is shareable and back-button-correct. Do not fake this with a `?post=1` searchParam or a client state flag; both break refresh and Back.

The interception must reuse `<PostNeedForm />` directly. **Do not fork the form.** If the panel needs the form to look different, that is a prop, not a copy.

`app/post/page.tsx` renders its own `<SiteHeader />`. The panel must **not** — there is already a header on the page underneath. Factor the shared body (FirstRunHint + PostNeedForm) so both surfaces render the same thing and only the chrome differs.

### 2 — The two presentations

| Width | Presentation |
|---|---|
| **≥1024px** | Right-side panel, `max-w-[480px]`, full height, own scroll, `border-l`, over a dimmed board. Same slide-in as `refine-panel.tsx`. |
| **<1024px** | Unchanged. Full-screen — either the existing `/post` page or a full-bleed panel, whichever is simpler, as long as it looks and behaves identically to today. |

Match the breakpoint to the rail (`lg`), not to `sm`. The rail docks at 1024px and that is where the gutter appears.

Carry over everything `refine-panel.tsx` already gets right, because it is easy to regress: Escape closes, focus moves into the panel on open and returns to the trigger on close, background scroll locks, `role="dialog"` + `aria-modal="true"` + `aria-label`, 44px minimum touch targets.

### 3 — The dirty guard (this is most of the work)

The Refine sheet can be dismissed freely because it holds nothing. **This one holds a photo and eight fields.** A stray backdrop click, an Escape keypress, or a browser Back must not silently destroy a half-written need.

- Track whether the form is dirty — any field changed from initial, or a photo selected.
- When dirty, backdrop click and Escape ask before closing. When clean, they close immediately, no prompt. A confirm on an untouched form is its own kind of amateur.
- Use a plain in-panel confirmation, not `window.confirm`.
- Back/forward is a real navigation and will unmount the panel. Decide deliberately what happens there and write down the decision; do not leave it to chance.

### 4 — Verify the finish

Post one public need and one private need **through the panel**, end to end, with a photo attached. Both `redirect()` paths in `createNeed` must dismiss the panel and land on the right page. This is the step most likely to surface a bug and the one most likely to get skipped.

---

## Files you may touch

`app/layout.tsx`, `app/@panel/**` (new), `app/post/page.tsx`, `components/post/post-need-form.tsx`, `components/post/photo-picker.tsx`, and whichever of the seven `href="/post"` triggers actually need changing — most should need none, since `<Link>` already produces the client-side navigation that triggers interception.

## Files another chat owns — do not edit

`lib/board-filters.ts`, `lib/board-facets.ts`, `components/exchange/board-rail.tsx`, `board-search.tsx`, `board-locked-header.tsx`, `refine-panel.tsx`, `sort-select.tsx`, `components/ui/chip-group.tsx`, `supabase/migrations/*`.

**`components/site-header.tsx` is contested.** It holds the primary Post a need trigger at line 44 and another chat owns it. Confirm with Kyle that it is free before touching it. It very likely needs no change at all — verify that first, and if it turns out it does, ask rather than assume.

---

## Done means

- `npx tsc --noEmit` and `npx eslint app lib components` exit 0, and `npx next build` compiles.
- Clicking Post a need on a 1440px laptop opens a right-gutter panel with the board still visible behind it.
- A hard load of `/post` at the same width renders the full page, not a panel over a blank screen.
- At 390×844 the flow is pixel-identical to today.
- A need with a photo posts successfully through the panel and lands on the board.
- A dirty panel warns before discarding; a clean one closes without a prompt.
- Escape, focus return, scroll lock and `role="dialog"` all still hold.

---

## How Kyle works

Paste code inline, ready to use — never "go run file X." Always label the destination: Supabase SQL Editor or terminal (with the `cd`). Fix defects on sight rather than deferring them, because the board is at 0. Talk him out of escrow, catalog, or Lane 1 before Lane 2 liquidity is proven.

**Git writes fail on the mount** (`.git/index.lock`, permission) — do not attempt them, hand him the commands. Same for `npx next build`: running it from the agent sandbox writes into the shared `.next/` and leaves a dev-server lock recording a **sandbox** PID and port, which makes his Mac refuse to start `next dev` and print a `kill <pid>` suggestion aimed at a macOS system daemon. Stick to `tsc` and `eslint`, and let Kyle run builds.

---

## Open item, unrelated to this work

Loading `exprifi.com` from the address bar was landing on `/post` instead of the board. No `redirect()`, `router.push`, `vercel.json`, or PWA manifest anywhere in the repo does this, and `git log -S 'redirect("/post")' --all` returns nothing, so the working theory is Chrome omnibox autocomplete on Kyle's machine rather than an app bug. If he reproduces it in a private window on the bare domain, it is real and needs a deployment-side look.
