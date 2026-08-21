# Fig & Bloom — Social Design System v3

The visual system for the `my-social-builder` renderer. **One type trio. Four tokens. Generous, editorial spacing. Every element earns its place.**

This is a *craft layer*. It sits on top of a brand's own guide. The brand guide supplies the *what* (fonts, palette, logo, voice); this system supplies the *how* — the grid, the type scale, the spacing rhythm, the critique loop. The two are non-conflicting. The Fig & Bloom email design (see `references/fig-bloom-newsletter-2024.png`) is the canonical reference for tone and scale.

---

## The type trio

| Role | Font | Source file | When to use |
|---|---|---|---|
| **Display / headline (serif)** | **Lust** (Yellow Design Studio) | `Lust-Regular.otf` (+ `Lust-Italic.otf` when licensed) | The hero headline. The "X is the moment." declaration. The word on overlay lanes. Set large, set alone, set confidently. **Inline emphasis (editorial lanes):** the rare *turn word* inside a display line is set in **italic Lust** via the `_word_` marker — keep it scarce (≤ 3 across a deck). The repo ships Lust Regular only, so the italic is a synthesised oblique until the licensed `Lust-Italic.otf` is dropped in `fonts/`; the lane CSS (`font-synthesis:style` on the emphasis span only) picks up the real italic automatically once present. |
| **Voice / comment (script italic)** | **Cervanttis** (House Industries) | `cervanttis.ttf` | A small "voice" line that sits **separately** to the Lust line — **never as inline italic within a sentence.** Used as: a kicker-voice above the headline, a product tagline under the name, a sign-off, a "soft" pull-quote on its own, an attribution. Think "handwritten margin note" — *not* an italicised word mid-sentence (that is italic Lust's job; see above). |
| **Body / UI / kicker (sans)** | **Neuzeit Grotesk** (URW) | `NeuzeitGro-Lig.otf` (Light) · `NeuzeitGro-Bol.otf` (Bold) | Body copy. CTA text. Kicker. Price. Caption. Button label. Caption stack. Light for prose, Bold for the action moment. |

**The Cervanttis rule (this is the one that gets broken most):**

> Cervanttis is **never** used as inline italic *within* a Lust sentence. It is its own line, with breathing room above and below. It speaks. Lust declares. They don't share a sentence.

When the brief has a word that wants italic emphasis inside a Lust headline, the answer is **not** to italicise that word in Cervanttis. The answer is to lift it out — either drop the italic (the word stays upright in Lust), or move the emphasised thought to its own Cervanttis voice line.

---

## The palette

The official Fig & Bloom brand palette — four colours only. Clay and its tint are the workhorses;
Silk White and Noir are the polar ends.

| Token | Brand name | Hex | Role |
|---|---|---|---|
| `--white` | Silk White | `#FFFFFF` | Full backgrounds, type on dark plates |
| `--ink` | Noir | `#000000` | Type on light/cream plates, dark fields, bars |
| `--clay-tint` | Clay 50% tint | `#ECE6DF` | Light surface — text panels, lower thirds, paper |
| `--clay` | Clay | `#D8CCBE` | Secondary surface, photo overlays, accent fills |

(The CSS var names `--ink` / `--clay-tint` / `--clay` are the system's working names for the brand
swatches; pre-v3.1 builds used a warmer reconstruction — `#1A1612` / `#F0E5D0` / `#B89A75` — which
is retired.)

**Rule:** No other colour enters the system. No pink, no sage, no dusty miller grey, no blue, no orange. Fig & Bloom's floral photography already brings the colour; the chrome stays in the four-token palette.

### Where each colour sits

- **`--white`** → full-bleed backgrounds for the airy lanes; type on a dark/moody plate
- **`--ink`** → Lust headlines on light plates; sans body; logo in the light theme
- **`--clay-tint`** → the warm lower-third panel (story-studio, story-promo, story-gift); the cream block on a dark photo (story-editorial)
- **`--clay`** → deep accent: from-price pill, hairline rules on clay-tint panels, badge fills, secondary CTA backgrounds on light themes

**Hairlines** are always `--ink` at 1px (subtle, structural) — never grey.

---

## Type scale — canvas-scale, legible, Fig & Bloom

**The governing fact: a 1080px canvas is viewed at ~390pt on a phone — every size divides by
~2.8 on the device.** The v2 scale (display 48–56, body 16, kicker 11–12) was email-scale type
that rendered illegibly small in feed; it is retired. The v3 scale follows the design-discipline
skill (kicker 26 · dek 34 · subhead 52 · display 96–160 at 1080-wide) and the measured type in
the brand's own seed artwork (script captions ~80px, quote stacks ~64–70px, bars ~70px).

**The floor: nothing informational below 26px at 1080-wide** (~9.3pt rendered). If a line can't
earn 26px, it doesn't belong on the slide — edit, don't shrink.

| Role | 1:1 / 4:5 | 9:16 | 1.91:1 (1200w) | Face | Use |
|---|---|---|---|---|---|
| `kicker` | **26–28** | 28 | 22 | Neuzeit Bold, caps, tracked | Kicker, CTA, price, attribution small-caps |
| `body` | **30–32** | 32–34 | 26 | Neuzeit Light, 1.5 | Body copy, sub lines |
| `voice` | **40–44** | 44–48 | 32–36 | Cervanttis | The voice line — always its own block |
| `title` | **52–64** | 56–72 | 44 | Lust | Multi-line quotes, stacked statements |
| `display` | **96–128** | 120–160 | 72–104 | Lust | 1–3 short lines that own the frame |
| `script` | **76–88** | 88–100 | 56–64 | Cervanttis | Script-as-display (caption, moment, note lanes) |

**Max 2–3 sizes per view** still holds — hierarchy comes from bigger jumps between fewer sizes,
plus weight, case and tracking. The display may take a deliberate jump above the scale to own its
space (story-overlay's single word runs 200+). Multi-line stacks size to the line count and the
space they must fill — a six-line statement at 64 beats two lines at 128 that don't fit.

**Layout is relational, not pixel-stamped** (design-discipline §1): text blocks are flex stacks
with rhythm-token gaps, anchored to panels measured in % of canvas — never absolute y-rows. This
is also what makes one template hold across all four ratios.

**The 5-beat rhythm** (one beat per section, repeated):

1. **Kicker** (Neuzeit Bold, all-caps, tracked) — sets the category
2. **Voice** (Cervanttis) — *optional* — sets the tone, the human aside
3. **Display** (Lust) — declares the moment
4. **Body** (Neuzeit Light) — one or two short lines
5. **CTA** (Neuzeit Bold, all-caps, tracked) — the action, in a black bar

A section may use 1, 2, 3, 4 or 5 of these. The minimum is kicker + display + CTA. Voice is a softener, not a requirement.

---

## Spacing rhythm — 8px scale

All spacing on an 8px scale: **8 / 16 / 24 / 40 / 64 / 96**. No magic numbers. No 7px, 11px, 13px, 22px.

| Token | Value | When |
|---|---|---|
| `space-1` | 8 | Tight (caption under image) |
| `space-2` | 16 | Related (kicker → headline) |
| `space-3` | 24 | Grouped (body → CTA) |
| `space-4` | 40 | Section internal padding |
| `space-5` | 64 | Between major blocks within a slide |
| `space-6` | 96 | Hero breathing room, top of headline |

**Proximity = relationship.** Related items sit close (`space-1` to `space-3`); unrelated items get real space (`space-5` to `space-6`). Vertical rhythm should feel intentional top-to-bottom — no orphan gaps.

---

## Grid & margins (1080 base)

- **Outer margin:** **88px** (~8% of short edge) on all four sides, equal.
- **Columns:** 6 with 24px gutter, for content. Full-bleed imagery may cross the margin; *type and logos never do.*
- **Story / Reel (9:16):** keep critical content and CTAs out of the **top ~14%** and **bottom ~20%** (UI overlays).
- **Feed (4:5, 1:1):** keep a **~8%** top/bottom buffer.

The Fig & Bloom email uses a single 600–680px reading column on a 1080px viewport, with two-up product blocks breaking the symmetry. We follow the same discipline at social scale: one main column, with alternating left/right when a product card sits beside a description.

---

## Photographic register

The references are moody, dark, rustic, editorial. Not bright. Not pastel. Not airy. The plate in every lane is expected to bring:

- **Dark wood / stone / linens** as the dominant surface
- **Hand-tied or hand-held** staging (hands in frame are welcome, not avoided)
- **Soft directional light** from one side, not flat
- **Editorial depth of field** — subject in focus, surface and edges falling off
- **Warm undertones** in the shadows (no cold blue/grey shadows)

The four-token palette + Lust is calibrated for this register. A bright pastel photo on this system will look wrong; the chrome will fight the picture.

---

## The critique loop

This is the anti-regression mechanism. Producing the file is step one, not the finish. Before showing anyone:

1. **Render at 100%** (full resolution). Never approve from a thumbnail.
2. **Zoom into each region** — corners, edges, the footer, where type meets image.
3. **Run the pre-ship QA checklist** (below).
4. **Iterate at least twice.** First render is a draft. Fix, re-render, re-check.

### Pre-ship QA checklist

- [ ] Outer margins equal on all four sides (measure — don't eyeball).
- [ ] Exactly one clear focal point; secondary elements quieter.
- [ ] Logo within its size cap and clearance; not cropped, not bleeding; black/white only; correct lockup.
- [ ] All type sits on the grid; shared left/right margins.
- [ ] ≤ 3 type sizes, all from the scale.
- [ ] Cervanttis is **never** used as inline italic within a Lust sentence. It is its own line, with breathing room.
- [ ] A Cervanttis line stacked above other copy reserves its descender depth (`--cerv-descent-clear`) — no descender (j g y p q) touches the block beneath. Verify on the rendered PNG, not from `overflow` (`npm run test:descender`).
- [ ] Spacing uses the rhythm tokens (`8/16/24/40/64/96`); gaps look intentional.
- [ ] Negative space is composed — no accidental dead zones.
- [ ] Critical content and CTA clear of platform safe zones (top 14% / bottom 20% on stories).
- [ ] Nothing clipped at the edges.
- [ ] Checked at full size, not a thumbnail.

---

## What we are NOT doing

These are off the system. If a brief needs one of them, raise it before building.

- No third font family beyond Lust + Cervanttis + Neuzeit Grotesk
- No inline Cervanttis italic *inside* a Lust sentence (it is a voice line, full stop)
- No more than three type sizes per view
- No countdown timers, no urgency, no "last chance" — even on promo lanes
- No "Save %" / discount framing — even on promo lanes
- No bright pastels, no dusty miller green, no competing pinks
- No J.Crew-style white-block-on-bloom pastels
- No two-flower comparison posts
- No giveaway framing
- No "magic numbers" — every coordinate derived from the 8px scale or the % / em system

---

## Lane taxonomy (locked)

The system ships **14 lanes**. Each lives at `design-system/designs/<id>/` with a `cover.html` (and `intro.html` / `closing.html` where applicable) plus a `DESIGN.md` token contract.

| ID | Lane | Format | Slides | Use case |
|---|---|---|---|---|
| `carousel-journal` | The Journal | Carousel | 5–10 | Blog / guide / editorial explainer (cover · statement · quote · photo-statement · intro · interior · closing). Editorial bar + critique: the `editorial-carousel-craft` skill. |
| `story-studio` | The Studio | Story | 1 | Workshop moments, hands at work |
| `story-promo` | Promo | Story | 1 | New product / range refresh |
| `story-gift` | Gift | Story | 2 | The act of giving |
| `story-editorial` | Editorial | Story | 1–5 | The Good Weekend set: manifesto cover + feature / pullquote / column / press / linkout |
| `story-quote-soft` | Quote / soft | Story | 1 | Left-rail text on a soft-focus plate |
| `story-tagline` | Tagline | Story | 1 | Sans-only label on a dark plate |
| `story-overlay` | Overlay | Story | 1 | One large word over a hand/photo |
| `card-caption` | Caption card | Static | 1 | A print with a handwritten label (seed: Design 1) |
| `card-statement-bars` | Statement | Static | 1 | Stacked caps on ink bars across a plate (seed: Design 2) |
| `card-statement-split` | Statement | Static | 1 | Stacked caps beside a plate (seed: Design 7) |
| `card-testimonial` | Testimonial | Static | 1 | Review card on ink + line-art (seed: Design 3) |
| `card-quote-lineart` | Quote / line-art | Static | 1 | Centred quote on line-art field, light/dark (seeds: Designs 4–5) |
| `card-script-moment` | Script moment | Static | 1 | One Cervanttis line on a flat field (seed: Design 6) |
| `card-note` | Studio note | Static | 1 | Paper-texture note with a line-art bloom (seed: Design 8) |

Lanes are a closed set. Add a new lane only when a recurring brief shape demands it.

---

## v3 — the seed lanes (reconciling the 2023 PSD kit)

The seven `card-*` lanes translate the eight-design 2023 PSD kit (`/seeds`) into this system. The
reconciliation rules, locked:

- **The seed magenta is a placeholder, not a colour.** Every magenta block/field in the PSDs is a
  photo slot (or, on flat fields, maps to the locked palette via a lever). No pink enters the chrome.
- **The seed didone caps map to Lust caps**; the seed handwriting maps to **Cervanttis**; the seed
  sans maps to **Neuzeit Grotesk**. No fonts were adopted from the seeds.
- **The seed grey split fields map to clay-tint / white.** The seed black stays ink `#000000`.
- **Line-art figures** are the brand's own illustrations — eight single-line drawings in
  `design-system/assets/lineart/` (`body-flower`, `body`, `face-1`, `face-2`, `front-face`,
  `hand-flower`, `hand-plant`, `hand-rose`). Templates render them as **CSS masks**: the black
  SVG is the stencil, the `background-color` is the colourway — one file drives every
  combination (clay-tint 42% on ink, ink 16% on white, white 22% on ink, ink 88% on paper). A
  `motif` lever on `card-testimonial`, `card-quote-lineart` and `card-note` picks the figure.
  Line-art never appears on the v2 story/carousel lanes.
- **The `card-*` lanes are chrome-free** — no logo, no CTA, no kicker-bar furniture (the seeds carry
  none). The type is the brand. Story/carousel lanes keep their logo lockups.
- **Statics are multi-ratio**: every `card-*` lane renders 1:1 (primary), 4:5, 9:16 and **1.91:1**
  (1200×630 — the link-card/OG ratio the seed kit shipped in). Templates adapt via the
  `{{ORIENT}}` (`land|square|port`) and `{{RATIO_CLASS}}` (`r1x1`, `r4x5`, `r9x16`, `r1_91x1`)
  stage classes the renderer injects.

---

## v3.2 — true multi-ratio + the Good Weekend editorial set

Two changes, both locked:

**1. The story/carousel lanes are truly multi-ratio.** The v2 templates were pixel-stamped for
one ratio (absolute y-rows for 9:16, or 4:5 for the carousel). v3.2 rebuilds all of them as
relational flex stacks — rhythm-token gaps, panels in % of canvas, footers pinned with
`margin-top:auto` — keyed off the same `{{ORIENT}}` / `{{RATIO_CLASS}}` stage classes the
statics use. Every **story** lane now renders 9:16 (primary), 4:5, 1:1 **and 1.91:1** (the
link-card cut: full-bleed slides narrow their text block; panel slides go plate-left /
panel-right). The **carousel** stays 4:5 / 1:1 / 9:16 — carousels don't ship landscape.
Levers now default to their first enum value when a post omits them.

**2. The editorial lane is the full Good Weekend set.** The 19-image seed kit
(`seeds/Good Weekend/`) reduces to six recurring shapes, and `story-editorial` now ships all of
them: `cover` (manifesto), `feature` (kicker + headline article tease), `pullquote` (oversized
quote marks as template chrome, name + role), `column` (narrow centred-ragged serif passage,
with the clay-block variant as a `panel` lever), `press` (plate over a flat sans paragraph
panel) and `linkout` (the link-in-bio closer, the set's only action beat).

**The seed plate treatment, restored:** the Good Weekend dark slides use a **5–10% ink mask**
over the photo plus a **subtle text shadow** on the white type — never a heavy wash. The plate
stays visible; the shadow does the lifting. (The pre-v3.2 `rgba(0,0,0,.55)` overlay on
editorial/tagline is retired.) Pick plates with a dark region for the type to sit on — the mask
is a lift, not a rescue.

---

## v3.6 — carousel-journal template fixes

Two presentation-only fixes on the `carousel-journal` lane, surfaced during the *Australian Flower
Calendar* deck. **No token, lever or enum changes** — every saved deck keeps validating unchanged.

**1. The dark `closing` sign-off is now the hero.** The Cervanttis `voice` line previously sat
small (44px) and top-anchored just under the foot logo, leaving a large void above the bottom
CTA/URL — it read as an afterthought. v3.6 sets it ~2× larger (88px, 80px on 1:1, 100px on 9:16)
and optically centres it over the darkened plate (a flex spacer above and below). A soft
`text-shadow` lifts it off the plate for contrast — the shadow does the work, not a heavier wash.
The foot logo (top) and the CTA pill + display URL (foot) are retained; the warm-ground
`light` author-card layout is untouched.

**2. The `cover` `theme` + `layout` levers, confirmed wired.** The `dark` theme correctly renders
white type on a darkened plate (scrim overlay + light kicker / headline / index / voice / foot logo)
distinct from `light` (ink type on the un-darkened plate), and the `layout: editorial` value renders
the foot-anchored headline + kicker rule + standfirst + byline as documented (distinct from
`masthead`). Both behave per the schema help; verified by A/B render (light vs dark, and masthead vs
editorial, all produce distinct output).

---

## v3.6.1 — levers honoured wherever a client puts them

A slide's **levers** may arrive in either of two shapes, and the renderer now accepts both:

- **inside `tokens`** — what the builder UI writes (it folds each lever `<select>` into the
  token map), and
- **in a sibling `levers` object** — `{ slide, tokens: {…}, levers: { theme: "dark" } }`, the
  natural shape for schema-driven API clients and the agent, since `/api/schema` lists a slide's
  `tokens` and `levers` as **separate** arrays.

Previously only `tokens` was read, so a lever set in a separate `levers` object was silently
dropped and fell back to its first enum value. On the `cover` that meant `theme:"dark"` rendered
as `light` (ink type on the un-darkened plate — A/B renders came back byte-identical) and
`layout:"editorial"` fell back to `masthead` (no standfirst / byline). The renderer
(`lib/render.js`) and the validator (`/api/validate`) now merge the two via a shared
`slideValues(slide)` helper (`{ ...tokens, ...levers }`, the explicit `levers` object winning on
conflict). No token, lever or enum names changed; decks that already carried levers inside
`tokens` are unaffected.

---

## v3.6.2 — the script role is descender-safe by construction

A silent, long-standing bug across every lane that stacks a **Cervanttis** line above other
copy. Cervanttis is a deep-descender face: its glyphs drop to **~0.806em below the baseline**
(`|glyph yMin| ÷ 1000 upm`, read from `cervanttis.ttf`) — far past the descent a `1.2`–`1.25`
line-box reserves (~0.52em). So whenever a script line carried a descender (**j g y p q**) and
sat directly above another block, the loop of the glyph fell out of its own line-box and landed
on the copy beneath — the `j` in *"the journal"* sitting on the sub line of `card-note`, the
`voice` line's descenders touching the Lust headline on the story/journal covers.

The render's `overflow` check never caught it: the glyph overflows its **own line-box**, not the
card, so the stage never scrolls and `overflow` stays `false` on a visibly broken slide. This is
the QA hole the fix also closes (below).

**The fix — reserve the descent, don't shrink the type.** Each script line that stacks above
another text block now reserves the descender's overflow as padding *below* the block:

```
--cerv-descent-clear: 0.29em;   /* = the ~0.806em true descent − the ~0.52em a 1.2 line-box
                                   already reserves; em-relative, so it scales with the script
                                   size at every ratio. */
.line / .voice { padding-bottom: var(--cerv-descent-clear); }
```

The descender now resolves inside its own block, and the next block's own rhythm-token margin
stays the gap the layout intends — the script line becomes *"its own line, with breathing room
above and below"* by construction, not by the copywriter avoiding certain letters. The rendered
size and weight of Cervanttis are unchanged; only the space below the block grows. Applied to:
`card-note` (`line`→`sub`) and the `voice` line on `carousel-journal` (cover / intro / interior),
`story-promo`, `story-gift` (intro / closing), `story-studio`, `story-editorial`,
`story-quote-soft`. Lone or last script lines (`card-script-moment`, `card-caption` caption,
`card-quote-lineart` attribution, the `carousel-journal` `closing` hero voice centred between
spacers) have nothing beneath them and are untouched.

**The class is no longer silent.** `test/descender-intrusion.js` (`npm run test:descender`)
renders every stacked-script slide at every supported ratio with a descender-heavy voice line,
reads the rasterised pixels back through a canvas, and asserts the script block's lowest ink
clears the highest ink of the block beneath it. It fails on the pre-v3.6.2 templates and passes
after. Presentation-only; no token, lever or enum changes — every saved deck keeps validating.

---

## v3.6.3 — journal cover lockup (wordmark default)

The 759×173 horizontal lockups (`logo_h_black.png` / `logo_h_white.png`) bake **FOR MOMENT MAKERS**
under Fig & Bloom. On a `carousel-journal` cover the plate stamps `{{LOGO_FILE}}`, and until
this version `lib/render.js` only picked black vs white from `theme` — so a one-frame 4:5
masthead light cover always put the slogan on the image. Brand rule: **For Moment Makers is a
lens, not a slogan, and must not sit on the image.** Switching `layout: editorial` to hide the
footer is not a fix (that layout is a different cover).

**The lever.** `carousel-journal` `cover` gains `lockup: wordmark | full`.

- `wordmark` (**default** — first enum value, so omitting the lever is wordmark) → Fig & Bloom
  only. Files: `logo_h_black_wordmark.png` / `logo_h_white_wordmark.png`, cropped from the
  existing lockups (the mark is not redrawn).
- `full` → the historical lockup with the tagline, for the rare case that wants it.

`lib/render.js` derives `LOGO_FILE` from `theme` (colour) + `lockup` (file). Slides that do not
declare the lever keep `logo_h_*.png`, so other designs are untouched. Guard:
`test/lockup-wordmark.js` (`npm run test:lockup`) uses the official CoS fail frame
(4:5 masthead light: THE JOURNAL / chrome test / Birthday flowers) — it fails if
FOR MOMENT MAKERS appears when `lockup` is omitted or `wordmark`, and still allows
`lockup: full` to look like that frame. Hiding the footer via `layout: editorial` is
not a fix and fails the check.

## v3.6.4 — journal intro / interior / closing lockup

v3.6.3 fixed the cover only. `intro.html` and `interior.html` still hardcoded
`logo_h_black.png`; `closing.html` hardcoded `logo_h_white.png` (dark) and
`logo_h_black.png` (light author-card). A three-up (cover + interior + closing)
with `lockup=wordmark` still stamped **FOR MOMENT MAKERS** on the body and closer.

**The lever.** The same `lockup: wordmark | full` (default `wordmark`) is now
declared on `carousel-journal` `intro`, `interior`, and `closing`. Those templates
stamp `{{LOGO_FILE}}` — the same token as the cover, not a type hide of the
tagline. Closing honours it on both themes (white file on the dark plate; black
file on the light author card). Intro and interior have no `theme` lever; they
always take the black file.

`lib/render.js` still derives `LOGO_FILE` from theme colour + lockup. Slides that
do not declare the lever keep `logo_h_*.png`. Guard: `test/lockup-wordmark.js`
now also raster-checks the official CoS interior and closing fail frames
(AFTER THE FUNERAL / kinder destination) plus intro — default/wordmark
`taglineInk=0`; `lockup=full` still has the slogan. Cover behaviour is unchanged.

## Photo sourcing — the asset library contract

Every `photo` token accepts three forms:

1. **A URL** — used as-is (the brand CDN, `https://brand-cdn.figandbloom.workers.dev/…`).
2. **`samples/<file>`** — a plate bundled in `design-system/assets/samples/`.
3. **`query: <natural language>`** — resolved **at render time** against the Fig & Bloom Asset
   Library's semantic search (`https://asset-library-u70t.onrender.com`, override with
   `ASSET_LIBRARY_URL`). The top-ranked image hit wins; the render response reports what was chosen
   in `resolutions`.

This is what makes the framework programmatic end-to-end: an agent writes a `post.json` that
*describes* the plate it needs ("moody hand-tied bouquet on dark wood, side light") and the
pipeline finds the on-brand asset.

**When the library has no match**, the render fails with a `NO_ASSET` error and explicit guidance:
generate the plate with the **brand-photographer skill** (which produces photography in the
register below), upload it to the asset library, then re-render. The builder never falls back to
stock or placeholder imagery — every plate is a real Fig & Bloom asset.

---

## Token contract additions (v2.1)

The v1 token contract had `kicker / headline / body / cta` (and a `*italic*` markdown for inline emphasis). v2.1 **adds a `voice` token** and **removes the `*italic*` inline substitution**.

- `voice` (string, optional) — a Cervanttis "voice line" that sits in its own block, with breathing room above and below. Never substituted into another token.
- `*italic*` markdown — **removed**. The italic emphasis path no longer exists. If a word wants emphasis, drop it from the sentence, give it a `voice` line of its own.
