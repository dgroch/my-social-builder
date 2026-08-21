'use strict';
// Official CoS fail frame: 4:5 masthead light cover
//   THE JOURNAL / chrome test / Birthday flowers
//   FOR MOMENT MAKERS stamped under Fig & Bloom on the plate.
// That slogan is baked into logo_h_{black,white}.png (759×173). The cover
// stamps {{LOGO_FILE}}; without a lockup lever the renderer only picked
// black/white from theme — which produced this frame.
//
// This test uses that exact chrome as the fail case:
//   lockup=full        → must still look like the CoS frame (slogan present)
//   lockup omitted /
//   lockup=wordmark    → must NOT look like it (slogan absent)
// Hiding the footer via layout=editorial is not a fix and fails here.
//
// Run:  CHROMIUM_PATH=/path/to/chrome npm run test:lockup
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

// Official CoS fail-frame chrome — same tokens as the proof example.
const example = require('../examples/journal-cover-masthead-light-4x5.json');
const COVER = Object.assign({}, example.slides[0].tokens);

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

// Official CoS copy on the example (THE JOURNAL / chrome test / Birthday flowers)
assert.strictEqual(example.design, 'carousel-journal');
assert.strictEqual(example.ratio, '4:5');
assert.strictEqual(example.slides[0].slide, 'cover');
assert.strictEqual(COVER.kicker, 'The Journal');
assert.strictEqual(COVER.voice, 'chrome test');
assert.strictEqual(COVER.headline, 'Birthday flowers');
assert.strictEqual(COVER.cta, 'Read the guide');
assert.strictEqual(COVER.theme, 'light');
assert.strictEqual(COVER.layout, 'masthead', 'CoS frame is masthead — do not hide the footer');
assert.strictEqual(COVER.lockup, undefined, 'example omits lockup (default wordmark)');

// omitted / default / explicit wordmark all stamp the wordmark file
for (const extra of [{}, { lockup: 'wordmark' }]) {
  const { html, leftover } = assembleCover(schema, extra);
  assert.strictEqual(leftover.length, 0, `unfilled: ${leftover}`);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black_wordmark.png',
    `lockup=${extra.lockup || '(omitted)'} must use the black wordmark`);
  assert(!SLOGAN_RE.test(html), 'assembled HTML must not spell out the slogan');
  assert(/class="stage[^"]*" data-layout="masthead"/.test(html), 'footer stays on masthead');
  assert(!/class="stage[^"]*" data-layout="editorial"/.test(html),
    'must not hide the footer via layout=editorial');
  assert(html.includes('class="foot"'), 'masthead footer (plate lockup) is present');
  assert(html.includes('Birthday flowers'), 'official CoS headline is on the cover');
}

// lockup=full is the official CoS fail frame (slogan on the plate)
{
  const { html, leftover } = assembleCover(schema, { lockup: 'full' });
  assert.strictEqual(leftover.length, 0, `unfilled: ${leftover}`);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'lockup=full keeps logo_h_black.png');
  assert(/class="stage[^"]*" data-layout="masthead"/.test(html), 'CoS fail frame is still masthead');
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

console.log('OK — lockup schema, official CoS chrome, assemble defaults, and wordmark assets.');

function pngDataUrl(name) {
  return 'data:image/png;base64,' + fs.readFileSync(path.join(ASSETS, name)).toString('base64');
}

async function taglineInk(page, dataUrl) {
  // Count non-transparent pixels in the lockup's tagline band. Wordmark crops
  // clear this band; the historical lockup (the official CoS source) is full of ink.
  return page.evaluate(async (dataUrl, box) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('failed to load logo png'));
      img.src = dataUrl;
    });
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
  }, dataUrl, TAGLINE);
}

async function rasterCheck(browser) {
  const page = await browser.newPage();
  const fullInk = await taglineInk(page, pngDataUrl('logo_h_black.png'));
  const wordInk = await taglineInk(page, pngDataUrl('logo_h_black_wordmark.png'));
  assert(fullInk.ink > 1000, `full lockup must keep tagline ink (got ${fullInk.ink})`);
  assert.strictEqual(wordInk.ink, 0, `wordmark crop must have zero tagline ink (got ${wordInk.ink})`);
  await page.close();

  const cases = [
    { name: 'omitted (default wordmark)', extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'lockup=wordmark', extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'lockup=full (official CoS fail)', extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true }
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
      const stage = document.querySelector('.stage');
      const foot = document.querySelector('.foot');
      const logo = document.querySelector('.logo');
      const voice = document.querySelector('.voice');
      const headline = document.querySelector('.h');
      if (!logo) return { src: null, ink: null };
      if (!logo.complete) await new Promise((res, rej) => { logo.onload = res; logo.onerror = rej; });
      const src = (logo.currentSrc || logo.src || '').split('/').pop();
      const cnv = document.createElement('canvas');
      cnv.width = logo.naturalWidth; cnv.height = logo.naturalHeight;
      const ctx = cnv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(logo, 0, 0);
      const x0 = box.x, y0 = box.y, w = cnv.width - x0, ht = cnv.height - y0;
      const d = ctx.getImageData(x0, y0, w, ht).data;
      let ink = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 16) ink++;
      const footStyle = foot ? getComputedStyle(foot) : null;
      return {
        src, ink,
        layout: stage && stage.getAttribute('data-layout'),
        footDisplay: footStyle && footStyle.display,
        footH: foot ? foot.getBoundingClientRect().height : 0,
        voice: voice && voice.textContent.trim(),
        headline: headline && headline.textContent.trim()
      };
    }, TAGLINE);
    await pg.close();
    fs.rmSync(tmp, { recursive: true, force: true });
    assert.strictEqual(info.layout, 'masthead', `${c.name} must stay masthead (not editorial)`);
    assert.notStrictEqual(info.footDisplay, 'none', `${c.name} must not hide the footer`);
    assert(info.footH > 0, `${c.name} masthead footer must paint`);
    assert.strictEqual(info.voice, 'chrome test', `${c.name} official CoS voice`);
    assert.strictEqual(info.headline, 'Birthday flowers', `${c.name} official CoS headline`);
    assert.strictEqual(info.src, c.expectFile, `${c.name} loaded ${info.src}`);
    if (c.expectSlogan) {
      assert(info.ink > 1000,
        `${c.name} is the official CoS fail frame and must show FOR MOMENT MAKERS (${info.ink} tagline px)`);
    } else {
      assert.strictEqual(info.ink, 0,
        `${c.name} must not look like the official CoS fail frame (${info.ink} tagline px)`);
    }
    console.log(`OK  ${c.name.padEnd(34)} file=${info.src} taglineInk=${info.ink} layout=${info.layout}`);
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
      console.log('ALL CLEAR — official CoS chrome: default/wordmark has no FOR MOMENT MAKERS; lockup=full still looks like the fail frame.');
    } finally {
      await browser.close();
    }
  })().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { assembleCover, logoFileFrom, COVER, TAGLINE };
