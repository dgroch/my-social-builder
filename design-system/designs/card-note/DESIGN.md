# Design — Studio Note (`card-note`)

**Lane:** Studio note. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 8 of the 2023 PSD kit — paper texture, line-art bloom, a small script line. The seed's paper becomes clay-tint with a fine fractal grain.
**Best for:** hiring, hours changes, small announcements, a public thank-you.
**Avoid for:** product drops, long copy, anything urgent.

A note pinned to the studio door: textured clay-tint paper, a single ink line-art bloom, one lowercase Cervanttis line, and (optionally) one quiet sans line of detail beneath. Humble by design — the smallness is the charm.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | none | paper note | Bloom above, line centred, optional sub line beneath. |

## Grid

- Figure (the `motif` lever) in a 340×300 box (420×380 story, 260×200 landscape), centred,
  48px above the line — a CSS mask from `assets/lineart/<motif>.svg`, ink at 88%.
- Line: Cervanttis 76px (88 story, 60 landscape), ink, centred.
- Sub: Neuzeit Light 28px, 24px beneath, 85% opacity.
- Paper grain: inline SVG fractal noise at 6% — never an imported texture image.

## Tokens

**cover** — `line` (text), `sub` (optional); lever
`motif: hand-plant|hand-flower|hand-rose|body-flower|face-1|face-2`

## Voice discipline

- The line is lowercase and small-town: "we're hiring", "closed good friday", "thank you, melbourne".
- The sub carries the logistics ("florists & drivers — melbourne studio") so the script line never has to.
- Chrome-free lane. AU English.
