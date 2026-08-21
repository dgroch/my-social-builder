'use strict';
// Official CoS fail frames for carousel-journal slides that stamp the lockup.
//
// Cover (v3.6.3): 4:5 masthead light
//   THE JOURNAL / chrome test / Birthday flowers
//   FOR MOMENT MAKERS stamped under Fig & Bloom on the plate.
// Interior / closing (v3.6.4): those slides hardcoded logo_h_*.png, so a
// three-up still showed the slogan after the cover was fixed. Two official
// CoS packs — both must pass:
//   Send it to the house — interior 02: AFTER THE FUNERAL / FAMILY FLOWERS ONLY
//     closing dark: "Once the service has ended, the kinder destination is the house."
//   Birthday — interior 02: THE JOURNAL / start from their taste / BRIGHT Marseille
//     closing dark: "Shop the person, then the room."
// Intro shares the same footer lockup — wired so we do not bounce again.
//
// That slogan is baked into logo_h_{black,white}.png (759×173). Slides that
// stamp {{LOGO_FILE}} + declare lockup default to the wordmark crop.
//
// This test uses those exact chromes as the fail case:
//   lockup=full        → must still look like the CoS frame (slogan present)
//   lockup omitted /
//   lockup=wordmark    → must NOT look like it (slogan absent)
// Hiding the footer via layout=editorial is not a fix and fails here.
// Same token ({{LOGO_FILE}}), not a type hide of the tagline.
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

const coverExample = require('../examples/journal-cover-masthead-light-4x5.json');
const interiorFuneral = require('../examples/journal-interior-funeral-4x5.json');
const closingFuneral = require('../examples/journal-closing-dark-4x5.json');
const interiorBirthday = require('../examples/journal-interior-birthday-4x5.json');
const closingBirthday = require('../examples/journal-closing-birthday-4x5.json');
const flowerCard = require('../examples/flower-card-carousel-4x5.json');

const COVER = Object.assign({}, coverExample.slides[0].tokens);
const INTERIOR = Object.assign({}, interiorFuneral.slides[0].tokens);
const CLOSING_DARK = Object.assign({}, closingFuneral.slides[0].tokens);
const INTERIOR_BIRTHDAY = Object.assign({}, interiorBirthday.slides[0].tokens);
const CLOSING_BIRTHDAY = Object.assign({}, closingBirthday.slides[0].tokens);
const INTRO = Object.assign({}, flowerCard.slides.find(s => s.slide === 'intro').tokens);
const CLOSING_LIGHT = {
  kicker: 'The Point of View',
  headline: 'A note from the studio',
  body: 'The house is the kinder destination.',
  author_name: 'Kellie',
  author_role: 'Co-founder, Fig & Bloom',
  read_label: 'Read the full entry',
  url: 'figandbloom.com',
  photo: 'samples/osaka_45.png',
  theme: 'light'
};

function logoFileFrom(html, cls) {
  const re = new RegExp('class="' + (cls || 'logo') + '"[^>]*src="[^"]+\\/assets\\/([^"?]+)');
  const m = html.match(re);
  return m ? m[1] : null;
}

function assemble(slideId, tokens, extra) {
  return assembleSlide(schema, 'carousel-journal', slideId, Object.assign({}, tokens, extra), '4:5');
}

function assembleCover(schema, extra) {
  return assembleSlide(schema, 'carousel-journal', 'cover', Object.assign({}, COVER, extra), '4:5');
}

const schema = buildSchema();
assert.strictEqual(schema.version, '3.6.4', 'manifest version is 3.6.4');

const journal = schema.designs['carousel-journal'].slides;
for (const slide of ['cover', 'intro', 'interior', 'closing']) {
  const lockup = journal[slide].levers.find(l => l.name === 'lockup');
  assert(lockup, `${slide} declares lockup lever`);
  assert.deepStrictEqual(lockup.values, ['wordmark', 'full'], `${slide} lockup enum is wordmark|full`);
  assert.strictEqual(lockup.values[0], 'wordmark', `${slide} wordmark is the default (first enum value)`);
}

