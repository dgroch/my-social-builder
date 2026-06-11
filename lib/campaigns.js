'use strict';
// Campaign persistence — a campaign is an integrated suite of posts that hang together
// on the grid. Created either by an agent POSTing /api/campaigns (review journey) or by
// the in-app prompt-a-campaign flow (/api/campaigns/generate). Records live on the
// pluggable store (lib/store.js): local disk by default, Notion when configured.

const store = require('./store');

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

async function list() { return store.list('campaign'); }
async function get(id) { return store.get('campaign', id); }

async function create(body) {
  const now = new Date().toISOString();
  const rec = {
    id: newId('camp'),
    name: body.name || 'Untitled campaign',
    brief: body.brief || '',
    source: body.source || 'api',      // 'api' (agent-pushed) | 'generated' (in-app prompt)
    posts: wrapPosts(body.posts),
    createdAt: now, updatedAt: now
  };
  return store.create('campaign', rec);
}

async function save(rec) {
  rec.updatedAt = new Date().toISOString();
  return store.update('campaign', rec);
}

async function update(id, body) {
  const rec = await get(id);
  if (body.name != null) rec.name = body.name;
  if (body.brief != null) rec.brief = body.brief;
  if (Array.isArray(body.posts)) rec.posts = wrapPosts(body.posts);
  return save(rec);
}

async function remove(id) { return store.remove('campaign', id); }

// Per-post review actions. postId may also be a 0-based index for agent convenience.
function findPost(rec, postId) {
  return rec.posts.find(p => p.id === postId) || rec.posts[Number(postId)] || null;
}

async function addFeedback(id, postId, text) {
  const rec = await get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.feedback.push({ text: String(text), at: new Date().toISOString() });
  if (p.status === 'pending') p.status = 'changes_requested';
  return save(rec);
}

async function setStatus(id, postId, status) {
  if (!POST_STATUSES.includes(status)) throw new Error('Status must be one of ' + POST_STATUSES.join('|'));
  const rec = await get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.status = status;
  return save(rec);
}

// Replace one post's renderable body (e.g. after editing in the builder).
async function setPost(id, postId, post) {
  const rec = await get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  p.post = post;
  if (p.status === 'changes_requested') p.status = 'pending';
  return save(rec);
}

// A Claude revision landed: swap the body, mark the feedback it addressed, back to pending.
async function applyRevision(id, postId, post) {
  const rec = await get(id);
  const p = findPost(rec, postId);
  if (!p) throw new Error('Unknown post "' + postId + '" in campaign ' + id);
  const now = new Date().toISOString();
  p.post = post;
  p.status = 'pending';
  p.feedback.forEach(f => { if (!f.addressedAt) f.addressedAt = now; });
  return save(rec);
}

function pendingFeedback(rec, postId) {
  const p = findPost(rec, postId);
  return p ? p.feedback.filter(f => !f.addressedAt) : [];
}

module.exports = { list, get, create, update, remove, addFeedback, setStatus, setPost, applyRevision, pendingFeedback, POST_STATUSES };
