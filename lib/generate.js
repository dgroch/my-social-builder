'use strict';
// Prompt-a-campaign: turn a one-paragraph brief into an integrated suite of posts.
// Claude (claude-opus-4-8) composes against the live design-system schema; photo tokens
// come back as "query: …" so the asset library resolves real plates at render time.
// Requires ANTHROPIC_API_KEY — callers should surface a clear 501 when it's absent.

const { buildSchema } = require('./parseDesigns');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

function hasKey() { return !!process.env.ANTHROPIC_API_KEY; }

// Compact, deterministic digest of the design system — the contract Claude writes against.
function schemaDigest() {
  const schema = buildSchema();
  const lanes = Object.entries(schema.lanes).map(([id, l]) =>
    `- ${id}: ${l.intent} Voice: ${l.voice}`).join('\n');
  const designs = Object.values(schema.designs).map(d => {
    const slides = Object.entries(d.slides).map(([sid, s]) => {
      const tokens = s.tokens.map(t =>
        `${t.name}(${t.type}${t.optional ? ', optional' : ''}): ${t.help}`).join(' | ');
      const levers = s.levers.map(l => `${l.name}=${l.values.join('/')}`).join(' ');
      return `    ${sid} [photo:${s.photo}]${levers ? ' levers: ' + levers : ''}\n      tokens: ${tokens}`;
    }).join('\n');
    return `* ${d.id} (lane ${d.lane}, ${d.format}, ratios ${d.ratios.join(' ')}, primary ${d.primaryRatio})\n` +
           `  bestFor: ${d.bestFor.join(', ')} | avoidFor: ${d.avoidFor.join(', ')}\n` +
           `  recommended sequence: ${d.recommendedSequence.join(' → ')}\n${slides}`;
  }).join('\n');
  return `LANES:\n${lanes}\n\nDESIGNS (the only valid design/slide/token names):\n${designs}`;
}

const SYSTEM_RULES = `You are the Fig & Bloom social campaign composer. Fig & Bloom is a premium florist
(Melbourne & Sydney studios, AU-wide delivery). You write campaigns for their social design system.

Voice: calm, feeling-first, plain-spoken AU English. Reads like a weekend magazine, never like an ad.
Hard rules — never break these:
- No urgency, no countdowns, no "last chance", no discount or "save %" framing, no giveaways.
- Never invent a real-sounding customer for testimonial/review content. Unless the brief supplies a
  real verbatim quote, attribute illustrative quotes as "An illustrative note" or to the brand —
  never a fabricated name like "Sarah M".
- Cervanttis voice lines are their own block: lowercase, human, an aside — never an italicised word inside a sentence.
- Emphasis on a markdown display token (headline/lede/quote) is the rare *turn word* only: wrap it in
  _underscores_ to set it in italic Lust. Use at most ~3 across a deck — never on every slide, never a
  whole line. (Asterisks *word* are a legacy roman accent; prefer _word_.)
- Quote marks on the editorial pullquote slide are template chrome — never include them in the token.
- card-* lanes are chrome-free statics; story/carousel lanes carry the logo.

Composing a campaign (an integrated suite that hangs together on the Instagram grid):
- Choose 3 to 6 posts across DIFFERENT lanes that fit the brief. Vary the visual register so the
  grid alternates: photo-led posts, flat type-led statics (card-*), and dark/light plates.
- Every feed post uses the SAME ratio (default "4:5") so the grid is coherent. You may include
  at most one "9:16" story post when the brief calls for it.
- Tokens must use EXACTLY the token names the chosen slide declares. Fill every non-optional token.
  Set lever tokens (theme/align/panel/surface/motif) explicitly from their allowed values.
- Every photo/image token must be the form "query: <natural-language description of the plate>"
  describing an on-brand photograph (moody, editorial, dark wood/linen, soft directional light,
  hands welcome). The asset library resolves the query to a real Fig & Bloom asset at render time.
- carousel-journal has two registers — pick by the brief:
  · EDITORIAL BLOG CAROUSEL (8–10 slides; the default for blog / guide / explainer promotion).
    Open with cover (layout: editorial, theme: dark) — a foot-anchored headline, standfirst and a
    byline like "Words — Kellie, Co-founder". Build the body by ALTERNATING themes for rhythm:
    statement (theme: clay) then statement (theme: dark), broken every 3–4 slides by a photo-statement,
    with one quote (theme: dark) pull-quote near the middle. Close with closing (theme: light) carrying
    the author card: avatar, author_name, author_role and read_label ("Read the full entry").
    A proven 9-slide rhythm: cover → statement(clay) → statement(dark) → photo-statement → quote(dark)
    → statement(clay) → statement(dark) → photo-statement → closing(light). Pagination ("NN / NN") is
    automatic — never author an index/pagination token.
    Slide vocabulary: statement = one serif headline + an optional short sans body; quote = a single
    pull-quote (no quote marks — the glyph is chrome) + attribution; photo-statement = a full-bleed
    plate with kicker + serif headline + an optional standfirst.
  · TIPS / TRIAD CAROUSEL (only when the brief is a short list of tips): cover → intro → interior →
    interior → closing, where each interior has exactly three label/quote sections.
  The closing author avatar is the brand author headshot — use a direct image URL if the brief
  supplies one, not a "query: …".
- Copy is short. Headlines declare; bodies are one or two short lines; CTAs are quiet
  ("Read the journal →", "See the range →" — arrows welcome).`;

