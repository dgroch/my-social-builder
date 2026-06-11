'use strict';
// Pluggable persistence for saved posts + campaigns — mirrors the email builder's
// designs.js / notionStore.js split.
//
//   disk   (default)  JSON files under DATA_DIR. Zero setup; EPHEMERAL on Render —
//                     records vanish on every deploy/restart.
//   notion            One row per record in a Notion database. Durable, and the
//                     campaign roster is browsable in Notion. Enabled when both
//                     NOTION_TOKEN and NOTION_SOCIAL_DB_ID are set.
//
// The Notion database needs these properties (see README → Notion backend):
//   Name (title) · Type (select: post|campaign) · Record ID (rich_text, lookup key)
//   Design, Ratio, Brief (rich_text) · Source (select: api|generated)
//   Posts, Approved, Changes (number) · Data (rich_text — full record JSON, chunked)
//
// Records keep their app-internal ids (post_…/camp_…) on every backend, so URLs
// survive a backend switch. All functions are async; the disk driver is sync inside.

const fs = require('fs');
const path = require('path');

const NOTION_API = () => process.env.NOTION_API_URL || 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
// rich_text items cap at 2000 chars; stay under it. 100 items per property → ~190KB ceiling.
const CHUNK = 1900;

function backend() {
  return (process.env.NOTION_TOKEN && process.env.NOTION_SOCIAL_DB_ID) ? 'notion' : 'disk';
}

// ---------- shared: the summary shape list() returns on every backend ----------
function summarize(type, rec, times) {
  times = times || {};
  if (type === 'campaign') {
    return {
      id: rec.id, name: rec.name, brief: rec.brief, source: rec.source,
      postCount: (rec.posts || []).length,
      approved: (rec.posts || []).filter(p => p.status === 'approved').length,
      changesRequested: (rec.posts || []).filter(p => p.status === 'changes_requested').length,
      createdAt: rec.createdAt || times.createdAt, updatedAt: rec.updatedAt || times.updatedAt
    };
  }
  return {
    id: rec.id, name: rec.name, design: rec.post && rec.post.design, ratio: rec.post && rec.post.ratio,
    createdAt: rec.createdAt || times.createdAt, updatedAt: rec.updatedAt || times.updatedAt,
    isExample: !!rec.isExample
  };
}

// ---------- disk driver ----------
const DATA_DIR = () => process.env.DATA_DIR || path.join(__dirname, '..', 'data');
// posts live at the DATA_DIR root (pre-store layout, kept for compatibility)
function dirFor(type) { return type === 'campaign' ? path.join(DATA_DIR(), 'campaigns') : DATA_DIR(); }
function fileFor(type, id) { return path.join(dirFor(type), id + '.json'); }

const disk = {
  async list(type) {
    const dir = dirFor(type);
    fs.mkdirSync(dir, { recursive: true });
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
      const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return summarize(type, rec);
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  },
  async get(type, id) { return JSON.parse(fs.readFileSync(fileFor(type, id), 'utf8')); },
  async create(type, rec) {
    fs.mkdirSync(dirFor(type), { recursive: true });
    fs.writeFileSync(fileFor(type, rec.id), JSON.stringify(rec, null, 2));
    return rec;
  },
  async update(type, rec) { fs.writeFileSync(fileFor(type, rec.id), JSON.stringify(rec, null, 2)); return rec; },
  async remove(type, id) { fs.unlinkSync(fileFor(type, id)); return { ok: true }; }
};

