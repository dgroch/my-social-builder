'use strict';
// Semantic image sourcing for photo tokens, backed by the Fig & Bloom Asset Library
// (https://asset-library-u70t.onrender.com — override with ASSET_LIBRARY_URL).
//
// A photo token value may be:
//   - an http(s):// or file:// URL          → used as-is
//   - "samples/…"                            → bundled sample plate
//   - "query: <natural language>"           → resolved here, at render time, against
//     the asset library's semantic search. The top image hit wins.
//
// If a query matches nothing, the render fails with guidance: generate a plate with
// the brand-photographer skill, upload it to the asset library, then re-render.

const ASSET_LIBRARY_URL = process.env.ASSET_LIBRARY_URL || 'https://asset-library-u70t.onrender.com';

function isQueryRef(v) {
  return typeof v === 'string' && /^query\s*:/i.test(v.trim());
}

function queryText(v) {
  return String(v).trim().replace(/^query\s*:/i, '').trim();
}

// GET /api/search on the asset library. Returns { results: [Asset], nextCursor? }.
// Asset = { id, title, url, description, mediaType, driveLink }.
async function searchAssets(q, cursor) {
  const u = new URL('/api/search', ASSET_LIBRARY_URL);
  if (q) u.searchParams.set('q', q);
  if (cursor) u.searchParams.set('cursor', cursor);
  const res = await fetch(u, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error('Asset library returned HTTP ' + res.status);
  return res.json();
}

// Resolve one natural-language query to the best image asset.
async function resolveQuery(q) {
  const { results } = await searchAssets(q);
  const hit = (results || []).find(a => a.mediaType === 'image' && a.url);
  if (!hit) {
    const err = new Error(
      'No asset in the library matched "' + q + '". ' +
      'Generate an on-brand plate with the brand-photographer skill, upload it to the asset library, then re-render.'
    );
    err.code = 'NO_ASSET';
    throw err;
  }
  return hit;
}

// Walk a post and replace every "query: …" image token with the top asset URL.
// Returns { post, resolutions } — post is a deep copy when anything resolved;
// resolutions records what was chosen so callers can surface it.
async function resolvePostPhotos(post, schema) {
  const d = schema.designs[post.design];
  if (!d) return { post, resolutions: [] };
  const resolutions = [];
  const slides = [];
  for (const s of post.slides || []) {
    const meta = d.slides[s.slide];
    const tokens = Object.assign({}, s.tokens);
    if (meta) {
      for (const t of meta.tokens) {
        if (t.type === 'image' && isQueryRef(tokens[t.name])) {
          const q = queryText(tokens[t.name]);
          const asset = await resolveQuery(q);
          tokens[t.name] = asset.url;
          resolutions.push({ slide: s.slide, token: t.name, query: q, assetId: asset.id, title: asset.title, url: asset.url });
        }
      }
    }
    slides.push(Object.assign({}, s, { tokens }));
  }
  if (!resolutions.length) return { post, resolutions };
  return { post: Object.assign({}, post, { slides }), resolutions };
}

module.exports = { ASSET_LIBRARY_URL, isQueryRef, queryText, searchAssets, resolveQuery, resolvePostPhotos };