// Official CoS copy on the cover example (THE JOURNAL / chrome test / Birthday flowers)
assert.strictEqual(coverExample.design, 'carousel-journal');
assert.strictEqual(coverExample.ratio, '4:5');
assert.strictEqual(coverExample.slides[0].slide, 'cover');
assert.strictEqual(COVER.kicker, 'The Journal');
assert.strictEqual(COVER.voice, 'chrome test');
assert.strictEqual(COVER.headline, 'Birthday flowers');
assert.strictEqual(COVER.cta, 'Read the guide');
assert.strictEqual(COVER.theme, 'light');
assert.strictEqual(COVER.layout, 'masthead', 'CoS frame is masthead — do not hide the footer');
assert.strictEqual(COVER.lockup, undefined, 'example omits lockup (default wordmark)');

// Official CoS pack: Send it to the house
assert.strictEqual(INTERIOR.kicker, 'After the funeral');
assert.strictEqual(INTERIOR.index, '02');
assert.strictEqual(INTERIOR.voice, 'read the notice first');
assert.strictEqual(INTERIOR.label_1, 'FAMILY FLOWERS ONLY');
assert.strictEqual(INTERIOR.lockup, undefined, 'funeral interior omits lockup (default wordmark)');
assert.strictEqual(CLOSING_DARK.voice, 'Once the service has ended, the kinder destination is the house.');
assert.strictEqual(CLOSING_DARK.theme, 'dark');
assert.strictEqual(CLOSING_DARK.lockup, undefined, 'funeral closing omits lockup (default wordmark)');

// Official CoS pack: Birthday
assert.strictEqual(INTERIOR_BIRTHDAY.kicker, 'The Journal');
assert.strictEqual(INTERIOR_BIRTHDAY.index, '02');
assert.strictEqual(INTERIOR_BIRTHDAY.voice, 'start from their taste');
assert.strictEqual(INTERIOR_BIRTHDAY.label_1, 'BRIGHT');
assert.strictEqual(INTERIOR_BIRTHDAY.quote_1, 'Marseille');
assert.strictEqual(INTERIOR_BIRTHDAY.label_2, 'SOFT');
assert.strictEqual(INTERIOR_BIRTHDAY.quote_2, 'Osaka');
assert.strictEqual(INTERIOR_BIRTHDAY.label_3, 'QUIET WHITES');
assert.strictEqual(INTERIOR_BIRTHDAY.quote_3, 'Pyrenees');
assert.strictEqual(INTERIOR_BIRTHDAY.lockup, undefined, 'birthday interior omits lockup (default wordmark)');
assert.strictEqual(CLOSING_BIRTHDAY.voice, 'Shop the person, then the room.');
assert.strictEqual(CLOSING_BIRTHDAY.theme, 'dark');
assert.strictEqual(CLOSING_BIRTHDAY.lockup, undefined, 'birthday closing omits lockup (default wordmark)');

function assertWordmarkAssemble(slideId, tokens, cls, expectFile) {
  for (const extra of [{}, { lockup: 'wordmark' }]) {
    const { html, leftover } = assemble(slideId, tokens, extra);
    assert.strictEqual(leftover.length, 0, `${slideId} unfilled: ${leftover}`);
    assert.strictEqual(logoFileFrom(html, cls), expectFile,
      `${slideId} lockup=${extra.lockup || '(omitted)'} must use ${expectFile}`);
    assert(!SLOGAN_RE.test(html), `${slideId} assembled HTML must not spell out the slogan`);
    assert(html.includes('{{LOGO_FILE}}') === false, `${slideId} stamps {{LOGO_FILE}}, not a hardcoded png`);
  }
}

// omitted / default / explicit wordmark all stamp the wordmark file
assertWordmarkAssemble('cover', COVER, 'logo', 'logo_h_black_wordmark.png');
{
  const { html } = assemble('cover', COVER, {});
  assert(/class="stage[^"]*" data-layout="masthead"/.test(html), 'footer stays on masthead');
  assert(!/class="stage[^"]*" data-layout="editorial"/.test(html),
    'must not hide the footer via layout=editorial');
  assert(html.includes('class="foot"'), 'masthead footer (plate lockup) is present');
  assert(html.includes('Birthday flowers'), 'official CoS headline is on the cover');
}

