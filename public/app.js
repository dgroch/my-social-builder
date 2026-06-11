'use strict';
let SCHEMA = null, STATE = { design: null, ratio: null, slides: [] }, LAST = null;
let CAMPAIGN_REF = null; // {campId, postId} when a post was opened from a campaign

const $ = s => document.querySelector(s);
const el = (t, a = {}, kids = []) => { const e = document.createElement(t); for (const k in a) { if (k === 'class') e.className = a[k]; else if (k === 'html') e.innerHTML = a[k]; else e.setAttribute(k, a[k]); } (Array.isArray(kids) ? kids : [kids]).forEach(c => c && e.append(c)); return e; };

// ---------- Views (the three journeys) ----------
const VIEW_INIT = { create: false, campaigns: false };
function showView(name) {
  document.querySelectorAll('.viewtab').forEach(t => t.classList.toggle('on', t.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'view-' + name));
  $('#editorActions').style.display = name === 'editor' ? 'flex' : 'none';
  if (name === 'create' && !VIEW_INIT.create) { VIEW_INIT.create = true; initCreate(); }
  if (name === 'campaigns') { if (!VIEW_INIT.campaigns) { VIEW_INIT.campaigns = true; wireCampaigns(); } loadCampaigns(); }
}

async function boot() {
  SCHEMA = await (await fetch('/api/schema')).json();
  const ds = $('#design'); ds.innerHTML = '';
  Object.values(SCHEMA.designs).forEach(d => ds.append(el('option', { value: d.id }, d.label)));
  ds.onchange = () => selectDesign(ds.value);
  $('#ratio').onchange = e => { STATE.ratio = e.target.value; sync(); };
  selectDesign(ds.value);
  wire(); loadDesigns();
  document.querySelectorAll('.viewtab').forEach(t => t.onclick = () => showView(t.dataset.view));
  showView('create');
}

function selectDesign(id) {
  const d = SCHEMA.designs[id];
  STATE.design = id; STATE.ratio = d.primaryRatio;
  const rs = $('#ratio'); rs.innerHTML = '';
  d.ratios.forEach(r => rs.append(el('option', { value: r }, `${r} · ${SCHEMA.ratios[r].label}`)));
  rs.value = d.primaryRatio;
  $('#laneNote').textContent = `Lane: ${SCHEMA.lanes[d.lane].label} — ${SCHEMA.lanes[d.lane].intent}`;
  STATE.slides = d.recommendedSequence.map(slide => ({ slide, tokens: defaultsFor(d, slide) }));
  const as = $('#addSlideSel'); as.innerHTML = '';
  Object.keys(d.slides).forEach(s => as.append(el('option', { value: s }, s)));
  renderForm();
}

function defaultsFor(d, slide) {
  const t = {}; d.slides[slide].tokens.forEach(tok => t[tok.name] = '');
  d.slides[slide].levers.forEach(l => t[l.name] = l.values[0]);
  if (slide === 'cover') t.kicker = 'The Journal';
  return t;
}

function renderForm() {
  const d = SCHEMA.designs[STATE.design];
  const wrap = $('#slides'); wrap.innerHTML = '';
  STATE.slides.forEach((s, i) => {
    const meta = d.slides[s.slide];
    const card = el('div', { class: 'card' });
    const title = el('h3', {}, [document.createTextNode(`${i + 1}. ${s.slide}`)]);
    if (STATE.slides.length > 1) title.append(el('button', { class: 'del' }, '✕ remove'));
    card.append(title);
    meta.levers.forEach(l => {
      const sel = el('select'); l.values.forEach(v => sel.append(el('option', { value: v }, v)));
      sel.value = s.tokens[l.name]; sel.onchange = () => { s.tokens[l.name] = sel.value; sync(); };
      card.append(el('div', { class: 'field' }, [el('label', {}, l.name), sel, el('div', { class: 'help' }, l.help)]));
    });
    meta.tokens.forEach(tok => {
      const long = tok.markdown || /quote|headline|end_line/.test(tok.name);
      const inp = el(long ? 'textarea' : 'input'); inp.value = s.tokens[tok.name] || '';
      inp.oninput = () => { s.tokens[tok.name] = inp.value; sync(); };
      const help = tok.help + (tok.markdown ? '  ·  *word* = italic accent' : '') + (tok.type === 'image' ? '  ·  URL, samples/…, or "query: cosy autumn bouquet" (resolved at render)' : '');
      const field = el('div', { class: 'field' }, [el('label', {}, tok.name), inp, el('div', { class: 'help' }, help)]);
      if (tok.type === 'image') field.append(assetPicker(inp, () => { s.tokens[tok.name] = inp.value; sync(); }));
      card.append(field);
    });
    const del = title.querySelector('.del');
    if (del) del.onclick = () => { STATE.slides.splice(i, 1); renderForm(); };
    wrap.append(card);
  });
  sync();
}

