'use strict';
// Saved-post persistence on the pluggable store (lib/store.js): local-disk JSON by
// default, or a Notion database when NOTION_TOKEN + NOTION_SOCIAL_DB_ID are set —
// the same backend split as the email builder's designs.js / notionStore.js.

const store = require('./store');

function id() { return 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

async function list() { return store.list('post'); }
async function get(pid) { return store.get('post', pid); }

async function create(body) {
  const now = new Date().toISOString();
  const rec = { id: id(), name: body.name || (body.post && body.post.postName) || 'Untitled',
                post: body.post, isExample: !!body.isExample, createdAt: now, updatedAt: now };
  return store.create('post', rec);
}

async function update(pid, body) {
  const rec = await get(pid);
  if (body.name != null) rec.name = body.name;
  if (body.post != null) rec.post = body.post;
  if (body.isExample != null) rec.isExample = !!body.isExample;
  rec.updatedAt = new Date().toISOString();
  return store.update('post', rec);
}

async function clone(pid, name) {
  const src = await get(pid);
  return create({ name: name || (src.name + ' (copy)'), post: src.post, isExample: false });
}

async function remove(pid) { return store.remove('post', pid); }

module.exports = { list, get, create, update, clone, remove };
