# Design — Caption Card (`card-caption`)

**Lane:** Caption card. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 1 of the 2023 PSD kit — the magenta block in the seed is the photo slot, not a colour.
**Best for:** a named bunch, a weekly favourite, a customer's table, anything that reads like a print someone labelled by hand.
**Avoid for:** anything needing body copy, CTAs, prices or urgency.

A single photograph presented like a print pinned to a split field — tan-1 on the left, white on the right — with a Cervanttis label beneath. The seed used a light-grey split; reconciled to the locked palette the field is tan-1/white. **Chrome-free lane:** no logo, no kicker, no CTA. The photo and four or five lowercase words are the whole post.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | print with label | The photo sits on the split seam; caption centred beneath. |

## Grid

- **1:1 / 4:5** — split seam at 57% of width; print 66% wide, 10% top margin, ~60% tall; caption centred in the remaining band.
- **9:16** — print 76% wide; caption sits below it, clear of the bottom UI zone.
- **1.91:1** — seam at 76%; print 70% wide; caption at 44px.

## Tokens

**cover** — `photo` (image), `caption` (text)

`photo` accepts a URL, a bundled `samples/…` path, or `query: <natural language>` — resolved at render time against the asset library (top semantic hit). If nothing matches, generate a plate with the **brand-photographer** skill, upload it to the asset library, and re-render.

## Voice discipline

- The caption is lowercase, affectionate, five words or fewer: "the saturday slow bunch", "for nan", "tuesday's table".
- Cervanttis only. If the line wants caps or punctuation flourish, it belongs in another lane.
- AU English.