// ---------- Asset library picker ----------
// A "Search assets" row under every image token: semantic search against the
// Fig & Bloom asset library; clicking a thumbnail fills the token with the CDN URL.
function assetPicker(inp, onPick) {
  const box = el('div', { class: 'asset-picker' });
  const q = el('input', { placeholder: 'Describe the shot — e.g. moody bouquet on dark wood' });
  const btn = el('button', { type: 'button' }, 'Search assets');
  const grid = el('div', { class: 'asset-grid' });
  const run = async () => {
    const query = q.value.trim() || (inp.value.startsWith('query:') ? inp.value.slice(6).trim() : '');
    if (!query) { grid.textContent = 'Type a description first.'; return; }
    grid.textContent = 'Searching…';
    try {
      const r = await fetch('/api/assets/search?q=' + encodeURIComponent(query));
      if (!r.ok) { const e = await r.json().catch(() => ({})); grid.textContent = 'Asset library error: ' + (e.message || r.status); return; }
      const { results } = await r.json();
      const imgs = (results || []).filter(a => a.mediaType === 'image' && a.url).slice(0, 12);
      grid.innerHTML = '';
      if (!imgs.length) { grid.textContent = 'No matches. Generate one with the brand-photographer skill, upload it to the asset library, then search again.'; return; }
      imgs.forEach(a => {
        const t = el('img', { src: a.url, title: a.title + ' — ' + a.description, loading: 'lazy' });
        t.onclick = () => { inp.value = a.url; onPick(); grid.querySelectorAll('img').forEach(i => i.classList.remove('picked')); t.classList.add('picked'); };
        grid.append(t);
      });
    } catch (e) { grid.textContent = 'Search failed: ' + e.message; }
  };
  btn.onclick = run;
  q.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); run(); } };
  box.append(el('div', { class: 'asset-row' }, [q, btn]), grid);
  return box;
}

function post() { return { postName: 'Untitled', design: STATE.design, ratio: STATE.ratio, slides: STATE.slides }; }
function sync() { $('#panel-json').textContent = JSON.stringify(post(), null, 2); }

async function validate() {
  const v = await (await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() }) })).json();
  const box = $('#validation'); box.innerHTML = '';
  if (v.ok && !v.warningCount) box.append(el('div', { class: 'ok' }, '✓ Valid — ready to render.'));
  v.issues.forEach(it => box.append(el('div', { class: it.level === 'error' ? 'err' : 'warn' }, (it.slide ? `Slide ${it.slide}: ` : '') + it.msg)));
  return v.ok;
}

async function renderSet() {
  showTab('preview');
  $('#results').innerHTML = '<p class="muted">Rendering…</p>';
  const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() }) });
  if (!r.ok) { const e = await r.json(); $('#results').innerHTML = ''; await validate(); return; }
  LAST = await r.json();
  const out = $('#results'); out.innerHTML = '';
  LAST.slices.forEach(s => {
    const fig = el('figure');
    fig.append(el('img', { src: 'data:image/png;base64,' + s.pngBase64 }));
    const a = el('a', { download: `${String(s.index).padStart(2, '0')}-${s.slide}.png`, href: 'data:image/png;base64,' + s.pngBase64 }, 'download');
    fig.append(el('figcaption', {}, [document.createTextNode(`${s.slide} · ${s.w}×${s.h}`), a]));
    out.append(fig);
  });
  $('#btnZip').style.display = 'block';
}

