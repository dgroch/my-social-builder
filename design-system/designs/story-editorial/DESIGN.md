# Design — Story Editorial (`story-editorial`)

**Lane:** Editorial — the Good Weekend set. **Format:** Story, one to five slides. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1, 1.91:1.
**Best for:** article promotion in a weekend-magazine register — a journal feature, a pull-quote, a long quote, a press paragraph, a link-out — plus the standalone manifesto.
**Avoid for:** product announcements (use `story-promo`), process vignettes (use `story-studio`), anything urgency-led (nothing in this system is).

The lane is the brand reading like a magazine. Six slides cover the shapes the Good Weekend
seed kit ships (`seeds/Good Weekend/`): the standalone manifesto plus the five article-promo
beats. Use one slide alone, or run the set as a story sequence.

## The plate treatment (the seed-faithful rule)

The dark slides do **not** use a heavy overlay. The seed artwork puts a **5–10% ink mask** over
the photo and lifts the white type with a **subtle text shadow** — the plate stays visible, the
type still pops. Templates implement this as `rgba(0,0,0,.10)` + a two-layer `text-shadow`
(`0 2px 6px rgba(0,0,0,.28), 0 10px 36px rgba(0,0,0,.32)`). Pick plates with a dark region for
the type to sit on; the mask will not rescue white type on a bright plate. The `light` lever
keeps the clay-tint wash (`rgba(236,230,223,.80)`) and drops the shadow.

## Slides

| Slide | Photo | Role | Seed | Notes |
|---|---|---|---|---|
| `cover` | required | manifesto / pull-quote | GW 0 | The standalone editorial statement. No CTA. `theme` lever. |
| `feature` | required | article tease | GW 1, 6 | Kicker + Lust headline owning the lower third; optional dek and `link_hint` footer. `theme` lever. |
| `pullquote` | required | pulled line + speaker | GW 3 | Oversized quote marks are template chrome — never include them in the token. Name + role attribution. `theme` lever. |
| `column` | required | long quote / passage | GW 2, 4, 5, 17, 18 | Narrow centred-ragged serif column. `align: right (default) \| center \| left`; `panel: none (default) \| clay` for the clay-tint block variant (GW 18). |
| `press` | required | press paragraph | GW 11–13 | Plate over a flat panel; sans paragraph, magazine-caption register. `surface: white (default) \| clay`. Sans-only. |
| `linkout` | none | link-in-bio closer | GW 8, 9 | One bold sans line + the wordmark on a flat field. `surface: white (default) \| clay`. The set's only action beat. |

**Recommended sequence** (article promo): `feature → pullquote → press → linkout`. Swap `column`
in for `pullquote` when the passage is longer than one line; run `cover` alone for a manifesto.

## Tokens

- **cover** — `kicker`, `quote` (markdown), `attribution`, `photo`; optional `voice`; lever `theme: dark|light`
- **feature** — `kicker`, `headline` (markdown), `photo`; optional `dek`, `link_hint`; lever `theme: dark|light`
- **pullquote** — `quote` (markdown, no quote marks), `name`, `photo`; optional `role`; lever `theme: dark|light`
- **column** — `text` (markdown, `<br><br>` paragraph breaks), `photo`; optional `attribution`; levers `align`, `panel`
- **press** — `text` (markdown), `photo`; optional `kicker`, `link_hint`; lever `surface: white|clay`
- **linkout** — `line`; optional `note`; lever `surface: white|clay`

Levers default to their first value when omitted.

## Multi-ratio behaviour (v3.2)

Layout is relational — flex stacks with rhythm-token gaps, panels measured in % of canvas — so
one template serves all four ratios via the `{{ORIENT}}`/`{{RATIO_CLASS}}` stage classes:

- **9:16** — the native cut; type from the story column of the scale.
- **4:5 / 1:1** — shallower head-space, feed-scale type.
- **1.91:1** — link-card cut: full-bleed slides narrow their text block; `press` goes plate-left / panel-right.

## Non-negotiables

- No CTA chrome on the plate slides; **`linkout` is the only action beat** in the set.
- Quote marks on `pullquote` are template chrome. The token never carries them.
- `column` is a passage, not an article — four or five short sentences is the ceiling.
- `press` and `linkout` are **sans-only**; `feature`, `pullquote` and `column` carry no Cervanttis.
- The plate must be a **real Fig & Bloom asset** with a dark region for the type. The 10% mask is a lift, not a rescue.
- Copy is Fig & Bloom voice — calm, feeling-first, AU English. Reads like a weekend magazine, never like an ad.

## Palette

`--ink #000000` · `--white #FFFFFF` · `--clay-tint #ECE6DF` · `--clay #D8CCBE` — see `design-system/SYSTEM.md` for the full token contract.
