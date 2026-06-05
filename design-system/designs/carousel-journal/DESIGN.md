# Design #1 — Journal Carousel (`carousel-journal`)

**Lane:** The Journal (editorial). **Format:** carousel. **Primary ratio:** 4:5 (1080×1350). Also 1:1, 9:16.
**Best for:** blog / guide / explainer promotion. **Avoid for:** product drops, urgency or sale offers.

The first locked design in the Fig & Bloom social system. Type-led, restrained, warm — the editorial counterpart to a sale ad. Built on a strict margin grid with a render-and-critique discipline (see `references/design-discipline.md`).

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | opener / hook | Headline owns the upper third; plate is supporting. `theme` lever: light or dark. |
| `intro` | optional (faint) | lede / story | Serif lede + body paragraph + a bridge line into the examples. Sets up the bullets. |
| `interior` | optional (faint) | body / proof | Exactly three sample-message sections. Copy leads. Repeatable. |
| `closing` | required (darkened) | closer | Centred brand mark + italic sign-off line over a moody plate. |

Recommended sequence: `cover → intro → interior → interior → closing`. The cover carries the date; content pages number from `01` (intro). Add/remove interiors as the copy needs; keep one cover, one closing.

## Grid (all slides)

- Outer margin **88px**, equal on four sides.
- Masthead at the top margin (kicker left, index right) with a hairline under it; footer mirrors it (logo left, CTA right) with a hairline above.
- Headline display **120px** (cover) / lede **60px** (intro), Playfair (Lust stand-in), italic accent via `*asterisks*`; `<br>` for controlled line breaks.
- Body copy: Work Sans 400 (Neuzeit Light stand-in), 30px / line-height 1.56.
- Interior sections at fixed tops (200 / 543 / 886) with 1px dividers at 523 / 866 — keeps the rhythm even.

## Tokens

**cover** — `kicker`, `index`, `headline` (markdown), `cta`, `photo` (image); lever `theme: light|dark`
**intro** — `kicker`, `index`, `lede` (markdown), `body`, `lead_in`, `cta`, `photo` (image, optional)
**interior** — `kicker`, `index`, `label_1..3`, `quote_1..3`, `cta`, `photo` (image, optional)
**closing** — `end_line` (markdown), `cta`, `url`, `photo` (image)

`headline`, `lede` and `end_line` accept one inline marker: wrap a word in `*asterisks*` for the italic display serif, and `<br>` for a controlled line break. Body tokens are plain text (`<br><br>` for a paragraph break).

## Theme lever (cover)

- `light` → ink type directly on the plate (needs a plate with a clean upper wall). Logo: `logo_h_black.png`. No overlay.
- `dark` → white type on a darkened plate (works on any plate). Logo: `logo_h_white.png`. Overlay `rgba(18,15,12,.60)`.

The builder derives `THEME_CLASS` and `LOGO_FILE` from this lever — they are not separate tokens.

## Faint ground (intro + interior)

Pass a `photo` to lay a very light plate (~7% opacity) beneath the text — a soft watermark that fills the lower space while keeping copy fully legible. Omit `photo` for flat cream. Pills carry a subtle cream backing so labels stay crisp where they cross the ghost.

## Non-negotiables (inherited from the brand brief)

- The plate must be a **real, named Fig & Bloom design** (Osaka, Marseille, Lucerne, …) — never a generic bouquet.
- Pink-rose plates (e.g. Osaka): the bouquet is the sole colour statement — neutral room, no competing pinks.
- Restrained, feeling-first copy. If a line would work on a Whoosh asset, it is wrong here.
- Fonts are Playfair / Work Sans **stand-ins**; swap to Lust Display + Neuzeit Grotesk for production.