async function zipAll() {
  if (!LAST) return;
  const zip = new JSZip();
  LAST.slices.forEach(s => zip.file(`${String(s.index).padStart(2, '0')}-${s.slide}.png`, s.pngBase64, { base64: true }));
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = el('a', { href: URL.createObjectURL(blob), download: (post().postName || 'post').replace(/\W+/g, '-') + '-' + STATE.ratio.replace(':', 'x') + '.zip' });
  document.body.append(a); a.click(); a.remove();
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
  ['preview', 'json', 'designs', 'library', 'feedback'].forEach(n => $('#panel-' + n).classList.toggle('on', n === name));
  if (name === 'library' && !LIB_STATE.loaded) loadLibrary();
  if (name === 'feedback') loadFeedback();
}

// ---------- Component library ----------
let LIB_STATE = { loaded: false, components: [], laneFilter: '', ratioFilter: '' };

async function loadLibrary() {
  const box = $('#libraryGrid');
  box.className = 'muted';
  box.textContent = 'Loading the component library (one-time render of every slide)…';
  try {
    const res = await fetch('/api/library');
    if (!res.ok) { box.textContent = 'Library failed to load: HTTP ' + res.status; return; }
    const data = await res.json();
    LIB_STATE.loaded = true;
    LIB_STATE.components = data.components;
    renderLibrary();
  } catch (e) {
    box.textContent = 'Library failed: ' + e.message;
  }
}

function renderLibrary() {
  const box = $('#libraryGrid');
  box.className = 'library-grid';
  box.innerHTML = '';

  // Toolbar
  const toolbar = el('div', { class: 'library-toolbar' });
  toolbar.append(el('span', { class: 'pill' }, `${LIB_STATE.components.length} components`));
  const lanes = [...new Set(LIB_STATE.components.map(c => c.laneLabel))].sort();
  const laneSel = el('select');
  laneSel.append(el('option', { value: '' }, 'All lanes'));
  lanes.forEach(l => laneSel.append(el('option', { value: l }, l)));
  laneSel.value = LIB_STATE.laneFilter;
  laneSel.onchange = () => { LIB_STATE.laneFilter = laneSel.value; renderLibrary(); };
  toolbar.append(laneSel);
  const ratios = [...new Set(LIB_STATE.components.map(c => c.primaryRatio))].sort();
  const ratioSel = el('select');
  ratioSel.append(el('option', { value: '' }, 'All ratios'));
  ratios.forEach(r => ratioSel.append(el('option', { value: r }, r)));
  ratioSel.value = LIB_STATE.ratioFilter;
  ratioSel.onchange = () => { LIB_STATE.ratioFilter = ratioSel.value; renderLibrary(); };
  toolbar.append(ratioSel);
  box.append(toolbar);

  // Filter
  const filtered = LIB_STATE.components.filter(c =>
    (!LIB_STATE.laneFilter || c.laneLabel === LIB_STATE.laneFilter) &&
    (!LIB_STATE.ratioFilter || c.primaryRatio === LIB_STATE.ratioFilter)
  );

  filtered.forEach(c => {
    const card = el('div', { class: 'lib-card' });
    const img = el('img', { class: 'thumb', src: `/api/library/${c.design}/${c.slide}/image`, alt: `${c.design}/${c.slide}`, loading: 'lazy' });
    img.onload = () => { card.querySelector('.sub').textContent = `${c.slide} · ${c.laneLabel} · ${c.primaryRatio}`; };
    img.onerror = () => {
      card.querySelector('.thumb').style.background = '#3a1f1f';
      const err = el('div', { class: 'sub', style: 'color:#d77' }, `${c.slide} · render failed`);
      card.querySelector('.sub').replaceWith(err);
    };
    img.onclick = () => openLightbox(`/api/library/${c.design}/${c.slide}/image`, `${c.designLabel} — ${c.slide}`);
    card.append(img);
    const meta = el('div', { class: 'meta' });
    meta.append(el('div', { class: 'name' }, c.designLabel));
    const sub = el('div', { class: 'sub' }, `${c.slide} · ${c.laneLabel} · ${c.primaryRatio} · rendering…`);
    meta.append(sub);
    const actions = el('div', { class: 'actions' });
    const useBtn = el('button', {}, 'Use as starter');
    useBtn.onclick = async () => {
      const r = await fetch(`/api/library/${c.design}/${c.slide}/starter`);
      const post = await r.json();
      load(post);
    };
    const jsonBtn = el('button', {}, 'post.json');
    jsonBtn.onclick = () => showTab('json') || ($('#panel-json').textContent = JSON.stringify({ postName: `${c.design}/${c.slide}`, design: c.design, ratio: c.primaryRatio, slides: [{ slide: c.slide, tokens: c.sample }] }, null, 2));
    actions.append(useBtn, jsonBtn);
    meta.append(actions);
    const ta = el('textarea', { placeholder: 'Feedback for this component…' });
    meta.append(ta);
    const saveBtn = el('button', { class: 'savebtn' }, 'Save feedback');
    saveBtn.onclick = async () => {
      const text = ta.value.trim();
      if (!text) return;
      saveBtn.disabled = true;
      try {
        await fetch('/api/library/feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ design: c.design, slide: c.slide, ratio: c.primaryRatio, text })
        });
        saveBtn.textContent = '✓ saved';
        setTimeout(() => { saveBtn.textContent = 'Save feedback'; saveBtn.disabled = false; }, 1200);
      } catch (e) {
        saveBtn.textContent = 'failed';
        saveBtn.disabled = false;
      }
    };
    meta.append(saveBtn);
    card.append(meta);
    box.append(card);
  });
}

