'use strict';
// Zero-dependency HTTP server (UI + API). Puppeteer is the only runtime dep, loaded lazily
// inside render.js so the schema/validate/designs endpoints work even without Chromium.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { buildSchema } = require('./lib/parseDesigns');
const render = require('./lib/render');
const designs = require('./lib/designs');
const assets = require('./lib/assets');
const campaigns = require('./lib/campaigns');
const generate = require('./lib/generate');
const { SAMPLE_TOKENS, TRYON_SLOTS } = require('./lib/samples');

const PORT = process.env.PORT || 4321;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

// -----------------------------------------------------------------------------
// Component library — pre-render every (design, slide) pair with sample data
// so the UI can show them instantly. The cache is built on first request.
// -----------------------------------------------------------------------------


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
    // one rulebook: a required token that's missing OR empty is an error here, not just at render
    for (const t of meta.tokens) {
      if (!t.optional) {
        const v = (s.tokens || {})[t.name];
        if (v == null || String(v).trim() === '') { issues.push({ level: 'error', slide: i + 1, msg: 'Required field "' + t.name + '" is empty' }); errorCount++; }
      }
    }
    for (const t of meta.tokens) {
      if (t.type === 'image' && assets.isQueryRef((s.tokens || {})[t.name])) {
        issues.push({ level: 'warning', slide: i + 1, msg: t.name + ' = "' + s.tokens[t.name] + '" — resolves via asset-library semantic search at render time' });
        warningCount++;
      }
    }
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
    if (p === '/api/assets/search' && req.method === 'GET') {
      try { return send(res, 200, await assets.searchAssets(u.searchParams.get('q') || '', u.searchParams.get('cursor') || undefined)); }
      catch (e) { return send(res, 502, { error: 'asset-library', message: e.message }); }
    }
    if (p === '/api/validate' && req.method === 'POST') return send(res, 200, validate((await readBody(req)).post));
    if (p === '/api/export' && req.method === 'POST') { const b = await readBody(req); return send(res, 200, { json: JSON.stringify(b.post, null, 2) }); }
    if (p === '/api/render' && req.method === 'POST') {
      const b = await readBody(req);
      const v = validate(b.post);
      if (!v.ok) return send(res, 400, { error: 'validation', validation: v });
      // scale: 0.5 for fast preview thumbnails (try-on grid, campaign review), 2 for production
      const scale = Math.min(2, Math.max(0.5, Number(b.scale) || 2));
      try {
        const out = await render.renderPost(b.post, { scale });
        // Strip the raw Buffer before serialising — JSON.stringify turns it into a
        // number-per-byte array that bloats responses ~10x, blocks the server on the
        // stringify and freezes the browser tab on the parse. pngBase64 is the wire format.
        return send(res, 200, {
          scale,
          slices: out.slices.map(s => ({ index: s.index, slide: s.slide, w: s.w, h: s.h, pngBase64: s.pngBase64, unfilled: s.unfilled, overflow: s.overflow, failedAssets: s.failedAssets })),
          resolutions: out.resolutions
        });
      }
      catch (e) { return send(res, 500, { error: 'render', message: e.message }); }
    }
    // Try-on catalog — "try different templates on for size": one representative
    // photo-bearing slide per design, with sample copy and the slots a user's own
    // photo + line drop into. The client substitutes and renders each at scale 0.5.
    if (p === '/api/tryon' && req.method === 'GET') {
      const schema = buildSchema();
      const options = TRYON_SLOTS.map(([design, slide, slots]) => {
        const d = schema.designs[design];
        if (!d || !d.slides[slide]) return null;
        return {
          design, slide, slots,
          label: d.label,
          laneLabel: (schema.lanes[d.lane] && schema.lanes[d.lane].label) || d.lane,
          ratios: d.ratios,
          sample: SAMPLE_TOKENS[`${design}/${slide}`] || {}
        };
      }).filter(Boolean);
      return send(res, 200, { options });
    }

    // Campaigns — the review surface. Agents POST a suite of posts; the UI shows the
    // set on the grid with per-post approve / feedback; agents read the feedback back.
    if (p === '/api/campaigns' && req.method === 'GET') return send(res, 200, { campaigns: await campaigns.list() });
    if (p === '/api/campaigns' && req.method === 'POST') {
      const b = await readBody(req);
      if (!Array.isArray(b.posts) || !b.posts.length) return send(res, 400, { error: 'posts[] required — each entry a renderable post {postName, design, ratio, slides}' });
      const validations = b.posts.map(post => validate(post));
      const rec = await campaigns.create(b);
      return send(res, 200, { campaign: rec, validations });
    }
    if (p === '/api/campaigns/generate' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.brief || !String(b.brief).trim()) return send(res, 400, { error: 'brief required' });
      if (!generate.hasKey()) return send(res, 501, { error: 'no_api_key', message: 'Campaign generation needs ANTHROPIC_API_KEY on the server. Add it in the Render dashboard (Environment), or compose the campaign with an agent and POST it to /api/campaigns.' });
      try {
        const { campaign, model, usage } = await generate.generateCampaign(b.brief, { ratio: b.ratio });
        const validations = campaign.posts.map(post => validate(post));
        const rec = await campaigns.create({ name: b.name || campaign.name, brief: b.brief, source: 'generated', posts: campaign.posts });
        return send(res, 200, { campaign: rec, rationale: campaign.rationale, validations, model, usage });
      } catch (e) { return send(res, 502, { error: 'generate', message: e.message }); }
    }
    // Campaign post preview — a real GET image URL the browser caches. Renders the
    // FIRST slide only at 0.5 scale (a thumbnail never needs the whole carousel) and
    // is served immutable: the client versions the URL with ?v=<content hash>, so a
    // revised post gets a new URL and stale thumbnails are impossible.
    const pv = p.match(/^\/api\/campaigns\/([^/]+)\/posts\/([^/]+)\/preview\.png$/);
    if (pv && req.method === 'GET') {
      try {
        const rec = await campaigns.get(pv[1]);
        const cp = rec.posts.find(x => x.id === pv[2]) || rec.posts[Number(pv[2])];
        if (!cp) return send(res, 404, { error: 'not found' });
        const first = Object.assign({}, cp.post, { slides: cp.post.slides.slice(0, 1) });
        const out = await render.renderPost(first, { scale: 0.5 });
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' });
        return res.end(out.slices[0].png);
      } catch (e) { return send(res, e.message.startsWith('Unknown') ? 404 : 500, { error: 'preview', message: e.message }); }
    }
    const cm = p.match(/^\/api\/campaigns\/([^/]+)(?:\/posts\/([^/]+)(\/feedback|\/status|\/post|\/revise)?)?$/);
    if (cm) {
      const [, id, postId, action] = cm;
      try {
        if (!postId) {
          if (req.method === 'GET') {
            const rec = await campaigns.get(id);
            // previewV: content hash per post — versions the preview.png URL
            for (const cp of rec.posts) cp.previewV = crypto.createHash('sha256').update(JSON.stringify(cp.post)).digest('hex').slice(0, 16);
            return send(res, 200, Object.assign({ canGenerate: generate.hasKey() }, rec));
          }
          if (req.method === 'PUT') return send(res, 200, await campaigns.update(id, await readBody(req)));
          if (req.method === 'DELETE') return send(res, 200, await campaigns.remove(id));
        } else {
          const b = await readBody(req);
          if (action === '/feedback' && req.method === 'POST') return send(res, 200, await campaigns.addFeedback(id, postId, b.text));
          if (action === '/status' && req.method === 'POST') return send(res, 200, await campaigns.setStatus(id, postId, b.status));
          if (action === '/post' && req.method === 'PUT') return send(res, 200, await campaigns.setPost(id, postId, b.post));
          // Close the loop on reviewer feedback: Claude revises the post against every
          // unaddressed note, the body is swapped in, and the post returns to pending.
          if (action === '/revise' && req.method === 'POST') {
            if (!generate.hasKey()) return send(res, 501, { error: 'no_api_key', message: 'Revision needs ANTHROPIC_API_KEY on the server.' });
            // a note sent with the revise call is recorded first, so it survives even if the revision fails
            if ((b.text || '').trim()) await campaigns.addFeedback(id, postId, b.text.trim());
            const rec = await campaigns.get(id);
            const notes = campaigns.pendingFeedback(rec, postId).map(f => f.text);
            if (!notes.length) return send(res, 400, { error: 'no_feedback', message: 'No unaddressed feedback on this post.' });
            const current = (rec.posts.find(x => x.id === postId) || rec.posts[Number(postId)]).post;
            const { post: revised, usage } = await generate.revisePost(current, notes, rec.brief);
            const v = validate(revised);
            if (!v.ok) return send(res, 502, { error: 'revision_invalid', message: 'Claude returned a post that fails validation: ' + v.issues.filter(i => i.level === 'error').map(i => i.msg).join('; '), validation: v });
            const updated = await campaigns.applyRevision(id, postId, revised);
            return send(res, 200, { campaign: updated, validation: v, usage });
          }
        }
      } catch (e) { return send(res, e.message.startsWith('Unknown') ? 404 : (e.code === 'NO_API_KEY' ? 501 : 502), { error: 'campaigns', message: e.message }); }
    }

    if (p === '/api/designs' && req.method === 'GET') return send(res, 200, { designs: await designs.list() });
    if (p === '/api/designs' && req.method === 'POST') return send(res, 200, await designs.create(await readBody(req)));
    const m = p.match(/^\/api\/designs\/([^/]+)(\/clone)?$/);
    if (m) {
      const id = m[1];
      if (m[2] && req.method === 'POST') return send(res, 200, await designs.clone(id, (await readBody(req)).name));
      if (req.method === 'GET') return send(res, 200, await designs.get(id));
      if (req.method === 'PUT') return send(res, 200, await designs.update(id, await readBody(req)));
      if (req.method === 'DELETE') return send(res, 200, await designs.remove(id));
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

const store = require('./lib/store');
server.listen(PORT, () => console.log('social-post-builder on http://localhost:' + PORT + ' (store: ' + store.backend() + ')'));
