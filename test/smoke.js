'use strict';
// Zero-dependency guardrails (no Chromium needed): schema parses for all designs, and the
// sample posts assemble every slide with no unfilled tokens.
const assert = require('assert');
// campaigns store writes to DATA_DIR — point it at a temp dir before any require
process.env.DATA_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'sps-test-'));
const { buildSchema } = require('../lib/parseDesigns');
const { assembleSlide } = require('../lib/render');

const sampleJournal  = require('../examples/flower-card-carousel-4x5.json');
const sampleJournalCover = require('../examples/journal-cover-masthead-light-4x5.json');
const sampleStudio   = require('../examples/story-studio-9x16.json');
const samplePromo    = require('../examples/story-promo-9x16.json');
const sampleGift     = require('../examples/story-gift-9x16.json');
const sampleEditorial = require('../examples/story-editorial-9x16.json');
const sampleGoodWeekend = require('../examples/good-weekend-editorial-9x16.json');
const sampleGoodWeekend45 = require('../examples/good-weekend-editorial-4x5.json');
const sampleQuoteSoft = require('../examples/story-quote-soft-9x16.json');
const sampleTagline  = require('../examples/story-tagline-9x16.json');
const sampleOverlay  = require('../examples/story-overlay-9x16.json');

const schema = buildSchema();

// --- design + lane presence (all 8 designs × 8 lanes) ---
const designChecks = [
  ['carousel-journal',  'journal'],
  ['story-studio',      'studio'],
  ['story-promo',       'promo'],
  ['story-gift',        'gift'],
  ['story-editorial',   'editorial'],
  ['story-quote-soft',  'quote-soft'],
  ['story-tagline',     'tagline'],
  ['story-overlay',     'overlay'],
];
for (const [d, l] of designChecks) {
  assert(schema.designs[d], `${d} present`);
  assert(schema.designs[d].lane === l, `${d} lane = ${l}`);
  assert(schema.lanes[l], `${l} lane present`);
  assert(schema.lanes[l].designs.includes(d), `${l} lane lists ${d}`);
}

// --- assembly (no unfilled tokens) ---
const samples = [
  ['journal',       sampleJournal],
  ['journal-cover', sampleJournalCover],
  ['studio',        sampleStudio],
  ['promo',         samplePromo],
  ['gift',          sampleGift],
  ['editorial',     sampleEditorial],
  ['good-weekend',  sampleGoodWeekend],
  ['good-weekend-4x5', sampleGoodWeekend45],
  ['quote-soft',    sampleQuoteSoft],
  ['tagline',       sampleTagline],
  ['overlay',       sampleOverlay],
];
let checked = 0;
for (const [name, sample] of samples) {
  for (const s of sample.slides) {
    const { leftover } = assembleSlide(schema, sample.design, s.slide, s.tokens, sample.ratio);
    assert.strictEqual(leftover.length, 0, `[${name}] slide ${s.slide} has unfilled tokens: ${leftover}`);
    checked++;
  }
}