function openLightbox(src, caption) {
  const modal = el('div', { class: 'lib-modal' });
  modal.append(el('img', { src, alt: caption }));
  const close = el('button', { class: 'x' }, '✕ close');
  close.onclick = () => modal.remove();
  modal.append(close);
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  document.body.append(modal);
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } });
}

async function loadFeedback() {
  const box = $('#feedbackList');
  box.className = 'muted';
  box.textContent = 'Loading feedback…';
  try {
    const res = await fetch('/api/library/feedback');
    const data = await res.json();
    if (!data.feedback || !data.feedback.length) { box.textContent = 'No feedback submitted yet. Click any component in the Library tab, type a note, and hit "Save feedback".'; box.className = 'muted'; return; }
    box.className = '';
    box.innerHTML = '';
    data.feedback.forEach(f => {
      const item = el('div', { class: 'feedback-item' });
      const head = el('div', { class: 'head' });
      head.append(el('span', {}, `${f.design || '?'} / ${f.slide || '?'} · ${f.ratio || ''}`));
      head.append(el('span', {}, f.savedAt || ''));
      item.append(head);
      item.append(el('div', { class: 'body' }, f.text || ''));
      box.append(item);
    });
  } catch (e) { box.textContent = 'Failed to load feedback: ' + e.message; }
}

async function loadDesigns() {
  const { designs } = await (await fetch('/api/designs')).json();
  const box = $('#designList'); box.className = 'designList';
  if (!designs.length) { box.className = 'muted'; box.textContent = 'No saved posts yet.'; return; }
  box.innerHTML = '';
  designs.forEach(d => {
    const item = el('div', { class: 'item' });
    item.append(el('div', {}, `${d.name}  ·  ${d.design || ''} ${d.ratio || ''}`));
    const open = el('a', {}, 'open'); open.onclick = async () => { const full = await (await fetch('/api/designs/' + d.id)).json(); load(full.post); };
    const del = el('a', { style: 'color:#b54' }, 'delete'); del.onclick = async () => { await fetch('/api/designs/' + d.id, { method: 'DELETE' }); loadDesigns(); };
    item.append(el('div', { style: 'display:flex;gap:12px' }, [open, del]));
    box.append(item);
  });
}

function load(p, campaignRef) {
  CAMPAIGN_REF = campaignRef || null;
  $('#btnSaveCampaign').style.display = CAMPAIGN_REF ? '' : 'none';
  $('#design').value = p.design; selectDesign(p.design);
  STATE.ratio = p.ratio; $('#ratio').value = p.ratio;
  STATE.slides = p.slides.map(s => ({ slide: s.slide, tokens: Object.assign({}, s.tokens) }));
  renderForm(); showView('editor'); showTab('preview');
}

