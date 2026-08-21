'use strict';
// Guard: a carousel-journal cover (4:5, masthead, light) must not put
// FOR MOMENT MAKERS on the plate when lockup is wordmark or omitted.
// The slogan is baked into logo_h_{black,white}.png (759×173). The cover
// stamps {{LOGO_FILE}}; without a lockup lever the renderer always picked
// those files from theme. This test fails on that CoS frame (full lockup
// on a masthead light cover) and passes on wordmark / default.
//
// Run stand-alone:  CHROMIUM_PATH=/path/to/chrome node test/lockup-wordmark.js
// Or: npm run test:lockup
// Assemble + asset checks are zero-dep; the raster check needs Chromium.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSchema } = require('../lib/parseDesigns');
const { assembleSlide } = require('../lib/render');

const ASSETS = path.join(__dirname, '..', 'design-system', 'assets');
const SLOGAN_RE = /FOR\s+MOMENT\s+MAKERS/i;
// Tagline band on the 759×173 lockup (see crop): lower-right of the canvas.
const TAGLINE = { x: 348, y: 140 };

const COVER = {
  kicker: 'After the funeral',
  voice: 'the kinder destination',
  headline: 'Send it to the house',
  cta: 'Read the guide',
  photo: 'samples/osaka_45.png',
  theme: 'light',
  layout: 'masthead'
};

function logoFileFrom(html) {
  const m = html.match(/class="logo"[^>]*src="[^"]+\/assets\/([^"?]+)/);
  return m ? m[1] : null;
}

function assembleCover(schema, extra) {
  return assembleSlide(schema, 'carousel-journal', 'cover', Object.assign({}, COVER, extra), '4:5');
}

const schema = buildSchema();
assert.strictEqual(schema.version, '3.6.3', 'manifest version is 3.6.3');

const coverLevers = schema.designs['carousel-journal'].slides.cover.levers;
const lockup = coverLevers.find(l => l.name === 'lockup');
assert(lockup, 'cover declares lockup lever');
assert.deepStrictEqual(lockup.values, ['wordmark', 'full'], 'lockup enum is wordmark|full');
assert.strictEqual(lockup.values[0], 'wordmark', 'wordmark is the default (first enum value)');

// omitted / default / explicit wordmark all stamp the wordmark file
for (const extra of [{}, { lockup: 'wordmark' }]) {
  const { html, leftover } = assembleCover(schema, extra);
  assert.strictEqual(leftover.length, 0, `unfilled: ${leftover}`);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black_wordmark.png',
    `lockup=${extra.lockup || '(omitted)'} must use the black wordmark`);
  assert(!SLOGAN_RE.test(html), 'assembled HTML must not spell out the slogan');
}

// lockup=full keeps the historical lockup (the CoS source file)
{
  const { html, leftover } = assembleCover(schema, { lockup: 'full' });
  assert.strictEqual(leftover.length, 0, `unfilled: ${leftover}`);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'lockup=full keeps logo_h_black.png');
}

// dark theme follows the same split
{
  const { html } = assembleCover(schema, { theme: 'dark' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_white_wordmark.png', 'dark + default lockup → white wordmark');
  const full = assembleCover(schema, { theme: 'dark', lockup: 'full' });
  assert.strictEqual(logoFileFrom(full.html), 'logo_h_white.png', 'dark + full → logo_h_white.png');
}

// other designs that stamp {{LOGO_FILE}} but do not declare lockup keep the historical file
{
  const { html } = assembleSlide(schema, 'story-studio', 'cover', {
    kicker: 'In the studio', voice: 'a quiet morning', headline: 'Hands at work',
    body: 'note', cta: 'Read', photo: 'samples/osaka_45.png', theme: 'light'
  }, '9:16');
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png',
    'designs without a lockup lever keep logo_h_*.png');
}

for (const f of ['logo_h_black_wordmark.png', 'logo_h_white_wordmark.png']) {
  assert(fs.existsSync(path.join(ASSETS, f)), `wordmark asset ${f} exists`);
}

// example omits lockup so the default (wordmark) is what Journal drafts get
{
  const example = require('../examples/journal-cover-masthead-light-4x5.json');
  assert.strictEqual(example.design, 'carousel-journal');
  assert.strictEqual(example.ratio, '4:5');
  const s = example.slides[0];
  assert.strictEqual(s.slide, 'cover');
  assert.strictEqual(s.tokens.theme, 'light');
  assert.strictEqual(s.tokens.layout, 'masthead');
  assert.strictEqual(s.tokens.lockup, undefined, 'example omits lockup (default wordmark)');
  const { html } = assembleSlide(schema, example.design, s.slide, s.tokens, example.ratio);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black_wordmark.png');
}

console.log('OK — lockup schema, assemble defaults, and wordmark assets.');

async function taglineInk(page, fileUrl) {
  // Count non-transparent pixels in the lockup's tagline band. Wordmark crops
  // clear this band; the historical lockup (the CoS source) is full of ink.
  return page.evaluate(async (fileUrl, box) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = fileUrl; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const x0 = box.x, y0 = box.y, w = c.width - x0, h = c.height - y0;
    if (w <= 0 || h <= 0) return { ink: 0, w: c.width, h: c.height };
    const d = ctx.getImageData(x0, y0, w, h).data;
    let ink = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 16) ink++;
    return { ink, w: c.width, h: c.height };
  }, fileUrl, TAGLINE);
}