// --- v3.6.3: carousel-journal cover lockup (wordmark default; no slogan on the plate) ---
{
  assert.strictEqual(schema.version, '3.6.3', 'schema version 3.6.3');
  const cover = schema.designs['carousel-journal'].slides.cover;
  const lockup = cover.levers.find(l => l.name === 'lockup');
  assert(lockup, 'cover declares lockup lever');
  assert.deepStrictEqual(lockup.values, ['wordmark', 'full'], 'lockup = wordmark|full');
  assert.strictEqual(lockup.values[0], 'wordmark', 'wordmark is the default');
  const coverTokens = {
    kicker: 'The Journal', voice: 'chrome test',
    headline: 'Birthday flowers', cta: 'Read the guide',
    photo: 'samples/osaka_45.png', theme: 'light', layout: 'masthead'
  };
  const logoOf = html => (html.match(/class="logo"[^>]*src="[^"]+\/assets\/([^"?]+)/) || [])[1];
  const omitted = assembleSlide(schema, 'carousel-journal', 'cover', coverTokens, '4:5');
  assert.strictEqual(omitted.leftover.length, 0, `cover leftover: ${omitted.leftover}`);
  assert.strictEqual(logoOf(omitted.html), 'logo_h_black_wordmark.png',
    'omitting lockup stamps the wordmark (no FOR MOMENT MAKERS)');
  const wordmark = assembleSlide(schema, 'carousel-journal', 'cover',
    Object.assign({}, coverTokens, { lockup: 'wordmark' }), '4:5');
  assert.strictEqual(logoOf(wordmark.html), 'logo_h_black_wordmark.png', 'lockup=wordmark uses wordmark file');
  const full = assembleSlide(schema, 'carousel-journal', 'cover',
    Object.assign({}, coverTokens, { lockup: 'full' }), '4:5');
  assert.strictEqual(logoOf(full.html), 'logo_h_black.png', 'lockup=full keeps the historical lockup');
  const fs = require('fs');
  const path = require('path');
  const assets = path.join(__dirname, '..', 'design-system', 'assets');
  assert(fs.existsSync(path.join(assets, 'logo_h_black_wordmark.png')), 'black wordmark asset');
  assert(fs.existsSync(path.join(assets, 'logo_h_white_wordmark.png')), 'white wordmark asset');
}

// --- v3 seed lanes present ---
const v3Checks = [
  ['card-caption',        'caption'],
  ['card-statement-bars', 'statement'],
  ['card-statement-split','statement'],
  ['card-testimonial',    'testimonial'],
  ['card-quote-lineart',  'quote-lineart'],
  ['card-script-moment',  'script-moment'],
  ['card-note',           'note'],
];
for (const [d, l] of v3Checks) {
  assert(schema.designs[d], `${d} present`);
  assert(schema.designs[d].lane === l, `${d} lane = ${l}`);
  assert(schema.lanes[l].designs.includes(d), `${l} lane lists ${d}`);
  assert(schema.designs[d].ratios.includes('1.91:1'), `${d} supports 1.91:1`);
}
assert(schema.ratios['1.91:1'] && schema.ratios['1.91:1'].w === 1200, '1.91:1 ratio registered');

// --- v3.2: story lanes are multi-ratio; the editorial Good Weekend set is complete ---
for (const d of ['story-studio','story-promo','story-gift','story-editorial','story-quote-soft','story-tagline','story-overlay']) {
  assert(schema.designs[d].ratios.includes('1.91:1'), `${d} supports 1.91:1`);
}
for (const s of ['cover','feature','pullquote','column','press','linkout']) {
  assert(schema.designs['story-editorial'].slides[s], `story-editorial has ${s}`);
}
assert.strictEqual(schema.designs['story-editorial'].slides.linkout.photo, 'none', 'linkout is photo-free');
// levers default to their first value — assembling without them leaves nothing unfilled
{
  const { leftover } = assembleSlide(schema, 'story-editorial', 'column',
    { text: 'x', attribution: '', photo: 'samples/osaka_45.png' }, '9:16');
  assert.strictEqual(leftover.length, 0, `lever defaults applied: ${leftover}`);
}

// --- generic: EVERY design/slide assembles at EVERY declared ratio with synthesized tokens ---
let generic = 0;
for (const [id, d] of Object.entries(schema.designs)) {
  for (const [slideId, meta] of Object.entries(d.slides)) {
    const tokens = {};
    for (const t of meta.tokens) tokens[t.name] = t.type === 'image' ? 'samples/osaka_45.png' : 'x';
    for (const l of meta.levers) tokens[l.name] = l.values[0];
    for (const ratio of d.ratios) {
      const { leftover } = assembleSlide(schema, id, slideId, tokens, ratio);
      assert.strictEqual(leftover.length, 0, `[generic] ${id}/${slideId}@${ratio} unfilled: ${leftover}`);
      generic++;
    }
  }
}

// --- try-on catalog stays in lockstep with the schema ---
const { TRYON_SLOTS, SAMPLE_TOKENS } = require('../lib/samples');
for (const [design, slide, slots] of TRYON_SLOTS) {
  const d = schema.designs[design];
  assert(d, `tryon: ${design} exists`);
  const meta = d.slides[slide];
  assert(meta, `tryon: ${design}/${slide} exists`);
  const names = new Set([...meta.tokens.map(t => t.name), ...meta.levers.map(l => l.name)]);
  assert(names.has(slots.photo), `tryon: ${design}/${slide} declares photo token "${slots.photo}"`);
  assert(names.has(slots.main), `tryon: ${design}/${slide} declares main token "${slots.main}"`);
  for (const k of Object.keys(slots.apply || {})) assert(names.has(k), `tryon: ${design}/${slide} declares apply token "${k}"`);
  assert(SAMPLE_TOKENS[`${design}/${slide}`], `tryon: ${design}/${slide} has sample copy`);
}
// every library component has sample copy (raw {{placeholders}} in thumbnails otherwise),
// and every sample fills its slide's required tokens (the one validation rulebook)
for (const [id, d] of Object.entries(schema.designs)) {
  for (const [slideId, meta] of Object.entries(d.slides)) {
    const sample = SAMPLE_TOKENS[`${id}/${slideId}`];
    assert(sample, `library: ${id}/${slideId} has sample copy`);
    for (const t of meta.tokens) {
      if (!t.optional) assert(sample[t.name] != null && String(sample[t.name]).trim() !== '',
        `library: ${id}/${slideId} sample fills required "${t.name}"`);
    }
  }
}

// --- campaigns store (async; temp DATA_DIR disk backend) ---
const campaigns = require('../lib/campaigns');
async function campaignTests() {
  const rec = await campaigns.create({ name: 'Test', brief: 'b', posts: [sampleEditorial, sampleGoodWeekend] });
  assert.strictEqual(rec.posts.length, 2, 'campaign wraps posts');
  assert.strictEqual(rec.posts[0].status, 'pending', 'posts start pending');
  await campaigns.addFeedback(rec.id, rec.posts[0].id, 'tighter kicker');
  await campaigns.setStatus(rec.id, rec.posts[1].id, 'approved');
  const back = await campaigns.get(rec.id);
  assert.strictEqual(back.posts[0].status, 'changes_requested', 'feedback flips status');
  assert.strictEqual(back.posts[0].feedback.length, 1, 'feedback recorded');
  assert.strictEqual(back.posts[1].status, 'approved', 'status set');
  assert.strictEqual((await campaigns.list())[0].approved, 1, 'list aggregates');
  await campaigns.setPost(rec.id, back.posts[0].id, sampleEditorial);
  assert.strictEqual((await campaigns.get(rec.id)).posts[0].status, 'pending', 'edited post resets to pending');
  // revision flow: feedback → applyRevision marks it addressed, post back to pending
  await campaigns.addFeedback(rec.id, back.posts[0].id, 'make the plate moodier');
  assert.strictEqual(campaigns.pendingFeedback(await campaigns.get(rec.id), back.posts[0].id).length, 2, 'pending feedback counted');
  await campaigns.applyRevision(rec.id, back.posts[0].id, sampleGoodWeekend);
  const revised = await campaigns.get(rec.id);
  assert.strictEqual(revised.posts[0].status, 'pending', 'revision resets to pending');
  assert(revised.posts[0].feedback.every(f => f.addressedAt), 'revision marks feedback addressed');
  assert.strictEqual(campaigns.pendingFeedback(revised, back.posts[0].id).length, 0, 'no pending after revision');
  // append a post (the editor's "Add to campaign…" flow)
  const grown = await campaigns.addPost(rec.id, sampleEditorial);
  assert.strictEqual(grown.posts.length, 3, 'addPost appends');
  assert.strictEqual(grown.posts[2].status, 'pending', 'appended post starts pending');
  await campaigns.remove(rec.id);
  assert.strictEqual((await campaigns.list()).length, 0, 'campaign removed');
}

// --- Notion driver against an in-memory fake of the Notion API ---
// Covers the full round-trip: create page → query by Record ID → property-item
// pagination for chunked Data → update → archive. No token, no network.
async function notionDriverTests() {
  const http = require('http');
  const pages = new Map(); // page_id -> {archived, properties}
  const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const b = body ? JSON.parse(body) : {};
      const out = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
      const u = req.url;
      if (req.method === 'POST' && u === '/pages') {
        const id = 'pg_' + (pages.size + 1);
        pages.set(id, { archived: false, properties: b.properties });
        return out(200, { id });
      }
      let m = u.match(/^\/pages\/([^/]+)\/properties\/(.+?)(\?|$)/);
      if (req.method === 'GET' && m) {
        const page = pages.get(m[1]);
        const items = (page.properties['Data'].rich_text || []).map(t => ({ type: 'rich_text', rich_text: { plain_text: t.text.content } }));
        // exercise pagination: serve max 2 items per call
        const cursor = Number((u.match(/start_cursor=(\d+)/) || [])[1] || 0);
        const slice = items.slice(cursor, cursor + 2);
        return out(200, { results: slice, has_more: cursor + 2 < items.length, next_cursor: String(cursor + 2) });
      }
      m = u.match(/^\/pages\/([^/]+)$/);
      if (m && req.method === 'GET') {
        const page = pages.get(m[1]);
        if (!page) return out(404, { message: 'not found' });
        const props = JSON.parse(JSON.stringify(page.properties));
        props['Data'].id = 'DataPropId';
        // real Notion truncates rich_text properties to 25 items on the page object
        if (props['Data'].rich_text && props['Data'].rich_text.length > 25) props['Data'].rich_text = props['Data'].rich_text.slice(0, 25);
        return out(200, { id: m[1], archived: page.archived, properties: props, created_time: 'c', last_edited_time: 'u' });
      }
      if (m && req.method === 'PATCH') {
        const page = pages.get(m[1]);
        if (b.archived != null) page.archived = b.archived;
        if (b.properties) page.properties = b.properties;
        return out(200, { id: m[1] });
      }
      if (req.method === 'POST' && /^\/databases\/.+\/query$/.test(u)) {
        const conds = b.filter.and || [b.filter];
        const results = [];
        for (const [id, page] of pages) {
          if (page.archived) continue;
          const ok = conds.every(c =>
            (c.select && page.properties['Type'].select.name === c.select.equals) ||
            (c.rich_text && page.properties['Record ID'].rich_text[0].text.content === c.rich_text.equals));
          if (ok) {
            const props = JSON.parse(JSON.stringify(page.properties));
            props['Data'].id = 'DataPropId';
            results.push({ id, archived: false, properties: props, created_time: 'c', last_edited_time: 'u' });
          }
        }
        return out(200, { results: b.page_size === 1 ? results.slice(0, 1) : results, has_more: false });
      }
      out(404, { message: 'unhandled ' + req.method + ' ' + u });
    });
  });
  await new Promise(r => fake.listen(0, r));
  process.env.NOTION_API_URL = 'http://localhost:' + fake.address().port;
  process.env.NOTION_TOKEN = 'test-token';
  process.env.NOTION_SOCIAL_DB_ID = 'db_test';
  try {
    const store = require('../lib/store');
    assert.strictEqual(store.backend(), 'notion', 'notion backend selected with env set');
    // big enough record to span multiple Data chunks (and paginated reads)
    const rec = { id: 'camp_n1', name: 'Notion test', brief: 'b', source: 'generated',
      posts: [{ id: 'cpost_1', status: 'approved', feedback: [], post: { postName: 'x'.repeat(4500), design: 'card-note', ratio: '1:1', slides: [] } }],
      createdAt: 'c', updatedAt: 'u' };
    await store.create('campaign', rec);
    const back = await store.get('campaign', 'camp_n1');
    assert.deepStrictEqual(back, rec, 'notion round-trips a chunked record');
    const summaries = await store.list('campaign');
    assert.strictEqual(summaries.length, 1, 'notion list');
    assert.strictEqual(summaries[0].approved, 1, 'notion list aggregates from properties');
    rec.name = 'Renamed';
    await store.update('campaign', rec);
    assert.strictEqual((await store.get('campaign', 'camp_n1')).name, 'Renamed', 'notion update');
    // >25-chunk record (~57KB) — exercises the property-item pagination fallback
    const big = { id: 'camp_n2', name: 'Big', brief: '', source: 'api',
      posts: [{ id: 'cpost_b', status: 'pending', feedback: [], post: { postName: 'b'.repeat(55000), design: 'card-note', ratio: '1:1', slides: [] } }],
      createdAt: 'c', updatedAt: 'u' };
    await store.create('campaign', big);
    assert.strictEqual((await store.get('campaign', 'camp_n2')).posts[0].post.postName.length, 55000, 'notion round-trips a >25-chunk record via property items');
    await store.remove('campaign', 'camp_n2');
    await store.remove('campaign', 'camp_n1');
    assert.strictEqual((await store.list('campaign')).length, 0, 'notion archive removes from list');
    await assert.rejects(() => store.get('campaign', 'camp_n1'), /Unknown campaign/, 'archived record 404s');
    assert.throws(() => store.chunkJson({ big: 'y'.repeat(200000) }), /too large/, 'oversize record rejected');
  } finally {
    delete process.env.NOTION_TOKEN;
    delete process.env.NOTION_SOCIAL_DB_ID;
    delete process.env.NOTION_API_URL;
    fake.close();
  }
}

