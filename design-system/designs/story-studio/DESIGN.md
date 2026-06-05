# Design — Story Studio (`story-studio`)

**Lane:** Studio (moments from the workshop). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** "In the studio" moments, behind-the-scenes vignettes, process photography, single-plate announcements.
**Avoid for:** multi-message carousels, hard product drops, anything that needs more than one beat.

A single-plate Story. The plate owns the upper 55%; a warm cream panel underneath carries one label, one headline, one short paragraph, and a soft CTA. Type-led, restrained, calm — the photographic counterpart to the journal carousel.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | studio moment | `theme` lever: light or dark. The plate is the message; copy is supporting. |

Single slide only. Story format is one beat — if the brief needs more, use the journal carousel or pair with `story-gift`.

## Grid (9:16)

- Outer margin **88px**, equal on left and right.
- Plate occupies the top **1056px** (55%) — full bleed, no safe-zone padding inside the plate.
- Warm cream panel fills **y=1056 → 1920** (45%). Type stacks inside it with these fixed rows:
  - Kicker at y=1132 (76px below plate edge), small-caps Work Sans 24px, letter-spacing .30em.
  - Headline at y=1192, Playfair 84px / 1.05. Wrap a word in `*asterisks*` for italic display accent.
  - Body at y=1472, Work Sans 26px / 1.55 (omit for a tighter post).
  - Hairline rule at y=1760.
  - Logo bottom-left at y=1820 (52px tall). CTA bottom-right at y=1826, sans 24px, letter-spacing .14em, all-caps.
- Safe-zone respect: text stays inside y=1132 → 1760, well within the 9:16 `safeTop: 269 / safeBottom: 384` envelope.

## Tokens

**cover** — `kicker`, `headline` (markdown), `body` (optional), `cta`, `photo` (image); lever `theme: light|dark`

`headline` accepts one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. `body` is plain text.

## Theme lever

- `light` → ink type, no plate overlay. Logo: `logo_h_black.png`. Use on plates with a clean upper wall (workshop scenes with bright backdrops).
- `dark`  → white type on a `rgba(18,15,12,.50)` plate overlay. Logo: `logo_h_white.png`. Use on moodier plates (hand at work, low-light studio, dim florals).

The builder derives `THEME_CLASS` and `LOGO_FILE` from this lever — they are not separate tokens.

## Non-negotiables (inherited from the brand brief)

- The plate must be a **real, named Fig & Bloom asset** (workshop, studio, hands at work) — never a stock floral photo.
- Pink-rose plates: the bouquet is the sole colour statement — neutral room, no competing pinks.
- Restrained, feeling-first copy. If a line would work on a Whoosh asset, it is wrong here.
- AU English; one label, one headline, one paragraph. If you need two paragraphs, use a carousel.
- Fonts are Playfair / Work Sans **stand-ins**; swap to Lust Display + Neuzeit Grotesk for production.
