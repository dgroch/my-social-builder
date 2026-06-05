# Fig & Bloom — Social Post Builder

A local token-editor **UI + render server** for building on-brand Fig & Bloom social posts —
carousels and statics — from locked design-system templates. Pick a design + ratio, fill the
tokens in a form that **generates itself from the templates**, render a production-accurate PNG
**set** with Puppeteer, and **download** it (per-slide or a `.zip`). Companion to the
`social-post-builder` skill in `dgroch/skills`, which writes the same `post.json` this app renders.

This is the social-media counterpart to `my-email-builder`: same template-driven philosophy,
same `*.json`-is-the-interchange contract, same auto-syncing form.

## Why this

The brand system has constraints generic tools fight: **custom fonts**, **designed slides that
must be rasterised to PNG** (the type sits on a strict margin grid; live-rendered social chrome
won't preserve it), and **locked lanes** that keep high-volume output cohesive. This tool is built
around those, and the form auto-syncs because every token is self-described in each template's
`<!-- SLIDE … TOKENS: … -->` header.

## Quick start

```
npm install        # installs puppeteer (downloads a Chromium)
npm start          # serves http://localhost:4321
```

Open http://localhost:4321, click **Sample** to load the "flowers are the easy part" carousel,
edit, **Render**, then **Download all (.zip)**.

> Have a system Chromium? `PUPPETEER_SKIP_DOWNLOAD=1 npm install` and set
> `CHROMIUM_PATH=/path/to/chromium`.

## Deploy to Render.com

Ships a `Dockerfile` (Node + system Chromium) and a `render.yaml` Blueprint. In Render:
**New → Blueprint**, pick the repo, **Apply**. First build installs Chromium (a few minutes).
Render has normal outbound internet, so the renderer can load CDN product plates.

## What it does

- **Auto-generated form** — fields, help text and lever dropdowns parsed from template headers +
  `design-system/manifest.json`. Add a template → it appears automatically.
- **Validate** — unknown design/slide/token and unfilled tokens, without rendering.
- **Render** — one PNG per slide at 2× via Puppeteer; download individually or as a `.zip`.
- **Import / Export JSON** — round-trip a `post.json` (the interchange format).
- **Save / My posts** — persist posts to disk and reopen.

No Meta push: this app produces the **assets**. A Meta-equipped agent (or you) takes the PNG set
to Ads Manager. (A push button can be added later, mirroring the email builder's Klaviyo push.)

## Layout

```
server.js                 zero-dep HTTP server (UI + /api/{schema,validate,render,export,designs})
lib/parseDesigns.js       derives the token schema from templates + manifest
lib/render.js             assembleSlide (pure) + renderPost (Puppeteer, one PNG per slide)
lib/designs.js            saved-post store (local disk; Notion backend can be added later)
public/                   editor UI (index.html, app.js, style.css)
design-system/            bundled template library: manifest, fonts, assets, designs/*
examples/                 sample post.json
test/smoke.js             guardrails: schema parses; sample assembles with zero unfilled tokens
```

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/schema` | — | designs, slides, tokens, levers, ratios, lanes (the contract the skill targets) |
| POST | `/api/validate` | `{post}` | `{ok,errorCount,warningCount,issues}` without rendering |
| POST | `/api/render` | `{post}` | `{slices:[{index,slide,w,h,pngBase64,unfilled}]}` |
| POST | `/api/export` | `{post}` | `{json}` |
| GET/POST | `/api/designs` | list / `{name,post}` | saved posts |
| GET/PUT/DELETE | `/api/designs/:id` | — / `{post}` | one saved post |
| POST | `/api/designs/:id/clone` | `{name?}` | a copy |

`post.json` = `{ postName, design, ratio, slides:[{slide, tokens}] }`. See the skill's
`references/post-schema.md`.

## Adding a design / lane

1. Add `design-system/designs/<id>/<slide>.html` with a `<!-- SLIDE … TOKENS: … -->` header.
2. Register it under `designs` (and its `lane`) in `design-system/manifest.json`; add a `DESIGN.md`.
3. It appears in the form and `/api/schema` automatically. Keep `design-system/` in sync with the
   skill's bundled copy (same folder).

## Tests

`npm test` — zero-dependency runner: asserts the schema parses and the sample post assembles every
slide with zero unfilled tokens. (Render-path/Puppeteer is exercised by `npm start` → Render.)

## Fonts

Real commercial fonts: Lust (display) + Cervanttis (italic) + Neuzeit Grotesk (Light body, Bold kicker/CTA).
Swap the files in `design-system/fonts/` for the licensed brand fonts before production.
