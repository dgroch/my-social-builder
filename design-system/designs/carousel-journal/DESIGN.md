# Design #1 — Journal Carousel (`carousel-journal`)

**Lane:** The Journal (editorial). **Format:** carousel. **Primary ratio:** 4:5 (1080×1350). Also 1:1, 9:16.
**Best for:** blog / guide / explainer promotion. **Avoid for:** product drops, urgency or sale offers.

The first locked design in the Fig & Bloom social system. Type-led, restrained, warm — the editorial counterpart to a sale ad. Built on a strict margin grid with a render-and-critique discipline (see `references/design-discipline.md`).

> **Editorial bar + critique rubric:** see the `editorial-carousel-craft` skill in `dgroch/skills`. Run its seven-axis rubric (hook, hierarchy, restraint, rhythm, image craft, finish, honesty) on the *rendered* set before approval, and return the notes through the campaign feedback loop.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | opener / hook | `layout` lever: `masthead` (default — headline upper third, voice, foot logo/CTA) or `editorial` (foot-anchored headline + kicker rule + standfirst + byline, like the reference opener). `theme` lever: light or dark. `lockup` lever: `wordmark` (default — Fig & Bloom only) or `full` (wordmark + For Moment Makers). Official CoS fail: 4:5 masthead light, THE JOURNAL / chrome test / Birthday flowers, slogan on the plate. |
| `statement` | none | body / single statement | One serif headline + an optional sans body. The workhorse editorial slide. Repeatable. `theme` lever: `clay` (default), `dark`, `light`. Shows automatic `NN / NN` pagination. |
| `quote` | none | pull-quote | Oversized opening glyph + centred serif quote + attribution. No quote marks in the token (the glyph is chrome). `theme` lever: `dark` (default), `clay`, `light`. Pagination top-right. |
| `photo-statement` | required | photo-statement | Full-bleed plate, foot-anchored kicker + serif headline + optional standfirst over a bottom scrim. No masthead. Pagination top-right. |
| `intro` | optional (faint) | lede / story | Serif lede + body paragraph + a bridge line. (Tips/triad register.) |
| `interior` | optional (faint) | body / proof | Exactly three sample-message sections. Repeatable. `font` lever: editorial or script. (Tips/triad register.) |
| `closing` | required | closer | `theme` lever: `dark` (default — centred brand mark + sign-off over a moody plate) or `light` (warm-ground author-card closer: kicker, serif headline, body, hairline, avatar + author name/role, "Read the full entry", URL, logo). |

Two registers:

- **Editorial blog carousel (8–10 slides):** `cover (editorial/dark) → statement (clay) → statement (dark) → photo-statement → quote (dark) → statement (clay) → statement (dark) → photo-statement → closing (light)`. This is the recommended sequence and the default for blog / guide / explainer promotion. See `examples/blog4-pink-carousel-4x5.json`.
- **Tips / triad carousel:** `cover (masthead) → intro → interior → interior → closing (dark)`. Use when the post is a short list of tips. See `examples/flower-card-carousel-4x5.json`.

### Pagination

Non-cover body slides (`statement`, `quote`, `photo-statement`) show an automatic `NN / NN` marker top-right, derived from the slide's position in the deck — it is **not** a token. The cover and closing carry the masthead / logo instead.

## Grid (all slides)

- Outer margin **88px**, equal on four sides.
- Masthead at the top margin (kicker left, index right) with a hairline under it; footer mirrors it (logo left, CTA right) with a hairline above.
- Headline display **88px** (cover) / lede **52px** (intro), Lust, italic accent via `*asterisks*`; `<br>` for controlled line breaks.
- Body copy: Neuzeit Grotesk Light, 30px / line-height 1.56.
- Interior sections at fixed tops (200 / 543 / 886) with 1px dividers at 523 / 866 — keeps the rhythm even.

## Tokens

