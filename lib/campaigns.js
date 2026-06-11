'use strict';
// Campaign persistence — a campaign is an integrated suite of posts that hang together
// on the grid. Created either by an agent POSTing /api/campaigns (review journey) or by
// the in-app prompt-a-campaign flow (/api/campaigns/generate). Local-disk JSON store,
// same pattern as designs.js.

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DIR = path.join(DATA_DIR, 'campaigns');

function ensure() { fs.mkdirSync(DIR, { recursive: true }); }
function file(id) { return path.join(DIR, id + '.json'); }
function newId(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const POST_STATUSES = ['pending', 'approved', 'changes_requested'];

// Normalise an incoming posts array: each entry is a renderable post
// ({postName, design, ratio, slides}) and gets review state attached.
function wrapPosts(posts) {
  return (posts || []).map(p => ({
    id: newId('cpost'),
    status: 'pending',
    feedback: [],
    post: p
  }));
}

function list() {
  ensure();
  return fs.readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => {
    const c = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    return {
      id: c.id, name: c.name, brief: c.brief, source: c.source,
      postCount: (c.posts || []).length,
      approved: (c.posts || []).filter(p => p.status === 'approved').length,
      changesRequested: (c.posts || []).filter(p => p.status === 'changes_requested').length,
      createdAt: c.createdAt, updatedAt: c.updatedAt
    };
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

function get(id) { ensure(); return JSON.parse(fs.readFileSync(file(id), 'utf8')); }

function create(body) {
  ensure();
  const now = new Date().toISOString();
  const rec = {
    id: newId('camp'),
    name: body.name || 'Untitled campaign',
    brief: body.brief || '',
    source: body.source || 'api',      // 'api' (agent-pushed) | 'generated' (in-app prompt)
    posts: wrapPosts(body.posts),
    createdAt: now, updatedAt: now
  };
  fs.writeFileSync(file(rec.id), JSON.stringify(rec, null, 2));
  return rec;
}

function save(rec) {
  rec.updatedAt = new Date().toISOString();
  fs.writeFileSync(file(rec.id), JSON.stringify(rec, null, 2));
  return rec;
}

function update(id, body) {
  const rec = get(id);
  if (body.name != null) rec.name = body.name;
  if (body.brief != null) rec.brief = body.brief;
  if (Array.isArray(body.posts)) rec.posts = wrapPosts(body.posts);
  return save(rec);
}

function remove(id) { fs.unlinkSync(file(id)); return { ok: true }; }

// Per-post review actions. postId may also be a 0-based index for agent convenience.
function findPost(rec, postId) {
  return rec.posts.find(p => p.id === postId) || rec.posts[Number(postId)] || null;
}

function addFeedback(id, postId, text) {
  const rec = get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.feedback.push({ text: String(text), at: new Date().toISOString() });
  if (p.status === 'pending') p.status = 'changes_requested';
  return save(rec);
}

function setStatus(id, postId, status) {
  if (!POST_STATUSES.includes(status)) throw new Error('Status must be one of ' + POST_STATUSES.join('|'));
  const rec = get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.status = status;
  return save(rec);
}

// Replace one post's renderable body (e.g. after editing in the builder).
function setPost(id, postId, post) {
  const rec = get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.post = post;
  if (p.status === 'changes_requested') p.status = 'pending';
  return save(rec);
}

module.exports = { list, get, create, update, remove, addFeedback, setStatus, setPost, POST_STATUSES };