// --- campaign generator (pure parts; no network) ---
const generate = require('../lib/generate');
{
  const digest = generate.schemaDigest();
  for (const id of Object.keys(schema.designs)) assert(digest.includes(id), `digest lists ${id}`);
  const folded = generate.foldTokenPairs({
    name: 'X', posts: [{ postName: 'p', design: 'story-editorial', ratio: '9:16',
      slides: [{ slide: 'cover', tokens: [{ name: 'kicker', value: 'K' }, { name: 'photo', value: 'query: moody plate' }] }] }]
  });
  assert.strictEqual(folded.posts[0].slides[0].tokens.kicker, 'K', 'token pairs fold to object');
  assert(generate.OUTPUT_SCHEMA.properties.posts, 'output schema shape');
  if (!process.env.ANTHROPIC_API_KEY) assert(!generate.hasKey(), 'hasKey false without env');
}

// --- asset-library helpers (pure parts; no network) ---
const assets = require('../lib/assets');
assert(assets.isQueryRef('query: moody bouquet'), 'isQueryRef positive');
assert(assets.isQueryRef('  QUERY:  caps and space  '), 'isQueryRef lenient');
assert(!assets.isQueryRef('https://example.com/a.jpg'), 'isQueryRef negative URL');
assert(!assets.isQueryRef('samples/osaka_45.png'), 'isQueryRef negative sample');
assert.strictEqual(assets.queryText('query: moody bouquet '), 'moody bouquet', 'queryText trims');

(async () => {
  await campaignTests();
  await notionDriverTests();
  console.log(`OK — schema valid, ${checked} sample slides + ${generic} generic design/slide/ratio assemblies, campaign store (disk + notion fake), asset helpers pass.`);
})().catch(e => { console.error(e); process.exit(1); });
