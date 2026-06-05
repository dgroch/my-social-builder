'use strict';
// Zero-dependency HTTP server (UI + API). Puppeteer is the only runtime dep, loaded lazily
// inside render.js so the schema/validate/designs endpoints work even without Chromium.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildSchema } = require('./lib/parseDesigns');
const render = require('./lib/render');
const designs = require('./lib/designs');

const PORT = process.env.PORT || 4321;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

// -----------------------------------------------------------------------------
// Component library — pre-render every (design, slide) pair with sample data
// so the UI can show them instantly. The cache is built on first request.
// -----------------------------------------------------------------------------
const SAMPLE_PHOTO = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/floral-arrangement-product-shot-indoor-studio-setting-tabletop-d-1BooMH.jpg';
const SAMPLE_PHOTO_ALT = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/floral-arrangement-indoors-likely-a-home-or-studio-setting-pink-1oJNWF.jpg';

// Realistic sample data for every component. One block per (design, slide).
const SAMPLE_TOKENS = {
  'carousel-journal/cover': {
    kicker: 'The Journal', index: '01', voice: 'on choosing well',
    headline: 'The flowers are the easy part.',
    cta: 'Read the guide →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'carousel-journal/intro': {
    kicker: 'The Journal', index: '02', voice: 'a small guide to borrowing words',
    lede: 'The bouquet brings the colour. The card explains why it is there.',
    body: 'Staring at the blank message box — wondering whether to be funny, formal, brief or heartfelt? Take the pressure off. A card does not need to sound like a poem.',
    lead_in: 'A few to borrow, by moment —', cta: 'Next →', photo: SAMPLE_PHOTO
  },
  'carousel-journal/interior': {
    kicker: 'The Journal', index: '03',
    label_1: 'Just because', quote_1: 'Saw these and thought of you.',
    label_2: 'For a birthday', quote_2: 'A little birthday colour for your home.',
    label_3: 'To say thank you', quote_3: 'Thank you for the way you made a hard week feel lighter.',
    cta: 'Next →'
  },
  'carousel-journal/closing': {
    voice: 'For the moment they feel what you meant.',
    cta: 'Read the guide →', url: 'figandbloom.com/journal', photo: SAMPLE_PHOTO
  },
  'story-studio/cover': {
    kicker: 'In the studio', voice: 'a few minutes from the workshop',
    headline: 'Hands at work, the morning quiet.',
    body: 'A few minutes from the workshop — stem by stem, ribbon by ribbon. The kind of morning that ends with a delivery van, and a thank-you we never see.',
    cta: 'See the journal →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-promo/cover': {
    kicker: 'New in', voice: 'soft, contemporary white',
    headline: 'Lucerne', subhead: 'Hand-tied the morning it is sent.',
    from_price: 'from $105', cta: 'See the range →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-gift/intro': {
    kicker: 'For the moment', voice: 'ribbon, paper, a hand-written card',
    headline: 'A small thank-you, wrapped with care.',
    body: 'Ribbon, paper, a hand-written card tucked in beside the stems. The wrapping is half the gift.',
    cta: 'Next →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-gift/closing': {
    kicker: 'Delivered with care', voice: 'for the moment they feel what you meant',
    cta: 'Choose a moment →', url: 'figandbloom.com/gifting', photo: SAMPLE_PHOTO
  },
  'story-editorial/cover': {
    kicker: 'From the journal', voice: 'on the morning run',
    quote: 'We tie the stems before the morning is half done. We photograph them before the van goes.',
    attribution: 'Fig & Bloom — on the morning run', photo: SAMPLE_PHOTO, theme: 'dark'
  },
  'story-quote-soft/cover': {
    kicker: 'The studio', voice: 'a small, quiet room',
    headline: 'A knot of ribbon, a hand on the stems.',
    body: 'We work where the morning is. The rest of the day is mostly that.',
    url: 'figandbloom.com/journal', cta: 'Visit the link in bio →', photo: SAMPLE_PHOTO_ALT
  },
  'story-tagline/cover': {
    kicker: 'Gift edit', voice: 'for the people who keep a vase on the windowsill',
    headline: 'For the quiet ones',
    subhead: 'A small edit, hand-picked for the people who do not need a reason.',
    cta: 'See the edit →', photo: SAMPLE_PHOTO
  },
  'story-overlay/cover': {
    kicker: 'This week', word: 'HELD', cta: 'Read on →', photo: SAMPLE_PHOTO
  }
};

let LIBRARY_CACHE = null;   // the catalog (always populated lazily)
const LIBRARY_RENDERED = new Map();  // design/slide -> base64 PNG cache

function buildLibrary() {
  const schema = buildSchema();
  const lib = [];
  for (const [designId, d] of Object.entries(schema.designs)) {
    for (const [slideId, meta] of Object.entries(d.slides)) {
      const key = `${designId}/${slideId}`;
      const sample = SAMPLE_TOKENS[key] || {};
      lib.push({
        design: designId,
        designLabel: d.label,
        slide: slideId,
        lane: d.lane,
        laneLabel: schema.lanes[d.lane] && schema.lanes[d.lane].label || d.lane,
        primaryRatio: d.primaryRatio,
        ratios: d.ratios,
        tokens: meta.tokens.map(t => ({ name: t.name, type: t.type, optional: !!t.optional, markdown: !!t.markdown, help: t.help })),
        levers: meta.levers.map(l => ({ name: l.name, type: 'enum', values: l.values, help: l.help })),
        requiresPlate: meta.photo === 'required',
        sample
      });
    }
  }
  return lib;
}

function ensureLibrary() {
  if (!LIBRARY_CACHE) LIBRARY_CACHE = buildLibrary();
  return LIBRARY_CACHE;
}

async function renderComponent(design, slide) {
  const cacheKey = `${design}/${slide}`;
  if (LIBRARY_RENDERED.has(cacheKey)) return LIBRARY_RENDERED.get(cacheKey);
  const lib = ensureLibrary();
  const comp = lib.find(c => c.design === design && c.slide === slide);
  if (!comp) return null;
  const post = {
    postName: `Library · ${comp.design}/${comp.slide}`,
    design: comp.design,
    ratio: comp.primaryRatio,
    slides: [{ slide: comp.slide, tokens: comp.sample }]
  };
  try {
    // Library components are thumbnails for inspection — render at half
    // scale so the server returns within Render's request timeout.
    // Full-resolution renders are still available via the main /api/render
    // endpoint when the user opens a component in the editor.
    const { slices } = await render.renderPost(post, { scale: 0.5 });
    const pngBase64 = slices[0] && slices[0].pngBase64;
    LIBRARY_RENDERED.set(cacheKey, { pngBase64, dimensions: slices[0] && { w: slices[0].w, h: slices[0].h }, error: null });
    return LIBRARY_RENDERED.get(cacheKey);
  } catch (e) {
    LIBRARY_RENDERED.set(cacheKey, { pngBase64: null, error: e.message });
    return LIBRARY_RENDERED.get(cacheKey);
  }
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = ''; req.on('data', c => b += c); req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { resolve({}); } });
  });
}

