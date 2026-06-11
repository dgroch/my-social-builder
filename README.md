# Fig & Bloom — Social Post Builder

A local token-editor **UI + render server** for building on-brand Fig & Bloom social posts —
carousels and statics — from locked design-system templates. v3 ships **14 lanes** — the v2
story/carousel set plus seven `card-*` statics reconciled from the 2023 PSD seed kit (`/seeds`),
each rendering at 1:1, 4:5, 9:16 and 1.91:1. Pick a design + ratio, fill the
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

## The three journeys

The UI is organised around how the tool is actually used:

**1. New post — start from an asset (try the templates on).** Paste a photo URL or search the
asset library, give it one line, and the builder renders it across every applicable template at
once — a contact sheet of the same content in 16 compositions. Click the one that works to
fine-tune every token in the editor.

**2. Campaigns — review a suite an agent made.** A campaign is an integrated set of posts that
hang together on the grid. An agent (Claude, via the `social-post-builder` skill) composes the
suite and `POST`s it to `/api/campaigns`; the UI shows it as a 3-up Instagram grid plus a story
strip, with per-post **approve / request changes** and feedback the agent reads back via
`GET /api/campaigns/:id` to iterate. Edit any post in the editor and **Save to campaign**.

**3. Campaigns — prompt one in-app.** Describe the campaign in a sentence or two and the server
has Claude (`claude-opus-4-8`) compose the set against the live design-system schema — different
lanes, one shared feed ratio, photo tokens as `query: …` so the asset library resolves real
plates at render time. Requires `ANTHROPIC_API_KEY` on the server (Render dashboard →
Environment); without it the endpoint returns clear guidance and journey 2 still works.

## What it does

- **Auto-generated form** — fields, help text and lever dropdowns parsed from template headers +
  `design-system/manifest.json`. Add a template → it appears automatically.
- **Semantic photo sourcing** — every image token accepts `query: <describe the shot>`, resolved at
  render time against the [Fig & Bloom Asset Library](https://asset-library-u70t.onrender.com)
  (override with `ASSET_LIBRARY_URL`). The UI adds a **Search assets** picker under each photo
  field. No match → the render fails with guidance to generate a plate via the brand-photographer
  skill and upload it to the library.
- **Validate** — unknown design/slide/token and unfilled tokens, without rendering.
- **Render** — one PNG per slide at 2× via Puppeteer; download individually or as a `.zip`.
- **Import / Export JSON** — round-trip a `post.json` (the interchange format).
- **Save / My posts** — persist posts to disk and reopen.

No Meta push: this app produces the **assets**. A Meta-equipped agent (or you) takes the PNG set
to Ads Manager. (A push button can be added later, mirroring the email builder's Klaviyo push.)

## Persistence — the Notion backend

Saved posts and campaigns live on a pluggable store (`lib/store.js`), the same split as the
email builder: **local-disk JSON by default** (zero setup, but ephemeral on Render — wiped on
every deploy), or a **Notion database** when both env vars are set:

| Env var | Value |
|---|---|
| `NOTION_TOKEN` | an internal-integration secret (the email builder's token works) |
| `NOTION_SOCIAL_DB_ID` | the Social Builder Store database id |

One row per record: summary columns (Type, Design/Ratio or Brief/Source/Posts/Approved/Changes)
for browsing in Notion, and the full record JSON chunked into the `Data` property — the lookup
key is the app's own `Record ID`, so URLs survive a backend switch. **Connect the integration to
the database** (database page → ⋯ → Connections → your integration) or every call 404s.

To recreate the database from scratch, it needs: `Name` (title), `Type` (select: post/campaign),
`Record ID`, `Design`, `Ratio`, `Brief`, `Data` (rich_text), `Source` (select: api/generated),
`Posts`, `Approved`, `Changes` (number). The server logs the active backend at boot
(`store: disk` / `store: notion`).

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
| GET | `/api/assets/search?q=…` | — | semantic asset-library search (proxied) — `{results:[{id,title,url,description,mediaType}]}` |
| POST | `/api/validate` | `{post}` | `{ok,errorCount,warningCount,issues}` without rendering |
| POST | `/api/render` | `{post, scale?}` | `{slices:[{index,slide,w,h,pngBase64,unfilled}]}` — `scale` 0.5–2 (default 2; 0.5 for fast previews) |
| POST | `/api/export` | `{post}` | `{json}` |
| GET | `/api/tryon` | — | the try-on catalog: one photo-bearing slide per design + the slots a user's photo/line drop into |
| GET/POST | `/api/campaigns` | list / `{name, brief?, posts:[post,…]}` | campaigns — the agent-review intake; response includes per-post validation |
| POST | `/api/campaigns/generate` | `{brief, name?, ratio?}` | Claude composes the suite (needs `ANTHROPIC_API_KEY`; 501 with guidance otherwise) |
| GET/PUT/DELETE | `/api/campaigns/:id` | — | one campaign incl. per-post `status` + `feedback[]` (what agents read back) |
| POST | `/api/campaigns/:id/posts/:postId/feedback` | `{text}` | record reviewer feedback (flips post to `changes_requested`) |
| POST | `/api/campaigns/:id/posts/:postId/status` | `{status}` | `pending` \| `approved` \| `changes_requested` |
| PUT | `/api/campaigns/:id/posts/:postId/post` | `{post}` | replace a post body (e.g. after editing; resets to `pending`) |
| GET/POST | `/api/designs` | list / `{name,post}` | saved posts |
| GET/PUT/DELETE | `/api/designs/:id` | — / `{post}` | one saved post |
| POST | `/api/designs/:id/clone` | `{name?}` | a copy |

**Agent loop (journey 2):** compose posts → `POST /api/campaigns` → human reviews in the UI →
`GET /api/campaigns/:id` → act on `posts[*].feedback` / `status` → `PUT …/posts/:postId/post`
with the revision (status resets to `pending`) → repeat until everything is `approved`.

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
