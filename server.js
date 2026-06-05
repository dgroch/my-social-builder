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
    // static
    let f = p === '/' ? '/index.html' : p;
    const fp = path.join(PUBLIC, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
    if (fp.startsWith(PUBLIC) && fs.existsSync(fp) && fs.statSync(fp).isFile())
      return send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp)] || 'application/octet-stream');
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 500, { error: 'server', message: e.message }); }
});

server.listen(PORT, () => console.log('social-post-builder on http://localhost:' + PORT));
