# Fig & Bloom — Social Design System v2

The visual system for the `my-social-builder` renderer. **One type trio. Four tan/white/black surfaces. Everything else is restrained.**

---

## The type trio

| Role | Font | Source file |
|---|---|---|
| Display / headline (serif) | **Lust** (Yellow Design Studio) | `Lust-Regular.otf` |
| Italic accent / kicker-italic | **Cervanttis** (House Industries) | `cervanttis.ttf` |
| Body / CTA / kicker (sans) | **Neuzeit Grotesk** (URW) | `NeuzeitGro-Lig.otf` (Light) · `NeuzeitGro-Bol.otf` (Bold) |

**Lust** is the serif display face — the hero headlines, the word on `story-overlay`, the quote on `story-editorial`. **Cervanttis** is the italic accent: a single cut used inside Lust lines for the `*emphasised*` word, and as a stand-alone italic on quieter lanes. **Neuzeit Grotesk** is the workhorse sans: Light for body copy, Bold for kicker, CTA, and price pills.

**Rule:** No third family. No script. No display sans. The Cervanttis italic accent is the only typographic gesture the system uses for emphasis.

---

## The palette

Four colours only. The two tans are the workhorses; the white and black are the polar ends.

| Token | Hex | Role |
|---|---|---|
| `--white` | `#FFFFFF` | Full backgrounds, type on dark plates |
| `--ink` | `#1A1612` | Type on light/cream plates (warm black, never pure `#000`) |
| `--tan-1` | `#F0E5D0` | Light tan / cream — primary surface for text panels, lower thirds |
| `--tan-2` | `#B89A75` | Deep tan / clay — secondary surface, photo overlays, accent fills |

**Rule:** No other colour enters the system. No pink, no sage, no dusty miller grey, no blue, no orange. Fig & Bloom's floral photography already brings the colour; the chrome stays in the four-token palette.

### Where each colour sits

- **`--white`** → full-bleed backgrounds for minimal/story-cta-minimal lanes; type when the plate is moody/dark
- **`--ink`** → serif headline type on tan panels; sans body on tan panels; logo in the light theme
- **`--tan-1`** → the warm lower-third panel (story-studio, story-promo, story-gift); the white-block on a dark photo (story-editorial)
- **`--tan-2`** → deep accent: from-price pill, hairline rules on tan-1 panels, badge fills, secondary CTA backgrounds on light themes

**Hairlines** are always `--ink` at 1px (subtle, structural) — never grey.

---

## Photographic register

The references are moody, dark, rustic, editorial. Not bright. Not pastel. Not airy. The plate in every lane is expected to bring:

- **Dark wood / stone / linens** as the dominant surface
- **Hand-tied or hand-held** staging (hands in frame are welcome, not avoided)
- **Soft directional light** from one side, not flat
- **Editorial depth of field** — subject in focus, surface and edges falling off
- **Warm undertones** in the shadows (no cold blue/grey shadows)

The four-tan palette + Lust is calibrated for this register. A bright pastel photo on this system will look wrong; the chrome will fight the picture.

---

## What we are NOT doing

These are off the system. If a brief needs one of them, raise it before building.

- No third font family beyond Lust + Cervanttis + Neuzeit Grotesk
- No more than one italic cut (Cervanttis) in any single asset
- No countdown timers, no urgency, no "last chance" — even on promo lanes
- No "Save %" / discount framing — even on promo lanes
- No bright pastels, no dusty miller green, no competing pinks
- No J.Crew-style white-block-on-bloom pastels (the *J.Crew* reference was structural; the pastels were never the system)
- No two-flower comparison posts (the *this or that* reference was structural; Fig & Bloom is editorial, not "pick your favourite")
- No giveaway framing (the *WIN* reference was structural; Fig & Bloom does not run giveaways)

---

## Lane taxonomy (locked)

The system ships **8 lanes**. Each lives at `design-system/designs/<id>/` with a `cover.html` (and `intro.html` / `closing.html` where applicable) plus a `DESIGN.md` token contract.

| ID | Lane | Format | Slides | Use case |
|---|---|---|---|---|
| `carousel-journal` | The Journal | Carousel | 5 | Blog / guide / editorial explainer |
| `story-studio` | The Studio | Story | 1 | Workshop moments, hands at work |
| `story-promo` | Promo | Story | 1 | New product / range refresh |
| `story-gift` | Gift | Story | 2 | The act of giving |
| `story-editorial` | Editorial | Story | 1 | Dark-plate quote / manifesto |
| `story-quote-soft` | Quote / soft | Story | 1 | Left-rail text on a soft-focus plate |
| `story-tagline` | Tagline | Story | 1 | Sans-only label on a dark plate |
| `story-overlay` | Overlay | Story | 1 | One large word over a hand/photo |

Lanes are a closed set. Add a new lane only when a recurring brief shape demands it (per the `social-post-builder` skill's lane discipline).