// ---------- Journey 2: one post from an asset — try the templates on ----------
let TRYON = null;

function initCreate() {
  const photoInput = $('#tryPhoto');
  $('#tryPicker').append(assetPicker(photoInput, () => {}));
  $('#btnTryon').onclick = runTryon;
}

function tryonText(text, slot) {
  if (!text) return null;
  if (slot.case === 'lower') return text.toLowerCase().replace(/\.$/, '');
  if (slot.case === 'word') return text.split(/\s+/).slice(0, 2).join(' ').toUpperCase();
  return text;
}

function tryonPost(opt, photo, line, kicker, cta, ratio) {
  const tokens = Object.assign({}, opt.sample);
  const slots = opt.slots;
  if (photo) {
    tokens[slots.photo] = photo;
    Object.assign(tokens, slots.apply || {});
  }
  const main = tryonText(line, slots);
  if (main) tokens[slots.main] = main;
  if (kicker && 'kicker' in tokens) tokens.kicker = kicker;
  if (cta && 'cta' in tokens) tokens.cta = cta;
  const r = opt.ratios.includes(ratio) ? ratio : opt.ratios[0];
  return { postName: `Try-on · ${opt.design}/${opt.slide}`, design: opt.design, ratio: r, slides: [{ slide: opt.slide, tokens }] };
}

async function runTryon() {
  const grid = $('#tryonGrid');
  if (!TRYON) {
    grid.textContent = 'Loading templates…';
    TRYON = (await (await fetch('/api/tryon')).json()).options;
  }
  const photo = $('#tryPhoto').value.trim();
  const line = $('#tryLine').value.trim();
  const kicker = $('#tryKicker').value.trim();
  const cta = $('#tryCta').value.trim();
  const ratio = $('#tryRatio').value;
  grid.innerHTML = '';
  const jobs = TRYON.map(opt => {
    const post = tryonPost(opt, photo, line, kicker, cta, ratio);
    const card = el('div', { class: 'tryon-card' });
    const ph = el('div', { class: 'tryon-thumb', 'data-ratio': post.ratio }, el('span', { class: 'muted' }, 'rendering…'));
    card.append(ph);
    const meta = el('div', { class: 'meta' });
    meta.append(el('div', { class: 'name' }, opt.label + (opt.slide !== 'cover' ? ` · ${opt.slide}` : '')));
    meta.append(el('div', { class: 'sub' }, `${opt.laneLabel} · ${post.ratio}`));
    const open = el('button', {}, 'Open in editor');
    open.onclick = () => load(post);
    meta.append(open);
    card.append(meta);
    grid.append(card);
    return { post, ph, card };
  });
  // limited concurrency so the singleton browser isn't swamped
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: job.post, scale: 0.5 }) });
        if (!r.ok) throw new Error((await r.json()).message || 'render failed');
        const { slices } = await r.json();
        job.ph.innerHTML = '';
        const img = el('img', { src: 'data:image/png;base64,' + slices[0].pngBase64 });
        img.onclick = () => openLightbox(img.src, job.post.postName);
        job.ph.append(img);
      } catch (e) {
        job.ph.innerHTML = '';
        job.ph.append(el('span', { class: 'muted' }, '✕ ' + e.message));
      }
    }
  }
  await Promise.all([worker(), worker()]);
}

// ---------- Journeys 1 + 3: campaigns ----------
function wireCampaigns() {
  $('#btnGenerate').onclick = generateCampaign;
  $('#campBack').onclick = () => { $('#campaignDetail').hidden = true; $('#campaignsHome').hidden = false; loadCampaigns(); };
}