// ---------- notion driver ----------
async function napi(method, p, body) {
  const r = await fetch(NOTION_API() + p, {
    method,
    headers: {
      authorization: 'Bearer ' + process.env.NOTION_TOKEN,
      'notion-version': NOTION_VERSION,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const d = await r.json();
  if (!r.ok) {
    const err = new Error('Notion ' + r.status + (d && d.message ? ': ' + d.message : ''));
    err.status = r.status;
    throw err;
  }
  return d;
}

function rt(s, max) { return [{ type: 'text', text: { content: String(s == null ? '' : s).slice(0, max || CHUNK) } }]; }

function chunkJson(rec) {
  const s = JSON.stringify(rec);
  const chunks = [];
  for (let i = 0; i < s.length; i += CHUNK) chunks.push({ type: 'text', text: { content: s.slice(i, i + CHUNK) } });
  if (chunks.length > 100) throw new Error('Record too large for the Notion backend (' + s.length + ' chars; max ~190KB)');
  return chunks;
}

function propsFor(type, rec) {
  const s = summarize(type, rec);
  const props = {
    'Name': { title: rt(s.name || 'Untitled') },
    'Type': { select: { name: type } },
    'Record ID': { rich_text: rt(rec.id) },
    'Data': { rich_text: chunkJson(rec) }
  };
  if (type === 'campaign') {
    props['Brief'] = { rich_text: rt(s.brief || '') };
    props['Source'] = { select: { name: s.source || 'api' } };
    props['Posts'] = { number: s.postCount };
    props['Approved'] = { number: s.approved };
    props['Changes'] = { number: s.changesRequested };
  } else {
    props['Design'] = { rich_text: rt(s.design || '') };
    props['Ratio'] = { rich_text: rt(s.ratio || '') };
  }
  return props;
}

const plain = arr => (arr || []).map(x => (x.plain_text != null ? x.plain_text : (x.text && x.text.content) || '')).join('');

function summaryFromPage(type, page) {
  const P = page.properties;
  const base = {
    id: plain(P['Record ID'] && P['Record ID'].rich_text),
    name: plain(P['Name'] && P['Name'].title),
    createdAt: page.created_time, updatedAt: page.last_edited_time
  };
  if (type === 'campaign') return Object.assign(base, {
    brief: plain(P['Brief'] && P['Brief'].rich_text),
    source: P['Source'] && P['Source'].select && P['Source'].select.name,
    postCount: (P['Posts'] && P['Posts'].number) || 0,
    approved: (P['Approved'] && P['Approved'].number) || 0,
    changesRequested: (P['Changes'] && P['Changes'].number) || 0
  });
  return Object.assign(base, {
    design: plain(P['Design'] && P['Design'].rich_text),
    ratio: plain(P['Ratio'] && P['Ratio'].rich_text),
    isExample: false
  });
}

const PAGE_CACHE = new Map(); // `${type}:${id}` -> page_id

async function findPage(type, id) {
  const key = type + ':' + id;
  if (PAGE_CACHE.has(key)) {
    try { return await napi('GET', '/pages/' + PAGE_CACHE.get(key)); }
    catch { PAGE_CACHE.delete(key); }
  }
  const q = await napi('POST', '/databases/' + process.env.NOTION_SOCIAL_DB_ID + '/query', {
    filter: { and: [
      { property: 'Type', select: { equals: type } },
      { property: 'Record ID', rich_text: { equals: id } }
    ] },
    page_size: 1
  });
  const page = (q.results || [])[0];
  if (!page || page.archived) {
    const err = new Error('Unknown ' + type + ' "' + id + '"');
    err.status = 404;
    throw err;
  }
  PAGE_CACHE.set(key, page.id);
  return page;
}

// The page object truncates rich_text properties at 25 items; the property-item
// endpoint pages through the full value.
async function readData(page) {
  const propId = page.properties['Data'].id;
  let text = '', cursor;
  do {
    const r = await napi('GET', '/pages/' + page.id + '/properties/' + encodeURIComponent(propId) +
      '?page_size=100' + (cursor ? '&start_cursor=' + encodeURIComponent(cursor) : ''));
    for (const item of r.results || []) text += (item.rich_text && (item.rich_text.plain_text != null ? item.rich_text.plain_text : (item.rich_text.text && item.rich_text.text.content))) || '';
    cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return JSON.parse(text);
}

const notion = {
  async list(type) {
    const out = [];
    let cursor;
    do {
      const q = await napi('POST', '/databases/' + process.env.NOTION_SOCIAL_DB_ID + '/query', {
        filter: { property: 'Type', select: { equals: type } },
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        page_size: 100,
        start_cursor: cursor
      });
      for (const page of q.results || []) {
        const s = summaryFromPage(type, page);
        if (s.id) { PAGE_CACHE.set(type + ':' + s.id, page.id); out.push(s); }
      }
      cursor = q.has_more ? q.next_cursor : null;
    } while (cursor);
    return out;
  },
  async get(type, id) { return readData(await findPage(type, id)); },
  async create(type, rec) {
    const page = await napi('POST', '/pages', {
      parent: { database_id: process.env.NOTION_SOCIAL_DB_ID },
      properties: propsFor(type, rec)
    });
    PAGE_CACHE.set(type + ':' + rec.id, page.id);
    return rec;
  },
  async update(type, rec) {
    const page = await findPage(type, rec.id);
    await napi('PATCH', '/pages/' + page.id, { properties: propsFor(type, rec) });
    return rec;
  },
  async remove(type, id) {
    const page = await findPage(type, id);
    await napi('PATCH', '/pages/' + page.id, { archived: true });
    PAGE_CACHE.delete(type + ':' + id);
    return { ok: true };
  }
};

function driver() { return backend() === 'notion' ? notion : disk; }

module.exports = {
  backend,
  summarize,
  chunkJson,
  list: (type) => driver().list(type),
  get: (type, id) => driver().get(type, id),
  create: (type, rec) => driver().create(type, rec),
  update: (type, rec) => driver().update(type, rec),
  remove: (type, id) => driver().remove(type, id)
};
