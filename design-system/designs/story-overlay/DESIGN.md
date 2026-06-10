# Design — Story Overlay (`story-overlay`)

**Lane:** Overlay (one large translucent word over a hand-held or in-stillness plate). **Format:** single-slide Story. **Primary ratio:** 9:16 (1080×1920). Also 4:5, 1:1.
**Best for:** a single word worth holding for a moment — "Held", "Quiet", "Bloom", "Slow", "Hand-tied". A **micro-moment**, not a message.
**Avoid for:** anything that needs a sentence (use `story-editorial`), a product (use `story-promo`), a process vignette (use `story-studio`).

The lane is **one word**, large and translucent, sitting over a real photo. The word is the moment; the photo is the breath. **No body copy, no attribution, no headline body.** Just the kicker, the word, and the chrome.

## Slides

| Slide | Photo | Role | Notes |
|---|---|---|---|
| `cover` | required (hand-held) | one-word moment | The plate fills the canvas; the word floats in the centre at 55% opacity. |

## Grid (9:16)

- Outer margin **88px** on the chrome (kicker, logo, CTA). The word itself ignores the margin — it is centred in the full canvas.
- Plate fills the canvas (`background: cover`).
- Type stacks with these fixed positions:
  - Kicker at y=120 (centred horizontally), sans 22px, all-caps, letter-spacing .32em, white at 85% opacity.
  - Word — flex-centred in the full canvas (top:0 right:0 bottom:0 left:0, flex centring). Cervanttis 340px / 1.0, white at **55% opacity**. Italic accent via `*word*`.
  - Hairline rule at y=1720, 1px, white at 35% opacity.
  - Logo bottom-left at y=1820, white wordmark.
  - CTA bottom-right at y=1826, sans 22px, all-caps, white.

## Tokens

**cover** — `kicker`, `word` (markdown — `*word*` is honoured for italic accent), `cta`, `photo` (image)

The `word` token is parsed for `*italic*` markers. Keep it to **one word** or a very short phrase. Two words max. If you need a sentence, use `story-editorial`.

## Voice discipline

- The word is the **moment**, not the message. It is not a sentence and not a call to action.
- The kicker is the **context**, set small and quiet. "This week", "From the studio", "On hand-tied mornings".
- The CTA is a soft suggestion: "Read on →", "See the journal →", "Have a look →". Not "Shop now!" or "Buy!".
- No urgency. No discount. No "WIN" or giveaway framing (the original "WIN" reference was structural, not a permission slip for giveaway language — Fig & Bloom does not run giveaways).

## Non-negotiables

- The plate must be a **real, named Fig & Bloom asset** — hand-held, in-stillness, a moment. Never stock.
- The word is **translucent** (55% opacity). It is a moment, not a billboard.
- One word. If the brief needs more, escalate to `story-editorial`.
- Pink-rose plates: the bouquet is the sole colour statement; the chrome stays in the four-token palette.
- Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).

## Palette

`--ink #000000` · `--white #FFFFFF` · `--clay-tint #ECE6DF` · `--clay #D8CCBE` — see `design-system/SYSTEM.md` for the full token contract.
