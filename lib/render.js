'use strict';
// Assembles a slide's HTML from tokens (pure, testable) and rasterises a whole post to
// one PNG per slide via Puppeteer — the same engine the production set ships through.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { dsRoot, buildSchema } = require('./parseDesigns');

function assetsBaseUrl() {
  // file:// base so @font-face, logos and bundled sample plates resolve when Chromium
  // loads the slide from a temp file. Override ASSETS_BASE_URL for a hosted CDN base.
  return process.env.ASSETS_BASE_URL || ('file://' + dsRoot());
}

function mdItalic(s) {
  return String(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

function resolvePhoto(val, base) {
  if (!val) return '';
  if (/^https?:\/\//i.test(val) || /^file:\/\//i.test(val)) return val;
  if (val.startsWith('samples/')) return base + '/assets/' + val;
  return val;
}

// Pure: returns { html, w, h, leftover[] } for one slide.
function assembleSlide(schema, design, slideId, tokens, ratio) {
  const d = schema.designs[design];
  if (!d) throw new Error('Unknown design: ' + design);
  const slideMeta = d.slides[slideId];
  if (!slideMeta) throw new Error('Unknown slide "' + slideId + '" for design "' + design + '"');
  const r = schema.ratios[ratio];
  if (!r) throw new Error('Unknown ratio: ' + ratio);

  const base = assetsBaseUrl();
  let html = fs.readFileSync(path.join(dsRoot(), 'designs', design, slideMeta.template), 'utf8');
  html = html.slice(html.toLowerCase().indexOf('<!doctype')); // strip header comment

  const v = Object.assign({}, tokens);
  v.W = r.w; v.H = r.h; v.ASSETS_BASE = base;

  // theme lever → computed class + logo colour. Applies to any slide that declares a
  // `theme` token (previously hard-coded to slide === 'cover'); the manifest's per-slide
  // `levers` block is the source of truth for which slides have it.
  if (tokens.theme != null) {
    const theme = (tokens.theme === 'dark') ? 'dark' : 'light';
    v.THEME_CLASS = (theme === 'dark') ? 'dark' : '';
    v.LOGO_FILE = (theme === 'dark') ? 'logo_h_white.png' : 'logo_h_black.png';
  }
  // default optional tokens so they don't leave {{placeholders}} (required-but-missing still error)
  for (const t of slideMeta.tokens) {
    if (v[t.name] == null && t.optional) v[t.name] = '';
  }
  // markdown tokens
  for (const t of slideMeta.tokens) {
    if (t.markdown && v[t.name] != null) v[t.name] = mdItalic(v[t.name]);
  }
  // image tokens
  for (const t of slideMeta.tokens) {
    if (t.type === 'image' && v[t.name] != null) v[t.name] = resolvePhoto(v[t.name], base);
  }

  for (const [k, val] of Object.entries(v)) {
    html = html.split('{{' + k + '}}').join(val == null ? '' : String(val));
  }
  const leftover = (html.match(/\{\{[^}]+\}\}/g) || []);
  return { html, w: r.w, h: r.h, leftover };
}

// Rasterise an entire post to PNGs (base64), one per slide. Requires puppeteer.
async function renderPost(post, opts) {
  opts = opts || {};
  const scale = opts.scale || 2;
  const schema = buildSchema();
  const puppeteer = require('puppeteer');
  const execPath = process.env.CHROMIUM_PATH || undefined;
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none']
  });
  // Some image CDNs (e.g. the Fig & Bloom brand-cdn) reject requests without a
  // browser-like Referer. Send a default Referer that satisfies the common case;
  // the slide's own Referer (if any) wins because setExtraHTTPHeaders is per-page.
  const defaultReferer = process.env.RENDER_REFERER || 'https://asset-library-u70t.onrender.com/';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sps-'));
  const slices = [];
  try {
    let i = 0;
    for (const s of post.slides) {
      i += 1;
      const { html, w, h, leftover } = assembleSlide(schema, post.design, s.slide, s.tokens || {}, post.ratio);
      const file = path.join(tmp, `slide-${i}.html`);
      fs.writeFileSync(file, html);
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ Referer: defaultReferer });
      await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
      await page.goto('file://' + file, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
      await page.close();
      // puppeteer returns a Buffer; on some Node versions .toString() on the
      // raw bytes defaults to decimal-comma encoding instead of utf-8, which
      // breaks the .toString('base64') contract downstream. Normalise to a
      // real Buffer first so encoding is consistent.
      const pngBuf = Buffer.isBuffer(png) ? png : Buffer.from(png);
      slices.push({ index: i, slide: s.slide, w, h, png: pngBuf, pngBase64: pngBuf.toString('base64'), unfilled: leftover });
    }
  } finally {
    await browser.close();
  }
  return { slices };
}

module.exports = { assembleSlide, renderPost, assetsBaseUrl, mdItalic };
