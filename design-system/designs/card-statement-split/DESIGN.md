# Design — Statement Split (`card-statement-split`)

**Lane:** Statement. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 7 of the 2023 PSD kit — the magenta panel in the seed is the photo slot, not a colour.
**Best for:** an editorial pull, a press quote, a campaign line that deserves air.
**Avoid for:** long copy, urgency offers.

The quieter sibling of `card-statement-bars`: stacked Lust caps breathe on a white left column (no bars), the plate stands on the right. An optional clay kicker whispers above; an optional small-caps attribution sits beneath the stack.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | stacked caps beside plate | Copy vertically centred at the left margin; plate flush right. |

## Grid

- **1:1 / 4:5** — plate flush right, 50% wide, inset 15%/12% top & bottom; copy column 42% wide at the 88px margin.
- **9:16** — plate flush right, 71% × 55% from the top; copy below it, clear of the bottom UI zone.
- **1.91:1** — plate full-height right half; copy column 38% at a 56px margin; Lust 48px.

## Tokens

**cover** — `photo` (image), `headline` (text — newline-broken stack, 3–6 short lines), `attribution` (optional), `kicker` (optional)

`photo` accepts a URL, `samples/…`, or `query: <natural language>` (asset-library semantic search at render time; brand-photographer skill is the fallback when nothing matches).

## Voice discipline

- The stack reads top-to-bottom as one sentence — break it where a voice would pause.
- Attribution is small caps, factual: "JEAN HOUSTON", "THE DESIGN FILES, 2026".
- Chrome-free lane: no logo, no CTA.
- AU English.
