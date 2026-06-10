# Design — Script Moment (`card-script-moment`)

**Lane:** Script moment. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 6 of the 2023 PSD kit — the seed's flat magenta field maps to the locked palette via the `surface` lever (tan-2 clay is the closest tonal cousin; ink is the boldest).
**Best for:** a micro-sentiment ("celebrate love"), an occasion beat, a breather between photo-led posts.
**Avoid for:** anything needing a sentence (use `card-quote-lineart`), product drops, CTAs.

One Cervanttis line, centred on a flat field — or, with `surface: photo`, on a plate darkened by a 50% ink shade. The softest beat in the feed. Nothing else exists on the canvas.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | optional | script line | `surface` lever: tan-1, tan-2, ink, or photo. `photo` token only used when surface=photo. |

## Surfaces

| Surface | Field | Type |
|---|---|---|
| `tan-1` | cream #F0E5D0 | ink |
| `tan-2` | clay #B89A75 | white |
| `ink` | #1A1612 | white |
| `photo` | plate + rgba(26,22,18,.50) shade | white |

## Tokens

**cover** — `line` (text), `photo` (image, optional); lever `surface: tan-1|tan-2|ink|photo`

`photo` accepts a URL, `samples/…`, or `query: <natural language>` (asset-library semantic search; brand-photographer skill as fallback).

## Voice discipline

- Two or three words, lowercase: "celebrate love", "with care", "for the makers".
- Cervanttis 80px (88 story, 60 landscape) — the line is the artwork; don't shrink it to fit more words. Fewer words instead.
- Chrome-free lane. AU English.
