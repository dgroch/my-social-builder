'use strict';
// Zero-dependency guardrails (no Chromium needed): schema parses for all designs, and the
// sample posts assemble every slide with no unfilled tokens.
const assert = require('assert');
const { buildSchema } = require('../lib/parseDesigns');
const { assembleSlide } = require('../lib/render');
const sampleJournal = require('../examples/flower-card-carousel-4x5.json');
const sampleStudio = require('../examples/story-studio-9x16.json');
const samplePromo = require('../examples/story-promo-9x16.json');
const sampleGift = require('../examples/story-gift-9x16.json');

const schema = buildSchema();

// --- design + lane presence ---
const designChecks = [
  ['carousel-journal', 'journal'],
  ['story-studio', 'studio'],
  ['story-promo', 'promo'],
  ['story-gift', 'gift'],
];
for (const [d, l] of designChecks) {
  assert(schema.designs[d], `${d} present`);
  assert(schema.designs[d].lane === l, `${d} lane = ${l}`);
  assert(schema.lanes[l], `${l} lane present`);
  assert(schema.lanes[l].designs.includes(d), `${l} lane lists ${d}`);
}
assert(schema.designs['carousel-journal'].slides.cover.tokens.length >= 4, 'journal cover tokens parsed');
assert(schema.designs['carousel-journal'].slides.intro, 'journal intro slide present');
assert(schema.designs['story-studio'].slides.cover.tokens.length >= 4, 'story-studio cover tokens parsed');
assert(schema.designs['story-promo'].slides.cover.tokens.length >= 4, 'story-promo cover tokens parsed');
assert(schema.designs['story-gift'].slides.intro, 'story-gift intro slide present');
assert(schema.designs['story-gift'].slides.closing, 'story-gift closing slide present');

// --- assembly (no unfilled tokens) ---
const samples = [
  ['journal', sampleJournal],
  ['studio', sampleStudio],
  ['promo', samplePromo],
  ['gift', sampleGift],
];
let checked = 0;
for (const [name, sample] of samples) {
  for (const s of sample.slides) {
    const { leftover } = assembleSlide(schema, sample.design, s.slide, s.tokens, sample.ratio);
    assert.strictEqual(leftover.length, 0, `[${name}] slide ${s.slide} has unfilled tokens: ${leftover}`);
    checked++;
  }
}
console.log(`OK — schema valid, ${checked} slides assembled across ${samples.length} designs with zero unfilled tokens.`);
