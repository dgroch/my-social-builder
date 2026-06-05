'use strict';
// Saved-post persistence. Local-disk JSON store (fallback). A Notion-backed store can be
// added later with the same interface (mirrors the email builder's designs.js / notionStore.js).

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

function ensure() { fs.mkdirSync(DATA_DIR, { recursive: true }); }
function file(id) { return path.join(DATA_DIR, id + '.json'); }
function id() { return 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function list() {
  ensure();
  return fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => {
    const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    return { id: d.id, name: d.name, design: d.post && d.post.design, ratio: d.post && d.post.ratio,
             createdAt: d.createdAt, updatedAt: d.updatedAt, isExample: !!d.isExample };
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
function get(pid) { ensure(); return JSON.parse(fs.readFileSync(file(pid), 'utf8')); }
function create(body) {
  ensure();
  const now = new Date().toISOString();
  const rec = { id: id(), name: body.name || (body.post && body.post.postName) || 'Untitled',
                post: body.post, isExample: !!body.isExample, createdAt: now, updatedAt: now };
  fs.writeFileSync(file(rec.id), JSON.stringify(rec, null, 2));
  return rec;
}
function update(pid, body) {
  const rec = get(pid);
  if (body.name != null) rec.name = body.name;
  if (body.post != null) rec.post = body.post;
  if (body.isExample != null) rec.isExample = !!body.isExample;
  rec.updatedAt = new Date().toISOString();
  fs.writeFileSync(file(pid), JSON.stringify(rec, null, 2));
  return rec;
}
function clone(pid, name) {
  const src = get(pid);
  return create({ name: name || (src.name + ' (copy)'), post: src.post, isExample: false });
}
function remove(pid) { fs.unlinkSync(file(pid)); return { ok: true }; }

module.exports = { list, get, create, update, clone, remove };
