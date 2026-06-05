'use strict';
// Zero-dependency guardrails (no Chromium needed): schema parses, and the sample post
// assembles every slide with no unfilled tokens.
const assert = require('assert');
const { buildSchema } = require('../lib/parseDesigns');
const { assembleSlide } = require('../lib/render');
const sample = require('../examples/flower-card-carousel-4x5.json');

const schema = buildSchema();
assert(schema.designs['carousel-journal'], 'carousel-journal present');
assert(schema.designs['carousel-journal'].slides.cover.tokens.length >= 4, 'cover tokens parsed');
assert(schema.designs['carousel-journal'].slides.intro, 'intro slide present');

let checked = 0;
for (const s of sample.slides) {
  const { leftover } = assembleSlide(schema, sample.design, s.slide, s.tokens, sample.ratio);
  assert.strictEqual(leftover.length, 0, `slide ${s.slide} has unfilled tokens: ${leftover}`);
  checked++;
}
console.log(`OK — schema valid, ${checked} slides assembled with zero unfilled tokens.`);