assertWordmarkAssemble('interior', INTERIOR, 'logo', 'logo_h_black_wordmark.png');
assertWordmarkAssemble('interior', INTERIOR_BIRTHDAY, 'logo', 'logo_h_black_wordmark.png');
assertWordmarkAssemble('intro', INTRO, 'logo', 'logo_h_black_wordmark.png');
assertWordmarkAssemble('closing', CLOSING_DARK, 'logo', 'logo_h_white_wordmark.png');
assertWordmarkAssemble('closing', CLOSING_BIRTHDAY, 'logo', 'logo_h_white_wordmark.png');
assertWordmarkAssemble('closing', CLOSING_LIGHT, 'llogo', 'logo_h_black_wordmark.png');
{
  const { html } = assemble('closing', CLOSING_DARK, {});
  assert.strictEqual(logoFileFrom(html, 'logo'), logoFileFrom(html, 'llogo'),
    'closing dark + light markup share the same {{LOGO_FILE}} token');
}

// lockup=full is the official CoS fail frame (slogan on the plate)
{
  const { html, leftover } = assemble('cover', COVER, { lockup: 'full' });
  assert.strictEqual(leftover.length, 0, `unfilled: ${leftover}`);
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'lockup=full keeps logo_h_black.png');
  assert(/class="stage[^"]*" data-layout="masthead"/.test(html), 'CoS fail frame is still masthead');
}
{
  const { html } = assemble('interior', INTERIOR, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'interior lockup=full keeps logo_h_black.png');
}
{
  const { html } = assemble('interior', INTERIOR_BIRTHDAY, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'birthday interior lockup=full keeps logo_h_black.png');
}
{
  const { html } = assemble('closing', CLOSING_BIRTHDAY, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_white.png', 'birthday closing lockup=full keeps logo_h_white.png');
}
{
  const { html } = assemble('intro', INTRO, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_black.png', 'intro lockup=full keeps logo_h_black.png');
}
{
  const { html } = assemble('closing', CLOSING_DARK, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_white.png', 'closing dark lockup=full keeps logo_h_white.png');
}
{
  const { html } = assemble('closing', CLOSING_LIGHT, { lockup: 'full' });
  assert.strictEqual(logoFileFrom(html, 'llogo'), 'logo_h_black.png',
    'closing light lockup=full keeps logo_h_black.png on the author card');
}

// dark cover follows the same split
{
  const { html } = assemble('cover', COVER, { theme: 'dark' });
  assert.strictEqual(logoFileFrom(html), 'logo_h_white_wordmark.png', 'dark + default lockup → white wordmark');
  const full = assemble('cover', COVER, { theme: 'dark', lockup: 'full' });
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

async function measureSlide(browser, slideId, tokens, extra) {
  const { html, w, h } = assemble(slideId, tokens, extra);
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
    const logos = Array.from(document.querySelectorAll('.logo, .llogo'));
    const logo = logos.find(el => {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
    }) || logos[0];
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
      logoClass: logo.className,
      layout: stage && stage.getAttribute('data-layout'),
      theme: stage && stage.getAttribute('data-theme'),
      footDisplay: footStyle && footStyle.display,
      footH: foot ? foot.getBoundingClientRect().height : 0
    };
  }, TAGLINE);
  await pg.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  return info;
}

async function rasterCheck(browser) {
  const page = await browser.newPage();
  const fullInk = await taglineInk(page, pngDataUrl('logo_h_black.png'));
  const wordInk = await taglineInk(page, pngDataUrl('logo_h_black_wordmark.png'));
  const whiteFull = await taglineInk(page, pngDataUrl('logo_h_white.png'));
  const whiteWord = await taglineInk(page, pngDataUrl('logo_h_white_wordmark.png'));
  assert(fullInk.ink > 1000, `full lockup must keep tagline ink (got ${fullInk.ink})`);
  assert.strictEqual(wordInk.ink, 0, `wordmark crop must have zero tagline ink (got ${wordInk.ink})`);
  assert(whiteFull.ink > 1000, `white full lockup must keep tagline ink (got ${whiteFull.ink})`);
  assert.strictEqual(whiteWord.ink, 0, `white wordmark crop must have zero tagline ink (got ${whiteWord.ink})`);
  await page.close();

  const coverCases = [
    { name: 'cover omitted (default wordmark)', extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'cover lockup=wordmark', extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'cover lockup=full (official CoS fail)', extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true }
  ];

  for (const c of coverCases) {
    const info = await measureSlide(browser, 'cover', COVER, c.extra);
    assert.strictEqual(info.layout, 'masthead', `${c.name} must stay masthead (not editorial)`);
    assert.notStrictEqual(info.footDisplay, 'none', `${c.name} must not hide the footer`);
    assert(info.footH > 0, `${c.name} masthead footer must paint`);
    assert.strictEqual(info.src, c.expectFile, `${c.name} loaded ${info.src}`);
    if (c.expectSlogan) {
      assert(info.ink > 1000,
        `${c.name} is the official CoS fail frame and must show FOR MOMENT MAKERS (${info.ink} tagline px)`);
    } else {
      assert.strictEqual(info.ink, 0,
        `${c.name} must not look like the official CoS fail frame (${info.ink} tagline px)`);
    }
    console.log(`OK  ${c.name.padEnd(42)} file=${info.src} taglineInk=${info.ink} layout=${info.layout}`);
  }

  const bodyCases = [
    { name: 'funeral interior omitted (default wordmark)', slide: 'interior', tokens: INTERIOR, extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'funeral interior lockup=wordmark', slide: 'interior', tokens: INTERIOR, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'funeral interior lockup=full (CoS fail)', slide: 'interior', tokens: INTERIOR, extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true },
    { name: 'birthday interior omitted (default wordmark)', slide: 'interior', tokens: INTERIOR_BIRTHDAY, extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'birthday interior lockup=wordmark', slide: 'interior', tokens: INTERIOR_BIRTHDAY, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'birthday interior lockup=full (CoS fail)', slide: 'interior', tokens: INTERIOR_BIRTHDAY, extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true },
    { name: 'intro omitted (default wordmark)', slide: 'intro', tokens: INTRO, extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'intro lockup=wordmark', slide: 'intro', tokens: INTRO, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'intro lockup=full', slide: 'intro', tokens: INTRO, extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true },
    { name: 'funeral closing omitted (default wordmark)', slide: 'closing', tokens: CLOSING_DARK, extra: {}, expectFile: 'logo_h_white_wordmark.png', expectSlogan: false },
    { name: 'funeral closing lockup=wordmark', slide: 'closing', tokens: CLOSING_DARK, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_white_wordmark.png', expectSlogan: false },
    { name: 'funeral closing lockup=full (CoS fail)', slide: 'closing', tokens: CLOSING_DARK, extra: { lockup: 'full' }, expectFile: 'logo_h_white.png', expectSlogan: true },
    { name: 'birthday closing omitted (default wordmark)', slide: 'closing', tokens: CLOSING_BIRTHDAY, extra: {}, expectFile: 'logo_h_white_wordmark.png', expectSlogan: false },
    { name: 'birthday closing lockup=wordmark', slide: 'closing', tokens: CLOSING_BIRTHDAY, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_white_wordmark.png', expectSlogan: false },
    { name: 'birthday closing lockup=full (CoS fail)', slide: 'closing', tokens: CLOSING_BIRTHDAY, extra: { lockup: 'full' }, expectFile: 'logo_h_white.png', expectSlogan: true },
    { name: 'closing light omitted (default wordmark)', slide: 'closing', tokens: CLOSING_LIGHT, extra: {}, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'closing light lockup=wordmark', slide: 'closing', tokens: CLOSING_LIGHT, extra: { lockup: 'wordmark' }, expectFile: 'logo_h_black_wordmark.png', expectSlogan: false },
    { name: 'closing light lockup=full', slide: 'closing', tokens: CLOSING_LIGHT, extra: { lockup: 'full' }, expectFile: 'logo_h_black.png', expectSlogan: true }
  ];

  for (const c of bodyCases) {
    const info = await measureSlide(browser, c.slide, c.tokens, c.extra);
    assert.strictEqual(info.src, c.expectFile, `${c.name} loaded ${info.src}`);
    if (c.expectSlogan) {
      assert(info.ink > 1000,
        `${c.name} must show FOR MOMENT MAKERS (${info.ink} tagline px)`);
    } else {
      assert.strictEqual(info.ink, 0,
        `${c.name} must have taglineInk=0 (${info.ink} tagline px)`);
    }
    console.log(`OK  ${c.name.padEnd(42)} file=${info.src} taglineInk=${info.ink} logo=.${info.logoClass}`);
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
      console.log('ALL CLEAR — official CoS chrome: default/wordmark has no FOR MOMENT MAKERS on cover/intro/interior/closing for both Send-it-to-the-house and Birthday packs; lockup=full still looks like the fail frames.');
    } finally {
      await browser.close();
    }
  })().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { assembleCover, logoFileFrom, COVER, INTERIOR, INTERIOR_BIRTHDAY, CLOSING_DARK, CLOSING_BIRTHDAY, TAGLINE };
