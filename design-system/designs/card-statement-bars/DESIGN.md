# Design — Statement Bars (`card-statement-bars`)

**Lane:** Statement. **Format:** single static. **Primary ratio:** 1:1 (1080×1080). Also 4:5, 9:16, 1.91:1.
**Seed:** Design 2 of the 2023 PSD kit — the magenta block in the seed is the photo slot, not a colour. The seed's didone caps map to Lust caps; the highlight bars stay ink.
**Best for:** a bold campaign line, a wit moment, a declaration ("MY HOUSEPLANT IS MY PET").
**Avoid for:** long copy, soft poetic lines (use `card-quote-lineart`), anything discount-framed.

Stacked Lust caps on ink highlight bars, ragged-right, crossing the plate's right edge onto the white field. The bars are set as one text run with `box-decoration-break: clone`, so **every newline in the headline becomes its own bar** — the author controls the rag.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required | declaration over plate | Bars bottom-right; plate fills the left ~74%. |

## Grid

- **1:1** — plate 74% wide, full height; bars right-aligned, 24px from the right edge, 96px up from the bottom; Lust 88px caps on ink bars.
- **4:5** — plate 78% × 88%.
- **9:16** — plate 84% × 78%; bars clear the bottom UI zone (≥420px up).
- **1.91:1** — plate 62% wide; bars at 64px.

## Tokens

**cover** — `photo` (image), `headline` (text — break lines yourself with newlines; 2–5 short lines, 1–3 words each)

`photo` accepts a URL, `samples/…`, or `query: <natural language>` (asset-library semantic search at render time; brand-photographer skill is the fallback when nothing matches).

## Voice discipline

- Each line is 1–3 words. The break *is* the rhythm — write the rag deliberately.
- Wit is welcome; urgency is not. No "SALE", no "LAST CHANCE".
- Chrome-free lane: no logo, no CTA. The type is the brand.
- AU English.
