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
  // ratio-adaptive hooks: templates key their layout off these stage classes,
  // e.g. ".stage.land" or ".stage.r9x16", so one template serves every ratio.
  v.ORIENT = r.w > r.h ? 'land' : (r.w === r.h ? 'square' : 'port');
  v.RATIO_CLASS = 'r' + ratio.replace(/:/g, 'x').replace(/\./g, '_');

  // levers default to their first enum value when the post omits them, so a template
  // can grow a lever (align, panel, surface, …) without breaking existing posts.
  for (const lv of (slideMeta.levers || [])) {
    if (v[lv.name] == null && lv.values && lv.values.length) v[lv.name] = lv.values[0];
  }
  // theme lever → computed class + logo colour. Applies to any slide that declares a
  // `theme` token (previously hard-coded to slide === 'cover'); the manifest's per-slide
  // `levers` block is the source of truth for which slides have it.
  if (v.theme != null) {
    const theme = (v.theme === 'dark') ? 'dark' : 'light';
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

// Singleton browser — re-using one Chromium instance across renders is
// ~10x faster than launching per-call. Lazy-init on first use.
let _browser = null;
let _launching = null;
async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  if (_launching) return _launching;
  const puppeteer = require('puppeteer');
  const execPath = process.env.CHROMIUM_PATH || undefined;
  // --disable-quic: force TCP for image CDNs — UDP/443 is blocked on several
  // hosting sandboxes and silently times out as ERR_QUIC_PROTOCOL_ERROR.
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none', '--disable-dev-shm-usage', '--disable-quic'];
  // PUPPETEER_IGNORE_CERT_ERRORS=1: only for dev sandboxes that TLS-intercept
  // outbound traffic (Chromium won't trust the proxy CA). Never set in production.
  if (process.env.PUPPETEER_IGNORE_CERT_ERRORS === '1') args.push('--ignore-certificate-errors');
  if (process.env.CHROMIUM_EXTRA_ARGS) args.push(...process.env.CHROMIUM_EXTRA_ARGS.split(/\s+/).filter(Boolean));
  _launching = puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args
  }).then(b => {
    _browser = b;
    _launching = null;
    b.on('disconnected', () => { _browser = null; });
    return b;
  }).catch(e => { _launching = null; throw e; });
  return _launching;
}

async function closeBrowser() {
  if (_browser) { try { await _browser.close(); } catch {} _browser = null; }
}

// Rasterise an entire post to PNGs (base64), one per slide. Requires puppeteer.
// Concurrent callers (try-on grid, campaign previews) are serialized through a
// promise chain — the singleton Chromium wedges its protocol under parallel
// newPage/screenshot pressure, and one render at a time is fast (~1-2s warm).
let _queue = Promise.resolve();
function renderPost(post, opts) {
  const job = _queue.then(() => _renderPost(post, opts));
  _queue = job.catch(() => {});
  return job;
}

async function _renderPost(post, opts) {
  opts = opts || {};
  const scale = opts.scale || 2;
  const schema = buildSchema();
  // "query: …" photo tokens resolve against the asset library before any
  // Chromium work — a miss fails fast with brand-photographer guidance.
  const assets = require('./assets');
  const resolved = await assets.resolvePostPhotos(post, schema);
  post = resolved.post;
  const browser = await getBrowser();
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
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
  return { slices, resolutions: resolved.resolutions };
}

process.on('SIGTERM', () => { closeBrowser(); process.exit(0); });
process.on('SIGINT',  () => { closeBrowser(); process.exit(0); });

module.exports = { assembleSlide, renderPost, assetsBaseUrl, mdItalic, closeBrowser };