**cover** — `kicker`, `headline` (markdown), `photo` (image); `index`, `cta`, `voice`, `standfirst`, `byline` (optional); levers `theme: light|dark`, `layout: masthead|editorial`, `lockup: wordmark|full`
**statement** — `kicker`, `headline` (markdown); `body` (optional); lever `theme: clay|dark|light`
**quote** — `quote` (markdown), `attribution`; lever `theme: dark|clay|light`
**photo-statement** — `kicker`, `headline` (markdown), `photo` (image); `standfirst` (optional)
**intro** — `kicker`, `index`, `lede` (markdown), `body`, `lead_in`, `cta`, `photo` (image, optional)
**interior** — `kicker`, `index`, `label_1..3`, `quote_1..3`, `cta`, `photo` (image, optional); lever `font: editorial|script`
**closing** — `url`, `photo` (image); `voice` (markdown), `cta`, `kicker`, `headline` (markdown), `body`, `avatar` (image), `author_name`, `author_role`, `read_label` (optional); lever `theme: dark|light`

**Inline emphasis (markdown tokens).** Wrap the **turn word** in `_underscores_` to set it in **italic Lust** — the *only* sanctioned inline emphasis. Use it rarely (≤ 3 across a deck), per the editorial standard. Cervanttis stays an accent/voice face only — never an italicised word inside a sentence. `*asterisks*` is a legacy accent (renders roman) kept for back-compat. `<br>` is a controlled line break. The repo ships Lust Regular only, so the italic is a synthesised oblique until the licensed `Lust-Italic.otf` is added to `design-system/fonts/`; the CSS picks up the real italic automatically once present. Body tokens are plain text (`<br><br>` for a paragraph break).

## Font lever (interior)

The `interior` slide's pill/body pairing is selectable:

- `editorial` (**default**) → pills in **Lust** (serif), quote/body in **Neuzeit Grotesk** (sans). The corrected, magazine baseline.
- `script` → pills in **Neuzeit Grotesk**, quote/body in **Cervanttis** (script). The original pairing.

Casing follows the pairing: `editorial` sets the Lust pills in **Title Case** and the Neuzeit body in **sentence case** (as authored — not forced lowercase or capitalised); `script` keeps the original tracked **ALL-CAPS** pills. Sizes, spacing, colours and layout are identical across both. The "Cervanttis is lowercase" rule applies only under `script` (where the body is Cervanttis). A missing or unknown value falls back to `editorial`. The lever is the base style, so older posts that don't set `font` now render `editorial`; pin `font: "script"` to keep the previous look.

## Theme lever (cover)

- `light` → ink type directly on the plate (needs a plate with a clean upper wall). Logo colour: black. No overlay.
- `dark` → white type on a darkened plate (works on any plate). Logo colour: white. Overlay `rgba(0,0,0,.60)`.

The builder derives `THEME_CLASS` and `LOGO_FILE` from the `theme` + `lockup` levers — they are not separate tokens.

## Lockup lever (cover)

For Moment Makers is a **lens**, not a slogan, and **must not sit on the image**. The cover plate therefore defaults to the wordmark.

- `wordmark` (**default**) → Fig & Bloom only. Files: `logo_h_black_wordmark.png` / `logo_h_white_wordmark.png` (cropped from the existing 759×173 lockups — the mark is not redrawn). Omit the lever and this is what you get.
- `full` → the historical lockup, Fig & Bloom + FOR MOMENT MAKERS (`logo_h_black.png` / `logo_h_white.png`). Keep this for the rare case that explicitly wants the tagline on the plate.

Do **not** hide the masthead footer by switching `layout: editorial` to dodge the slogan — that layout is a different cover, not a lockup fix. The editorial layout has no footer logo, so `lockup` is a no-op there.

The official CoS fail frame is a 4:5 masthead light cover — THE JOURNAL / chrome test / Birthday flowers — with FOR MOMENT MAKERS under Fig & Bloom on the plate. See `examples/journal-cover-masthead-light-4x5.json` (same chrome, lockup omitted → wordmark). `lockup: full` may still look like that frame.

## Faint ground (intro + interior)

Pass a `photo` to lay a very light plate (~7% opacity) beneath the text — a soft watermark that fills the lower space while keeping copy fully legible. Omit `photo` for flat cream. Pills carry a subtle cream backing so labels stay crisp where they cross the ghost.

## Non-negotiables (inherited from the brand brief)

- The plate must be a **real, named Fig & Bloom design** (Osaka, Marseille, Lucerne, …) — never a generic bouquet.
- Pink-rose plates (e.g. Osaka): the bouquet is the sole colour statement — neutral room, no competing pinks.
- Restrained, feeling-first copy. If a line would work on a Whoosh asset, it is wrong here.
- Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).
