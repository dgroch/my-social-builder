# Design — Testimonial Card (`card-testimonial`)

**Lane:** Testimonial. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 3 of the 2023 PSD kit. The seed's grey line-art on black becomes clay-tint line-art on ink.
**Best for:** customer reviews, social proof, short press quotes.
**Avoid for:** product drops, posts that need a photo (the lane is deliberately photo-free), reviews longer than ~3 sentences.

A white card floating on an ink field, one large line-art figure behind it — the drawing emerges in the bands above and below the card (the `motif` lever picks the figure). The customer's words set in Lust on the card; attribution in tracked small caps. No photo — the absence is the point: the words carry.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | none | review card | Optional clay kicker above the quote ("Kind words"). |

## Grid

- **1:1 / 4:5** — card inset left 10% / right 13% / top & bottom 17% (the asymmetry gives the field tension); 80/72px padding; Lust 56px quote.
- **9:16** — card inset 9% sides, 24%/26% vertical — fully inside the story-UI safe band; Lust 64px.
- **1.91:1** — card inset 15% sides, 13% vertical; Lust 40px.

## Tokens

**cover** — `quote` (text), `attribution` (text), `kicker` (optional); lever
`motif: body-flower|face-1|face-2|hand-flower|hand-rose|front-face`

## Voice discipline

- Their words, verbatim — trim length, never tone. Keep the exclamation mark if they wrote one.
- Attribution is first name + initial: "Darren L". Never a full surname, never "verified buyer".
- Chrome-free lane: no logo, no CTA, no star glyphs.
- AU English (theirs may not be — leave it).
