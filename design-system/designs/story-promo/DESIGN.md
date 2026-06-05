# Design — Story Promo (`story-promo`)

**Lane:** Promo (genuine newness). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** quiet product announcements ("new in", "just arrived", "this week's stem"), range refreshes, fresh-from-the-studio deliveries.
**Avoid for:** flash sales, urgency, countdowns, discount framing, anything that needs more than one beat.

A product-hero Story. The plate is bigger than `story-studio` (62.5% vs 55%) because the message is the product itself. A small from-price pill sits under the subhead — never a strikethrough, never a percentage. One label, one product name, one descriptor, one price chip, one CTA. The lane is *newness*, not *push*.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | product announcement | `theme` lever: light or dark. The plate is the message; copy announces it. |

Single slide only. If the brief needs more than one beat, use the journal carousel or pair with `story-gift`.

## Grid (9:16)

- Outer margin **88px**, equal on left and right.
- Plate occupies the top **1200px** (62.5%) — full bleed, slightly larger than `story-studio` so the product can speak.
- Warm cream panel fills **y=1200 → 1920** (37.5%, 720px). Type stacks inside it with these fixed rows:
  - Kicker at y=1276 (76px below plate edge), small-caps Work Sans 24px, letter-spacing .30em.
  - Headline at y=1336, Playfair 80px / 1.05. Wrap a word in `*asterisks*` for italic display accent.
  - Subhead at y=1528, Work Sans 26px / 1.5 (one descriptor line).
  - From-price pill at y=1642, sans 22px, dark fill, rounded. Omit the pill for posts without a price (range-refresh teasers, general newness).
  - Hairline rule at y=1760.
  - Logo bottom-left at y=1820 (52px tall). CTA bottom-right at y=1826, sans 24px, letter-spacing .14em, all-caps.

## Tokens

**cover** — `kicker`, `headline` (markdown), `subhead` (optional), `from_price` (optional), `cta`, `photo` (image); lever `theme: light|dark`

`headline` accepts one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. `subhead` and `from_price` are plain text.

## Theme lever

- `light` → ink type, no plate overlay. Logo: `logo_h_black.png`. Use on plates with a clean upper wall (most named products on warm studio backdrops).
- `dark`  → white type on a `rgba(18,15,12,.45)` plate overlay. Logo: `logo_h_white.png`. Use on moodier plates (dim florals, low-light studio).

The builder derives `THEME_CLASS` and `LOGO_FILE` from this lever — they are not separate tokens.

## Voice discipline (this lane especially)

- **The plate is the message.** The copy announces it. Never invert — never let the copy outshout the product.
- **From-price, not discount.** "from $105" is a fact. "Save 20%" or "$21 off" or "Limited time" is the wrong lane.
- **No countdown timers, no "last chance", no "don't miss out", no percentage-off flashes.**
- **One occasion per post.** A range refresh, a single new arrival, a fresh studio delivery. Not all three at once.
- **AU English.** "Have a look", "we'll be in touch", "see the range". No Americanisms.
- **The CTA is a soft suggestion**, not a command. "See the range →" or "Read the story →" — never "Shop now!" or "Buy!".

## Non-negotiables (inherited from the brand brief)

- The plate must be a **real, named Fig & Bloom product** (Osaka, Lucerne, Lisbon, Florence, …) — never a generic bouquet or stock image.
- Pink-rose plates: the bouquet is the sole colour statement — neutral room, no competing pinks.
- Fonts are Playfair / Work Sans **stand-ins**; swap to Lust Display + Neuzeit Grotesk for production.