async function rasterCheck(browser) {
  const page = await browser.newPage();
  // Asset-level: the crop must have removed the slogan; the source lockup still has it.
  const black = 'file://' + path.join(ASSETS, 'logo_h_black.png');
  const word = 'file://' + path.join(ASSETS, 'logo_h_black_wordmark.png');
  const fullInk = await taglineInk(page, black);
  const wordInk = await taglineInk(page, word);
  assert(fullInk.ink > 1000, `full lockup must keep tagline ink (got ${fullInk.ink})`);
  assert.strictEqual(wordInk.ink, 0, `wordmark crop must have zero tagline ink (got ${wordInk.ink})`);
  await page.close();

  const cases = [
    { name: 'omitted (default)', extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'lockup=wordmark', extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'lockup=full (CoS frame)', extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true }
  ];

  for (const c of cases) {
    const { html, w, h } = assembleCover(schema, c.extra);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockup-'));
    const file = path.join(tmp, 's.html');
    fs.writeFileSync(file, html);
    const pg = await browser.newPage();
    await pg.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await pg.goto('file://' + file, { waitUntil: 'networkidle0' });
    await pg.evaluateHandle('document.fonts.ready');
    const info = await pg.evaluate(async (box) => {
      const img = document.querySelector('.logo');
      if (!img) return { src: null, ink: null };
      if (!img.complete) await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const src = (img.currentSrc || img.src || '').split('/').pop();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const x0 = box.x, y0 = box.y, w = c.width - x0, ht = c.height - y0;
      const d = ctx.getImageData(x0, y0, w, ht).data;
      let ink = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 16) ink++;
      return { src, ink, nw: img.naturalWidth, nh: img.naturalHeight };
    }, TAGLINE);
    await pg.close();
    fs.rmSync(tmp, { recursive: true, force: true });
    assert.strictEqual(info.src, c.expectFile, `${c.name} loaded ${info.src}`);
    if (c.expectSlogan) {
      assert(info.ink > 1000, `${c.name} must show FOR MOMENT MAKERS (${info.ink} tagline px) — this is the CoS frame`);
    } else {
      assert.strictEqual(info.ink, 0,
        `${c.name} must not show FOR MOMENT MAKERS on the plate (${info.ink} tagline px) — would fail on the CoS frame`);
    }
    console.log(`OK  ${c.name.padEnd(24)} file=${info.src} taglineInk=${info.ink}`);
  }
}

if (require.main === module) {
  (async () => {
    const puppeteer = require('puppeteer');
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH || undefined, headless: 'new',
        args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none', '--disable-quic'],
      });
    } catch (e) {
      console.log('SKIP — lockup raster check needs Chromium (set CHROMIUM_PATH):', e.message.split('\n')[0]);
      process.exit(0);
    }
    try {
      await rasterCheck(browser);
      console.log('ALL CLEAR — default/wordmark covers have no FOR MOMENT MAKERS; lockup=full still can.');
    } finally {
      await browser.close();
    }
  })().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { assembleCover, logoFileFrom, COVER, TAGLINE };
