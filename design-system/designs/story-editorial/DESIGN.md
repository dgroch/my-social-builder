# Design — Story Editorial (`story-editorial`)

**Lane:** Editorial (manifesto, value-statement, dark-plate quote). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** brand manifesto, a single line worth standing behind, a journal pull-quote, a hand-tied-mornings vignette.
**Avoid for:** product announcements (use `story-promo`), process vignettes (use `story-studio`), or anything that needs a CTA.

The lane is a single editorial statement. The dark plate is the room; the type is the voice; the attribution is the breath after the line. **No CTA** on this lane — the quote is the message, and a CTA would undermine the moment.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | manifesto / pull-quote | `theme` lever: dark (default) or light. Type is centred horizontally; kicker + quote + attribution stack vertically. |

## Grid (9:16)

- Outer margin **88px**, equal on left and right.
- Plate fills the full canvas as the background (`background: cover`).
- Dark overlay `rgba(0,0,0,.55)` (light overlay `rgba(236,230,223,.80)` on the light lever).
- Type stacks centred vertically with these fixed rows:
  - Kicker at y=560, sans 22px, all-caps, letter-spacing .32em, clay-tint (`#ECE6DF`).
  - Quote at y=644, Lust 76px / 1.18, white (or ink on light lever). Italic accent via `*word*`.
  - Hairline mark at y=(1920-200), 1px, clay at 60% opacity.
  - Attribution at y=1300, sans 22px, all-caps, letter-spacing .18em, clay-tint.
  - Logo bottom-left at y=1820, white wordmark.

## Tokens

**cover** — `kicker`, `quote` (markdown), `attribution`, `photo` (image); lever `theme: light|dark`

`quote` accepts one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. Keep it short — three lines is the ceiling. `attribution` is plain text, set in all-caps sans.

## Theme lever

- `dark` (default) → white type on a `rgba(0,0,0,.55)` overlay. Logo: `logo_h_white.png`. Use on dark plates (rustic, hands, ingredients).
- `light` → ink type on a `rgba(236,230,223,.80)` overlay. Logo: `logo_h_black.png`. Use on bright plates (white wall, daylight).

## Non-negotiables

- No CTA on this lane. If a brief needs a CTA, use `story-promo` or `story-overlay`.
- The quote must be **Fig & Bloom voice** — calm, feeling-first, AU English. Never urgency-led.
- The attribution is the **breath after the line**, not a sign-off. Keep it small and quiet.
- The plate must be a **real, named Fig & Bloom asset**. Pink-rose plates: the bouquet is the sole colour statement; the chrome stays in the four-token palette.
- Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).

## Palette

`--ink #000000` · `--white #FFFFFF` · `--clay-tint #ECE6DF` · `--clay #D8CCBE` — see `design-system/SYSTEM.md` for the full token contract.