// Structured-output schema. Token maps come back as name/value pairs (strict JSON schema
// can't express a freeform object), and we fold them into objects server-side.
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'posts'],
  properties: {
    name: { type: 'string', description: 'Short campaign name' },
    rationale: { type: 'string', description: 'One paragraph: how the set hangs together on the grid' },
    posts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['postName', 'design', 'ratio', 'slides'],
        properties: {
          postName: { type: 'string' },
          design: { type: 'string', description: 'A design id from the digest' },
          ratio: { type: 'string', description: 'One of the design\'s ratios, e.g. "4:5"' },
          slides: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['slide', 'tokens'],
              properties: {
                slide: { type: 'string', description: 'A slide id the design declares' },
                tokens: {
                  type: 'array',
                  description: 'Every token + lever for this slide as name/value pairs',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['name', 'value'],
                    properties: { name: { type: 'string' }, value: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

function foldTokenPairs(generated) {
  return {
    name: generated.name,
    rationale: generated.rationale || '',
    posts: (generated.posts || []).map(p => ({
      postName: p.postName,
      design: p.design,
      ratio: p.ratio,
      slides: (p.slides || []).map(s => {
        const tokens = {};
        for (const t of (s.tokens || [])) tokens[t.name] = t.value;
        return { slide: s.slide, tokens };
      })
    }))
  };
}

// Revise one post against reviewer feedback. Same contract as generation; the
// single-post slice of the output schema keeps the response parseable.
const POST_SCHEMA = OUTPUT_SCHEMA.properties.posts.items;

async function revisePost(post, feedbackTexts, brief) {
  if (!hasKey()) {
    const err = new Error('Revision needs ANTHROPIC_API_KEY on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_RULES + '\n\n' + schemaDigest(), cache_control: { type: 'ephemeral' } }
    ],
    output_config: { format: { type: 'json_schema', schema: POST_SCHEMA } },
    messages: [{
      role: 'user',
      content: 'Revise this post to address the reviewer feedback. Change only what the feedback ' +
        'implicates — keep every other token, the design, and the ratio as they are unless the ' +
        'feedback requires otherwise (e.g. legibility feedback may mean switching a theme/surface ' +
        'lever). Keep existing photo URLs unless the feedback asks for a different plate; a new ' +
        'plate must use the "query: …" form.' +
        (brief ? '\n\nCampaign brief, for context:\n' + brief : '') +
        '\n\nThe post:\n' + JSON.stringify(post, null, 2) +
        '\n\nReviewer feedback:\n' + feedbackTexts.map(t => '- ' + t).join('\n')
    }]
  });
  if (response.stop_reason === 'refusal') throw new Error('The model declined this revision. Rephrase the feedback and try again.');
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const revised = foldTokenPairs({ name: '', posts: [JSON.parse(text)] }).posts[0];
  return { post: revised, model: response.model, usage: response.usage };
}

async function generateCampaign(brief, opts) {
  opts = opts || {};
  if (!hasKey()) {
    const err = new Error(
      'Campaign generation needs an Anthropic API key. Set ANTHROPIC_API_KEY on the server ' +
      '(Render dashboard → Environment), or have an agent compose the campaign and POST it to /api/campaigns.'
    );
    err.code = 'NO_API_KEY';
    throw err;
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_RULES + '\n\n' + schemaDigest(), cache_control: { type: 'ephemeral' } }
    ],
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [{
      role: 'user',
      content: 'Compose the campaign for this brief:\n\n' + String(brief) +
        (opts.ratio ? `\n\nUse "${opts.ratio}" as the shared feed ratio.` : '')
    }]
  });
  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined this brief. Rephrase it and try again.');
  }
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return { campaign: foldTokenPairs(JSON.parse(text)), model: response.model, usage: response.usage };
}

module.exports = { generateCampaign, revisePost, schemaDigest, foldTokenPairs, hasKey, OUTPUT_SCHEMA, POST_SCHEMA, SYSTEM_RULES, MODEL };