async function generateCampaign() {
  const brief = $('#genBrief').value.trim();
  const status = $('#genStatus');
  if (!brief) { status.textContent = 'Describe the campaign first.'; return; }
  $('#btnGenerate').disabled = true;
  status.textContent = 'Composing — Claude is writing the set (30–90s)…';
  try {
    const r = await fetch('/api/campaigns/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief }) });
    const data = await r.json();
    if (!r.ok) { status.textContent = data.message || data.error; return; }
    status.textContent = '';
    openCampaign(data.campaign.id);
  } catch (e) { status.textContent = 'Failed: ' + e.message; }
  finally { $('#btnGenerate').disabled = false; }
}

async function loadCampaigns() {
  const box = $('#campaignList');
  const { campaigns } = await (await fetch('/api/campaigns')).json();
  if (!campaigns.length) { box.className = 'muted'; box.textContent = 'No campaigns yet — compose one above, or have an agent POST /api/campaigns.'; return; }
  box.className = 'designList'; box.innerHTML = '';
  campaigns.forEach(c => {
    const item = el('div', { class: 'item' });
    item.append(el('div', {}, [
      el('div', { class: 'name' }, c.name),
      el('div', { class: 'sub muted' }, `${c.postCount} posts · ${c.approved} approved · ${c.changesRequested} need changes · ${c.source === 'generated' ? 'composed in-app' : 'agent-pushed'}`)
    ]));
    const open = el('a', {}, 'review'); open.onclick = () => openCampaign(c.id);
    const del = el('a', { style: 'color:#b54' }, 'delete'); del.onclick = async () => { if (confirm('Delete campaign "' + c.name + '"?')) { await fetch('/api/campaigns/' + c.id, { method: 'DELETE' }); loadCampaigns(); } };
    item.append(el('div', { style: 'display:flex;gap:12px' }, [open, del]));
    box.append(item);
  });
}

const PREVIEW_CACHE = new Map(); // postJSON -> dataURI of slide 1

async function previewPost(post, target) {
  const key = JSON.stringify(post);
  if (PREVIEW_CACHE.has(key)) { target.src = PREVIEW_CACHE.get(key); return; }
  try {
    const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post, scale: 0.5 }) });
    if (!r.ok) throw new Error('render failed');
    const { slices } = await r.json();
    const uri = 'data:image/png;base64,' + slices[0].pngBase64;
    PREVIEW_CACHE.set(key, uri);
    target.src = uri;
  } catch (e) { target.alt = '✕ ' + e.message; target.classList.add('failed'); }
}

async function openCampaign(id) {
  const c = await (await fetch('/api/campaigns/' + id)).json();
  $('#campaignsHome').hidden = true;
  const d = $('#campaignDetail'); d.hidden = false;
  $('#campName').textContent = c.name;
  $('#campBrief').textContent = c.brief || '';

  // The grid — how the feed posts hang together, 3-up like the profile grid
  const grid = $('#campGrid'); grid.innerHTML = '';
  const feed = c.posts.filter(p => p.post.ratio !== '9:16');
  const stories = c.posts.filter(p => p.post.ratio === '9:16');
  feed.forEach(p => {
    const cell = el('div', { class: 'ig-cell' });
    const img = el('img');
    cell.append(img); grid.append(cell);
    previewPost(p.post, img);
    img.onclick = () => openLightbox(img.src, p.post.postName);
  });
  const sbox = $('#campStories'); sbox.innerHTML = '';
  if (stories.length) {
    sbox.append(el('h3', { class: 'gridlabel' }, 'Stories'));
    const row = el('div', { class: 'story-row' });
    stories.forEach(p => { const img = el('img'); row.append(img); previewPost(p.post, img); img.onclick = () => openLightbox(img.src, p.post.postName); });
    sbox.append(row);
  }

  // Review cards — approve / request changes / open in editor, per post
  const list = $('#campPosts'); list.innerHTML = '';
  c.posts.forEach(p => {
    const card = el('div', { class: 'review-card' });
    const img = el('img', { class: 'review-thumb' });
    previewPost(p.post, img);
    card.append(img);
    const meta = el('div', { class: 'meta' });
    meta.append(el('div', { class: 'name' }, p.post.postName || p.post.design));
    meta.append(el('div', { class: 'sub' }, `${p.post.design} · ${p.post.ratio} · ${p.post.slides.length} slide${p.post.slides.length > 1 ? 's' : ''}`));
    const status = el('span', { class: 'status s-' + p.status }, p.status.replace('_', ' '));
    meta.append(status);
    const btns = el('div', { class: 'actions' });
    const approve = el('button', {}, '✓ Approve');
    approve.onclick = async () => { await fetch(`/api/campaigns/${c.id}/posts/${p.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) }); openCampaign(c.id); };
    const edit = el('button', {}, 'Open in editor');
    edit.onclick = () => load(p.post, { campId: c.id, postId: p.id });
    btns.append(approve, edit);
    meta.append(btns);
    const fb = el('textarea', { placeholder: 'Feedback — saved for the agent to act on…' });
    const send = el('button', { class: 'savebtn' }, 'Request changes');
    send.onclick = async () => {
      if (!fb.value.trim()) return;
      await fetch(`/api/campaigns/${c.id}/posts/${p.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: fb.value.trim() }) });
      openCampaign(c.id);
    };
    meta.append(fb, send);
    if (p.feedback.length) {
      const fl = el('div', { class: 'fb-list' });
      p.feedback.forEach(f => fl.append(el('div', { class: 'fb-item' }, f.text)));
      meta.append(fl);
    }
    card.append(meta);
    list.append(card);
  });
}