function validate(post) {
  const schema = buildSchema();
  const issues = []; let errorCount = 0, warningCount = 0;
  const d = schema.designs[post && post.design];
  if (!d) { issues.push({ level: 'error', msg: 'Unknown design: ' + (post && post.design) }); return { ok: false, errorCount: 1, warningCount: 0, issues }; }
  if (!d.ratios.includes(post.ratio)) { issues.push({ level: 'error', msg: 'Ratio ' + post.ratio + ' not supported by ' + d.id }); errorCount++; }
  (post.slides || []).forEach((s, i) => {
    const meta = d.slides[s.slide];
    if (!meta) { issues.push({ level: 'error', slide: i + 1, msg: 'Unknown slide: ' + s.slide }); errorCount++; return; }
    const declared = new Set([...meta.tokens.map(t => t.name), ...meta.levers.map(l => l.name)]);
    for (const k of Object.keys(s.tokens || {})) if (!declared.has(k)) { issues.push({ level: 'warning', slide: i + 1, msg: 'Unknown token "' + k + '" (ignored)' }); warningCount++; }
    try {
      const { leftover } = render.assembleSlide(schema, post.design, s.slide, s.tokens || {}, post.ratio);
      for (const lo of leftover) { issues.push({ level: 'error', slide: i + 1, msg: 'Unfilled ' + lo }); errorCount++; }
    } catch (e) { issues.push({ level: 'error', slide: i + 1, msg: e.message }); errorCount++; }
  });
  return { ok: errorCount === 0, errorCount, warningCount, issues };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p === '/api/schema' && req.method === 'GET') return send(res, 200, buildSchema());
    if (p === '/api/validate' && req.method === 'POST') return send(res, 200, validate((await readBody(req)).post));
    if (p === '/api/export' && req.method === 'POST') { const b = await readBody(req); return send(res, 200, { json: JSON.stringify(b.post, null, 2) }); }
    if (p === '/api/render' && req.method === 'POST') {
      const b = await readBody(req);
      const v = validate(b.post);
      if (!v.ok) return send(res, 400, { error: 'validation', validation: v });
      try { return send(res, 200, await render.renderPost(b.post)); }
      catch (e) { return send(res, 500, { error: 'render', message: e.message }); }
    }
    if (p === '/api/designs' && req.method === 'GET') return send(res, 200, { designs: designs.list() });
    if (p === '/api/designs' && req.method === 'POST') return send(res, 200, designs.create(await readBody(req)));
    const m = p.match(/^\/api\/designs\/([^/]+)(\/clone)?$/);
    if (m) {
      const id = m[1];
      if (m[2] && req.method === 'POST') return send(res, 200, designs.clone(id, (await readBody(req)).name));
      if (req.method === 'GET') return send(res, 200, designs.get(id));
      if (req.method === 'PUT') return send(res, 200, designs.update(id, await readBody(req)));
      if (req.method === 'DELETE') return send(res, 200, designs.remove(id));
    }
    // Component library
    if (p === '/api/library' && req.method === 'GET') {
      const lib = ensureLibrary();
      // Catalog is fast (no rendering); clients fetch each image separately.
      return send(res, 200, { version: '1.0.0', count: lib.length, components: lib });
    }
    const lm = p.match(/^\/api\/library\/([^/]+)\/([^/]+)(\/image|\/starter)?$/);
    if (lm) {
      const [, design, slide, action] = lm;
      const lib = ensureLibrary();
      const comp = lib.find(c => c.design === design && c.slide === slide);
      if (!comp) return send(res, 404, { error: 'not found', design, slide });
      if (action === '/image') {
        const r = await renderComponent(design, slide);
        if (!r || !r.pngBase64) return send(res, 500, { error: 'render failed', message: r && r.error });
        const buf = Buffer.from(r.pngBase64, 'base64');
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
        return res.end(buf);
      }
      if (action === '/starter') {
        return send(res, 200, {
          postName: `${comp.designLabel} — ${comp.slide} (from library)`,
          design: comp.design,
          ratio: comp.primaryRatio,
          slides: [{ slide: comp.slide, tokens: comp.sample }]
        });
      }
      return send(res, 200, comp);
    }
    if (p === '/api/library/feedback' && req.method === 'POST') {
      const b = await readBody(req);
      const dir = path.join(__dirname, '.feedback');
      fs.mkdirSync(dir, { recursive: true });
      const id = `${Date.now()}-${(b.design || 'unknown').replace(/[^a-z0-9-]/gi, '_')}-${(b.slide || 'unknown').replace(/[^a-z0-9-]/gi, '_')}`;
      fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify({ ...b, savedAt: new Date().toISOString() }, null, 2));
      return send(res, 200, { ok: true, id });
    }
    if (p === '/api/library/feedback' && req.method === 'GET') {
      const dir = path.join(__dirname, '.feedback');
      if (!fs.existsSync(dir)) return send(res, 200, { feedback: [] });
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse();
      const items = files.map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } }).filter(Boolean);
      return send(res, 200, { feedback: items });
    }
    // static
    let f = p === '/' ? '/index.html' : p;
    const fp = path.join(PUBLIC, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
    if (fp.startsWith(PUBLIC) && fs.existsSync(fp) && fs.statSync(fp).isFile())
      return send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp)] || 'application/octet-stream');
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 500, { error: 'server', message: e.message }); }
});

server.listen(PORT, () => console.log('social-post-builder on http://localhost:' + PORT));
