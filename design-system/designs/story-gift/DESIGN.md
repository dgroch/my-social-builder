# Design — Story Gift (`story-gift`)

**Lane:** Gift (the act of giving and the moment received). **Format:** two-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** gifting moments, corporate gifting, "the act of giving" vignettes, range-refresh previews.
**Avoid for:** hard product drops, urgency or sale offers, single-beat announcements (use `story-promo` or `story-studio`).

A two-beat Story. Slide 1 sets the scene — wrapping, ribbon, the hand-tied preparation. Slide 2 closes on the delivered gift, in someone's home, in the moment received. Calm, considered, feeling-first. The lane is *the act of giving* — not the price, not the SKU, not the urgency.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `intro` | required | scene-setter | Plate = gift being prepared (wrapping, ribbon, hand at work). Copy sets the moment. |
| `closing` | required | the moment received | Plate = the gift in context (delivered, in a home, on a table). Copy is the brand sign-off. |

Recommended sequence: `intro → closing`. Two slides only. If the brief needs more beats, escalate to the journal carousel.

## Grid (both slides, 9:16)

- Outer margin **88px**, equal on left and right.
- Plate occupies the top **1056px** (55%) — full bleed.
- Warm cream panel fills **y=1056 → 1920** (45%, 864px). Type stacks inside it:
  - **intro** — kicker at y=1132, headline at y=1192 (Lust 84px), body at y=1472 (Neuzeit Light 26px, optional), hairline at y=1760, logo at y=1820, soft "next →" hint at y=1826.
  - **closing** — kicker at y=1132, end-line at y=1216 (Lust 76px, centred, with italic display accent on the emphasised word), url at y=1500 (centred, lowercase, optional), hairline at y=1760, logo at y=1820, CTA at y=1826.

## Tokens

**intro** — `kicker`, `headline` (markdown), `body` (optional), `photo` (image), `cta` (used as the soft "next →" hint); lever `theme: light|dark`
**closing** — `kicker`, `end_line` (markdown), `cta`, `url` (optional), `photo` (image); lever `theme: light|dark`

`headline` and `end_line` accept one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. Body tokens are plain text.

## Theme lever

- `light` → ink type, no plate overlay. Logo: `logo_h_black.png`. Use on bright, well-lit preparation/finished plates.
- `dark`  → white type on a `rgba(18,15,12,.50..55)` plate overlay. Logo: `logo_h_white.png`. Use on moodier plates (low-light wrapping, soft-window-light delivery).

The builder derives `THEME_CLASS` and `LOGO_FILE` from this lever — they are not separate tokens.

## Voice discipline

- **The act, not the offer.** The lane celebrates the moment of giving. Never undercut it with discount framing, shipping promises, or callouts.
- **The brand voice lives in the sign-off.** "For the moment they feel what you meant." Use `end_line` for the brand line, not as a place to push the CTA.
- **No "limited time", no "last chance", no "exclusive"** — these registers are off the lane.
- **One gift moment per post.** A birthday, a thank-you, a corporate gesture, a "just because" — not all four.
- **AU English.** "We'll wrap it for you", "choose a moment", "have a look". No Americanisms.

## Non-negotiables (inherited from the brand brief)

- The plates must be **real, named Fig & Bloom assets** — wrapping paper, ribbon, finished gifts in real homes. Never stock wrapping photography.
- Pink-rose plates: the bouquet is the sole colour statement — neutral room, no competing pinks.
- Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).
