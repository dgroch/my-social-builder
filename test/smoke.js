'use strict';
// Zero-dependency guardrails (no Chromium needed): schema parses for all designs, and the
// sample posts assemble every slide with no unfilled tokens.
const assert = require('assert');
const { buildSchema } = require('../lib/parseDesigns');
const { assembleSlide } = require('../lib/render');

const sampleJournal  = require('../examples/flower-card-carousel-4x5.json');
const sampleStudio   = require('../examples/story-studio-9x16.json');
const samplePromo    = require('../examples/story-promo-9x16.json');
const sampleGift     = require('../examples/story-gift-9x16.json');
const sampleEditorial = require('../examples/story-editorial-9x16.json');
const sampleGoodWeekend = require('../examples/good-weekend-editorial-9x16.json');
const sampleGoodWeekend45 = require('../examples/good-weekend-editorial-4x5.json');
const sampleQuoteSoft = require('../examples/story-quote-soft-9x16.json');
const sampleTagline  = require('../examples/story-tagline-9x16.json');
const sampleOverlay  = require('../examples/story-overlay-9x16.json');

const schema = buildSchema();

// --- design + lane presence (all 8 designs × 8 lanes) ---
const designChecks = [
  ['carousel-journal',  'journal'],
  ['story-studio',      'studio'],
  ['story-promo',       'promo'],
  ['story-gift',        'gift'],
  ['story-editorial',   'editorial'],
  ['story-quote-soft',  'quote-soft'],
  ['story-tagline',     'tagline'],
  ['story-overlay',     'overlay'],
];
for (const [d, l] of designChecks) {
  assert(schema.designs[d], `${d} present`);
  assert(schema.designs[d].lane === l, `${d} lane = ${l}`);
  assert(schema.lanes[l], `${l} lane present`);
  assert(schema.lanes[l].designs.includes(d), `${l} lane lists ${d}`);
}

// --- assembly (no unfilled tokens) ---
const samples = [
  ['journal',       sampleJournal],
  ['studio',        sampleStudio],
  ['promo',         samplePromo],
  ['gift',          sampleGift],
  ['editorial',     sampleEditorial],
  ['good-weekend',  sampleGoodWeekend],
  ['good-weekend-4x5', sampleGoodWeekend45],
  ['quote-soft',    sampleQuoteSoft],
  ['tagline',       sampleTagline],
  ['overlay',       sampleOverlay],
];
let checked = 0;
for (const [name, sample] of samples) {
  for (const s of sample.slides) {
    const { leftover } = assembleSlide(schema, sample.design, s.slide, s.tokens, sample.ratio);
    assert.strictEqual(leftover.length, 0, `[${name}] slide ${s.slide} has unfilled tokens: ${leftover}`);
    checked++;
  }
}

// --- v3 seed lanes present ---
const v3Checks = [
  ['card-caption',        'caption'],
  ['card-statement-bars', 'statement'],
  ['card-statement-split','statement'],
  ['card-testimonial',    'testimonial'],
  ['card-quote-lineart',  'quote-lineart'],
  ['card-script-moment',  'script-moment'],
  ['card-note',           'note'],
];
for (const [d, l] of v3Checks) {
  assert(schema.designs[d], `${d} present`);
  assert(schema.designs[d].lane === l, `${d} lane = ${l}`);
  assert(schema.lanes[l].designs.includes(d), `${l} lane lists ${d}`);
  assert(schema.designs[d].ratios.includes('1.91:1'), `${d} supports 1.91:1`);
}
assert(schema.ratios['1.91:1'] && schema.ratios['1.91:1'].w === 1200, '1.91:1 ratio registered');

// --- v3.2: story lanes are multi-ratio; the editorial Good Weekend set is complete ---
for (const d of ['story-studio','story-promo','story-gift','story-editorial','story-quote-soft','story-tagline','story-overlay']) {
  assert(schema.designs[d].ratios.includes('1.91:1'), `${d} supports 1.91:1`);
}
for (const s of ['cover','feature','pullquote','column','press','linkout']) {
  assert(schema.designs['story-editorial'].slides[s], `story-editorial has ${s}`);
}
assert.strictEqual(schema.designs['story-editorial'].slides.linkout.photo, 'none', 'linkout is photo-free');
// levers default to their first value — assembling without them leaves nothing unfilled
{
  const { leftover } = assembleSlide(schema, 'story-editorial', 'column',
    { text: 'x', attribution: '', photo: 'samples/osaka_45.png' }, '9:16');
  assert.strictEqual(leftover.length, 0, `lever defaults applied: ${leftover}`);
}

// --- generic: EVERY design/slide assembles at EVERY declared ratio with synthesized tokens ---
let generic = 0;
for (const [id, d] of Object.entries(schema.designs)) {
  for (const [slideId, meta] of Object.entries(d.slides)) {
    const tokens = {};
    for (const t of meta.tokens) tokens[t.name] = t.type === 'image' ? 'samples/osaka_45.png' : 'x';
    for (const l of meta.levers) tokens[l.name] = l.values[0];
    for (const ratio of d.ratios) {
      const { leftover } = assembleSlide(schema, id, slideId, tokens, ratio);
      assert.strictEqual(leftover.length, 0, `[generic] ${id}/${slideId}@${ratio} unfilled: ${leftover}`);
      generic++;
    }
  }
}

// --- asset-library helpers (pure parts; no network) ---
const assets = require('../lib/assets');
assert(assets.isQueryRef('query: moody bouquet'), 'isQueryRef positive');
assert(assets.isQueryRef('  QUERY:  caps and space  '), 'isQueryRef lenient');
assert(!assets.isQueryRef('https://example.com/a.jpg'), 'isQueryRef negative URL');
assert(!assets.isQueryRef('samples/osaka_45.png'), 'isQueryRef negative sample');
assert.strictEqual(assets.queryText('query: moody bouquet '), 'moody bouquet', 'queryText trims');

console.log(`OK — schema valid, ${checked} sample slides + ${generic} generic design/slide/ratio assemblies, asset helpers pass.`);
