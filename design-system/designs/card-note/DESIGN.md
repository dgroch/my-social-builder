# Design — Studio Note (`card-note`)

**Lane:** Studio note. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 8 of the 2023 PSD kit — paper texture, line-art bloom, a small script line. The seed's paper becomes tan-1 with a fine fractal grain.
**Best for:** hiring, hours changes, small announcements, a public thank-you.
**Avoid for:** product drops, long copy, anything urgent.

A note pinned to the studio door: textured tan-1 paper, a single ink line-art bloom, one lowercase Cervanttis line, and (optionally) one quiet sans line of detail beneath. Humble by design — the smallness is the charm.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | none | paper note | Bloom above, line centred, optional sub line beneath. |

## Grid

- Bloom 240px tall (300 story, 170 landscape), centred, 48px above the line.
- Line: Cervanttis 60px (68 story, 48 landscape), ink, centred.
- Sub: Neuzeit Light 16px, 24px beneath, 85% opacity.
- Paper grain: inline SVG fractal noise at 6% — never an imported texture image.

## Tokens

**cover** — `line` (text), `sub` (optional)

## Voice discipline

- The line is lowercase and small-town: "we're hiring", "closed good friday", "thank you, melbourne".
- The sub carries the logistics ("florists & drivers — melbourne studio") so the script line never has to.
- Chrome-free lane. AU English.