const SAMPLE = { postName: 'Flower Card Guide — carousel', design: 'carousel-journal', ratio: '4:5', slides: [
  { slide: 'cover', tokens: { kicker: 'The Journal', index: '01', headline: 'The flowers are the *easy* part.', cta: 'Read the guide →', photo: 'samples/osaka_45.png', theme: 'light' } },
  { slide: 'interior', tokens: { index: '02', label_1: 'For a hard week', quote_1: '“I can’t make it lighter — but you’re not carrying it alone.”', label_2: 'Just because', quote_2: '“No occasion. I thought of you, and that was reason enough.”', label_3: 'To say thank you', quote_3: '“You made it easier than it needed to be. Thank you.”', cta: 'Next →' } },
  { slide: 'closing', tokens: { end_line: 'For the moment they feel what you meant.', cta: 'Read the guide →', url: 'figandbloom.com/journal', photo: 'samples/osaka_45.png' } }
] };

function wire() {
  $('#btnValidate').onclick = validate;
  $('#btnRender').onclick = async () => { if (await validate()) renderSet(); };
  $('#btnZip').onclick = zipAll;
  $('#btnExport').onclick = () => { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(post(), null, 2)], { type: 'application/json' })), download: (post().postName || 'post').replace(/\W+/g, '-') + '.json' }); a.click(); };
  $('#btnImport').onclick = () => $('#fileInput').click();
  $('#fileInput').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { load(JSON.parse(r.result)); } catch (x) { alert('Invalid JSON'); } }; r.readAsText(f); };
  $('#btnSave').onclick = async () => { const name = prompt('Save as:', post().postName); if (!name) return; const p = post(); p.postName = name; await fetch('/api/designs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, post: p }) }); loadDesigns(); showTab('designs'); };
  $('#btnSample').onclick = () => load(SAMPLE);
  $('#btnSaveCampaign').onclick = async () => {
    if (!CAMPAIGN_REF) return;
    await fetch(`/api/campaigns/${CAMPAIGN_REF.campId}/posts/${CAMPAIGN_REF.postId}/post`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() })
    });
    PREVIEW_CACHE.clear();
    showView('campaigns'); openCampaign(CAMPAIGN_REF.campId);
  };
  $('#addSlide').onclick = () => {
    const d = SCHEMA.designs[STATE.design];
    const slide = $('#addSlideSel').value;
    if (!d.slides[slide]) return;
    const t = defaultsFor(d, slide);
    if (slide === 'interior') { t.index = String(STATE.slides.length + 1).padStart(2, '0'); t.cta = 'Next →'; }
    // insert after the last slide of the same kind, else append
    const at = STATE.slides.map(s => s.slide).lastIndexOf(slide);
    STATE.slides.splice(at === -1 ? STATE.slides.length : at + 1, 0, { slide, tokens: t });
    renderForm();
  };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
}

boot();
