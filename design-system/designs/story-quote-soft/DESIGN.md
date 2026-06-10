# Design — Story Quote-Soft (`story-quote-soft`)

**Lane:** Quote / soft (left-rail editorial on a soft-focus plate). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** a poetic statement on a quiet scene; a Fig & Bloom journal line; a host's-moment preview.
**Avoid for:** hard product drops (use `story-promo`), manifesto (use `story-editorial`).

The lane is a split composition: a **clay-tint left rail** carrying the type, a **soft-focus photo** on the right. The rail is the speaker; the photo is the room. A subtle gradient at the rail/photo seam dissolves the line.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required (soft) | quiet statement | The photo lives in the right ~60% of the canvas; the rail lives in the left ~40%. |

## Grid (9:16)

- **Clay-tint rail** = left 560px (≈35%), full height. The rail is the speaker.
- **Photo area** = right 520px (≈65%), full height. The photo is the room. Always soft-focus; the lane is a mood, not a portrait.
- **Gradient seam** at the left edge of the photo: `linear-gradient(90deg, #ECE6DF 0%, transparent 22%)` dissolves the hard line between rail and photo.
- Type stacks inside the rail with these fixed positions (relative to the rail, not the canvas):
  - Kicker at (64, 280), sans 22px, all-caps, letter-spacing .32em, clay.
  - Headline at (64, 340), Cervanttis 60px / 1.16, ink. Italic accent via `*word*`.
  - Body at (64, 980), sans 24px / 1.55, ink (optional).
  - URL at (64, 1500), sans 20px, lowercase, clay (optional).
  - CTA at (64, bottom-96), sans 22px, all-caps, ink.

## Tokens

**cover** — `kicker`, `headline` (markdown), `body` (optional), `url` (optional), `cta`, `photo` (image)

`headline` accepts one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. Keep the headline to 2–4 lines; this lane is a short statement, not a manifesto.

## Voice discipline

- The **rail speaks; the photo listens.** Never the other way around.
- The headline is a **single thought**, not a paragraph. Two to four lines, set in Cervanttis.
- The CTA is a **link-in-bio line**, not a push — "Visit the link in bio →", "Read the story →", "See the journal →". Never "Shop now!" or "Buy!".
- AU English. Calm, feeling-first. If a line would work on a Whoosh asset, it is wrong here.

## Non-negotiables

- The plate must be a **real, named Fig & Bloom asset** — workshop, garden, room, in-stillness. Never stock.
- The plate is always **soft-focus**; do not use a sharp portrait here.
- Pink-rose plates: the bouquet is the sole colour statement; the chrome stays in the four-token palette.
- Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).

## Palette

`--ink #000000` · `--white #FFFFFF` · `--clay-tint #ECE6DF` · `--clay #D8CCBE` — see `design-system/SYSTEM.md` for the full token contract.
