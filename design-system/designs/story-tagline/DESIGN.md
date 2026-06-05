# Design — Story Tagline (`story-tagline`)

**Lane:** Tagline (sans-only label on a dark plate). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** a single sans label — "Gift edit", "Studio notes", "For the host", "New in" — over a moody plate. A **micro-format**, not a statement.
**Avoid for:** anything that needs a serif headline (use `story-editorial` or `story-promo`), or any lane where the type is the message (use `story-overlay` for that).

The lane is a **sans-only** label on a dark photo. No Cervanttis. The lane is a tag, not a manifesto; the type is a label, not a statement.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required (dark) | label | The plate fills the canvas; type stacks in the lower 60%. All sans, all-caps. |

## Grid (9:16)

- Outer margin **88px**, equal on left and right.
- Plate fills the canvas (`background: cover`).
- Dark overlay `rgba(26,22,18,.55)` to ensure the sans type sits cleanly on any plate.
- Type stacks in the lower 60% with these fixed rows:
  - Kicker at y=1200, sans 22px, all-caps, letter-spacing .32em, tan-1.
  - Headline at y=1276, sans 78px / 1.05, **all-caps**, white. (Sized so 2 lines clear the subhead and the rule.)
  - Subhead at y=1500, sans 24px / 1.5, tan-1 (optional).
  - Hairline rule at y=1720, 1px, white at 50% opacity.
  - Logo bottom-left at y=1820, white wordmark.
  - CTA bottom-right at y=1826, sans 22px, all-caps, white.

## Tokens

**cover** — `kicker`, `headline` (sans, all-caps), `subhead` (optional), `cta`, `photo` (image)

The headline is **sans only** — the system does not wrap it in `*asterisks*` for italic. If you need a serif accent, use `story-editorial` instead. Keep the headline short (one phrase, all-caps, two lines max).

## Voice discipline

- This lane is a **label**, not a statement. Think "GIFT EDIT" or "STUDIO DIARY" — not a sentence.
- **No discount framing.** No "Sale", "% off", "Limited time". Even on this lane.
- **No countdown timers**, even on this lane.
- The CTA is a soft suggestion: "See the edit →", "Read on →", "Have a look →". Not "Shop now!".

## Non-negotiables

- Sans only. No Cervanttis on this lane. The system enforces this by not parsing `*italic*` on the headline token.
- The plate must be a **real, named Fig & Bloom asset** — dark, moody, hands, ingredients, surfaces. Never stock.
- Pink-rose plates: the bouquet is the sole colour statement; the chrome stays in the four-token palette.
- Fonts are Work Sans **stand-ins**; swap to Neuzeit Grotesk for production.

## Palette

`--ink #1A1612` · `--white #FFFFFF` · `--tan-1 #F0E5D0` · `--tan-2 #B89A75` — see `design-system/SYSTEM.md` for the full token contract.
