'use strict';
let SCHEMA = null, LAST = null;
let STATE = { design: null, ratio: null, postName: '', slides: [], active: 0 };
let CAMPAIGN_REF = null; // {campId, postId} when a post was opened from a campaign

const $ = s => document.querySelector(s);
const el = (t, a = {}, kids = []) => { const e = document.createElement(t); for (const k in a) { if (k === 'class') e.className = a[k]; else if (k === 'html') e.innerHTML = a[k]; else e.setAttribute(k, a[k]); } (Array.isArray(kids) ? kids : [kids]).forEach(c => c && e.append(c)); return e; };

// Human names for the template tokens — the form speaks marketing, post.json keeps the contract.
const FRIENDLY = {
  kicker: 'Masthead label', headline: 'Headline', voice: 'Voice line (handwritten aside)',
  body: 'Body copy', cta: 'Call to action', lede: 'Opening line', lead_in: 'Bridge line',
  end_line: 'Closing line', quote: 'Quote', attribution: 'Attribution', caption: 'Caption',
  word: 'The word', line: 'The line', note: 'Small print', dek: 'Standfirst', subhead: 'Subheading',
  from_price: 'From price', url: 'Web address', link_hint: 'Link hint', photo: 'Photo',
  index: 'Slide number', name: 'Name', role: 'Role', text: 'The passage',
  label_1: 'Section 1 — label', quote_1: 'Section 1 — message',
  label_2: 'Section 2 — label', quote_2: 'Section 2 — message',
  label_3: 'Section 3 — label', quote_3: 'Section 3 — message',
  theme: 'Plate theme', align: 'Column position', panel: 'Panel', surface: 'Surface', motif: 'Illustration'
};
const label = name => FRIENDLY[name] || name.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

function toast(msg, ok) {
  const t = el('div', { class: 'toast' + (ok === false ? ' bad' : '') }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('on'), 10);
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 2600);
}

// ---------- Views (campaigns are the front door) ----------
const VIEW_INIT = { create: false, campaigns: false };
function showView(name) {
  document.querySelectorAll('.viewtab').forEach(t => t.classList.toggle('on', t.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'view-' + name));
  $('#editorActions').style.display = name === 'editor' ? 'flex' : 'none';
  if (name === 'create' && !VIEW_INIT.create) { VIEW_INIT.create = true; initCreate(); }
  if (name === 'campaigns') { if (!VIEW_INIT.campaigns) { VIEW_INIT.campaigns = true; wireCampaigns(); } loadCampaigns(); }
}

async function boot() {
  // navigation works immediately — no waiting on the schema fetch (cold starts are slow)
  document.querySelectorAll('.viewtab').forEach(t => t.onclick = () => showView(t.dataset.view));
  showView('campaigns');
  wire();
  SCHEMA = await (await fetch('/api/schema')).json();
  const ds = $('#design'); ds.innerHTML = '';
  Object.values(SCHEMA.designs).forEach(d => ds.append(el('option', { value: d.id }, d.label)));
  ds.onchange = () => selectDesign(ds.value);
  $('#ratio').onchange = e => { STATE.ratio = e.target.value; sync(); schedulePreview(); };
  $('#postName').oninput = e => { STATE.postName = e.target.value; sync(); };
  const draft = loadDraft();
  if (draft) { applyPost(draft); toast('Draft restored'); }
  else selectDesign(ds.value);
  loadDesigns();
}

// ---------- Draft autosave (silent; survives refresh and crashes) ----------
const DRAFT_KEY = 'sps-draft-v1';
let draftTimer = null;
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(post())); } catch {}
  }, 400);
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return (d && d.design && SCHEMA.designs[d.design]) ? d : null;
  } catch { return null; }
}

function selectDesign(id) {
  const d = SCHEMA.designs[id];
  STATE.design = id; STATE.ratio = d.primaryRatio; STATE.active = 0;
  const rs = $('#ratio'); rs.innerHTML = '';
  d.ratios.forEach(r => rs.append(el('option', { value: r }, `${r} · ${SCHEMA.ratios[r].label}`)));
  rs.value = d.primaryRatio;
  $('#laneNote').textContent = `Lane: ${SCHEMA.lanes[d.lane].label} — ${SCHEMA.lanes[d.lane].intent}`;
  STATE.slides = d.recommendedSequence.map(slide => ({ slide, tokens: defaultsFor(d, slide) }));
  renderEditor();
}

function defaultsFor(d, slide) {
  const t = {}; d.slides[slide].tokens.forEach(tok => t[tok.name] = '');
  d.slides[slide].levers.forEach(l => t[l.name] = l.values[0]);
  return t;
}

function applyPost(p) {
  $('#design').value = p.design;
  const d = SCHEMA.designs[p.design];
  STATE.design = p.design; STATE.ratio = p.ratio; STATE.active = 0;
  STATE.postName = p.postName && p.postName !== 'Untitled' ? p.postName : '';
  $('#postName').value = STATE.postName;
  const rs = $('#ratio'); rs.innerHTML = '';
  d.ratios.forEach(r => rs.append(el('option', { value: r }, `${r} · ${SCHEMA.ratios[r].label}`)));
  rs.value = p.ratio;
  $('#laneNote').textContent = `Lane: ${SCHEMA.lanes[d.lane].label} — ${SCHEMA.lanes[d.lane].intent}`;
  STATE.slides = p.slides.map(s => ({ slide: s.slide, tokens: Object.assign({}, s.tokens) }));
  renderEditor();
}

function load(p, campaignRef) {
  CAMPAIGN_REF = campaignRef || null;
  $('#btnSaveCampaign').style.display = CAMPAIGN_REF ? '' : 'none';
  applyPost(p);
  showView('editor'); showTab('preview');
}

// ---------- Editor: slide strip + one slide form + live preview ----------
function renderEditor() { renderStrip(); renderSlideForm(); sync(); schedulePreview(); }

function renderStrip() {
  const d = SCHEMA.designs[STATE.design];
  const strip = $('#slideStrip'); strip.innerHTML = '';
  STATE.slides.forEach((s, i) => {
    const card = el('div', { class: 'slide-card' + (i === STATE.active ? ' on' : '') });
    card.append(el('div', { class: 'sc-num' }, String(i + 1)));
    card.append(el('div', { class: 'sc-name' }, s.slide));
    const tools = el('div', { class: 'sc-tools' });
    if (i > 0) { const b = el('button', { title: 'Move earlier' }, '‹'); b.onclick = e => { e.stopPropagation(); [STATE.slides[i - 1], STATE.slides[i]] = [STATE.slides[i], STATE.slides[i - 1]]; STATE.active = i - 1; renderEditor(); }; tools.append(b); }
    if (i < STATE.slides.length - 1) { const b = el('button', { title: 'Move later' }, '›'); b.onclick = e => { e.stopPropagation(); [STATE.slides[i + 1], STATE.slides[i]] = [STATE.slides[i], STATE.slides[i + 1]]; STATE.active = i + 1; renderEditor(); }; tools.append(b); }
    if (STATE.slides.length > 1) {
      const b = el('button', { class: 'sc-del', title: 'Remove slide' }, '✕');
      b.onclick = e => {
        e.stopPropagation();
        if (!confirm(`Remove slide ${i + 1} (${s.slide})? Its copy will be lost.`)) return;
        STATE.slides.splice(i, 1);
        STATE.active = Math.min(STATE.active, STATE.slides.length - 1);
        renderEditor();
      };
      tools.append(b);
    }
    card.append(tools);
    card.onclick = () => { STATE.active = i; renderEditor(); };
    strip.append(card);
  });
  // add-slide picker lives at the end of the strip
  const add = el('div', { class: 'slide-card add' });
  const sel = el('select');
  Object.keys(d.slides).forEach(s => sel.append(el('option', { value: s }, s)));
  const btn = el('button', {}, '+ Add');
  btn.onclick = () => {
    const slide = sel.value;
    const t = defaultsFor(d, slide);
    if (slide === 'interior') { t.index = String(STATE.slides.length + 1).padStart(2, '0'); t.cta = 'Next →'; }
    const at = STATE.slides.map(s => s.slide).lastIndexOf(slide);
    const pos = at === -1 ? STATE.slides.length : at + 1;
    STATE.slides.splice(pos, 0, { slide, tokens: t });
    STATE.active = pos;
    renderEditor();
  };
  add.append(sel, btn);
  strip.append(add);
}

function renderSlideForm() {
  const d = SCHEMA.designs[STATE.design];
  const s = STATE.slides[STATE.active];
  const wrap = $('#slideForm'); wrap.innerHTML = '';
  if (!s) return;
  const meta = d.slides[s.slide];
  const card = el('div', { class: 'card' });
  card.append(el('h3', {}, `Slide ${STATE.active + 1} · ${s.slide}`));
  meta.levers.forEach(l => {
    const sel = el('select'); l.values.forEach(v => sel.append(el('option', { value: v }, v)));
    sel.value = s.tokens[l.name]; sel.onchange = () => { s.tokens[l.name] = sel.value; sync(); schedulePreview(); };
    card.append(el('div', { class: 'field' }, [el('label', {}, label(l.name)), sel, el('div', { class: 'help' }, l.help)]));
  });
  meta.tokens.forEach(tok => {
    const long = tok.markdown || /quote|headline|end_line|text|body/.test(tok.name);
    const inp = el(long ? 'textarea' : 'input'); inp.value = s.tokens[tok.name] || '';
    inp.oninput = () => { s.tokens[tok.name] = inp.value; sync(); schedulePreview(); };
    const help = tok.help + (tok.type === 'image' ? '  ·  URL, samples/…, or "query: cosy autumn bouquet" (resolved at render)' : '');
    const field = el('div', { class: 'field' }, [
      el('label', {}, [document.createTextNode(label(tok.name)), tok.optional ? el('span', { class: 'opt' }, ' optional') : null]),
      inp, el('div', { class: 'help' }, help)
    ]);
    if (tok.type === 'image') field.append(assetPicker(inp, () => { s.tokens[tok.name] = inp.value; sync(); schedulePreview(); }));
    card.append(field);
  });
  wrap.append(card);
}

// ---------- Live preview (the active slide, rendered as you type) ----------
let previewTimer = null, previewSeq = 0;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(runPreview, 700);
}
async function runPreview() {
  const s = STATE.slides[STATE.active];
  if (!s) return;
  const seq = ++previewSeq;
  const one = { postName: STATE.postName || 'preview', design: STATE.design, ratio: STATE.ratio, slides: [{ slide: s.slide, tokens: s.tokens }] };
  $('#lpStatus').textContent = 'Rendering preview…';
  try {
    const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: one, scale: 0.5 }) });
    const d = await r.json();
    if (seq !== previewSeq) return; // a newer edit superseded this render
    const warn = $('#lpWarn'); warn.innerHTML = '';
    if (!r.ok) {
      const errs = ((d.validation || {}).issues || []).filter(i => i.level === 'error');
      $('#lpStatus').textContent = '';
      errs.slice(0, 3).forEach(e2 => warn.append(el('div', { class: 'chip bad' }, e2.msg)));
      if (!errs.length) warn.append(el('div', { class: 'chip bad' }, d.message || 'Preview failed'));
      return;
    }
    const slice = d.slices[0];
    const img = $('#lpImg');
    img.src = 'data:image/png;base64,' + slice.pngBase64;
    img.style.display = '';
    $('#lpEmpty').style.display = 'none';
    $('#lpStatus').textContent = `Slide ${STATE.active + 1} · ${STATE.ratio} · live preview (renders @2x)`;
    if (slice.overflow) warn.append(el('div', { class: 'chip bad' }, '⚠ Copy overflows the canvas — it will be clipped. Shorten it.'));
    (slice.failedAssets || []).slice(0, 2).forEach(u => warn.append(el('div', { class: 'chip bad' }, '⚠ Image failed to load: ' + u.split(' — ')[0].slice(0, 80))));
  } catch (e) {
    if (seq === previewSeq) $('#lpStatus').textContent = 'Preview failed: ' + e.message;
  }
}

// ---------- Asset library picker ----------
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

function post() { return { postName: STATE.postName || 'Untitled', design: STATE.design, ratio: STATE.ratio, slides: STATE.slides }; }
function sync() { $('#panel-json').textContent = JSON.stringify(post(), null, 2); saveDraft(); }

async function validate() {
  const v = await (await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() }) })).json();
  const box = $('#validation'); box.innerHTML = '';
  if (v.ok && !v.warningCount) box.append(el('div', { class: 'ok' }, '✓ Valid — ready to render.'));
  v.issues.forEach(it => box.append(el('div', { class: it.level === 'error' ? 'err' : 'warn' }, (it.slide ? `Slide ${it.slide}: ` : '') + it.msg)));
  return v.ok;
}

async function renderSet() {
  const btn = $('#btnRender');
  if (btn.disabled) return;
  if (!(await validate())) { showTab('preview'); return; }
  showTab('preview');
  btn.disabled = true; btn.textContent = `Rendering ${STATE.slides.length} slide${STATE.slides.length > 1 ? 's' : ''}…`; btn.classList.add('busy');
  $('#results').innerHTML = '<p class="muted">Rendering the full set @2x — sit tight…</p>';
  try {
    const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() }) });
    if (!r.ok) { $('#results').innerHTML = ''; await validate(); return; }
    LAST = await r.json();
    const out = $('#results'); out.innerHTML = '';
    LAST.slices.forEach(s => {
      const fig = el('figure');
      const img = el('img', { src: 'data:image/png;base64,' + s.pngBase64 });
      fig.append(img);
      const px = `${s.w * (LAST.scale || 2)}×${s.h * (LAST.scale || 2)}`;
      const a = el('a', { download: `${String(s.index).padStart(2, '0')}-${s.slide}.png`, href: 'data:image/png;base64,' + s.pngBase64 }, 'download');
      fig.append(el('figcaption', {}, [document.createTextNode(`${s.slide} · ${px}px (@${LAST.scale || 2}x)`), a]));
      if (s.overflow) fig.append(el('div', { class: 'figwarn' }, '⚠ Copy overflows this slide and is clipped — shorten it before shipping.'));
      (s.failedAssets || []).slice(0, 2).forEach(u => fig.append(el('div', { class: 'figwarn' }, '⚠ An image failed to load: ' + u.split(' — ')[0].slice(0, 90))));
      out.append(fig);
    });
    $('#btnZip').style.display = 'block';
    const broken = LAST.slices.filter(s => s.overflow || (s.failedAssets || []).length).length;
    toast(broken ? `Rendered with ${broken} warning${broken > 1 ? 's' : ''} — check before shipping` : '✓ Set rendered', !broken);
  } catch (e) {
    $('#results').innerHTML = '';
    toast('Render failed: ' + e.message, false);
  } finally {
    btn.disabled = false; btn.textContent = 'Render'; btn.classList.remove('busy');
  }
}

async function zipAll() {
  if (!LAST) return;
  const zip = new JSZip();
  LAST.slices.forEach(s => zip.file(`${String(s.index).padStart(2, '0')}-${s.slide}.png`, s.pngBase64, { base64: true }));
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = el('a', { href: URL.createObjectURL(blob), download: (post().postName || 'post').replace(/\W+/g, '-') + '-' + STATE.ratio.replace(':', 'x') + '.zip' });
  document.body.append(a); a.click(); a.remove();
  toast('✓ Zip downloaded');
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
  ['preview', 'json', 'designs', 'library', 'feedback'].forEach(n => $('#panel-' + n).classList.toggle('on', n === name));
  if (name === 'library' && !LIB_STATE.loaded) loadLibrary();
  if (name === 'feedback') loadFeedback();
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
  if (slot.case === 'word') return text.split(/\s+/).slice(0, 2).join(' ').toUpperCase();
  return text; // user copy is preserved verbatim — templates style it themselves
}

function tryonPost(opt, photo, line, kicker, cta, ratio) {
  const tokens = Object.assign({}, opt.sample);
  const slots = opt.slots;
  const dropped = [];
  if (photo) {
    tokens[slots.photo] = photo;
    Object.assign(tokens, slots.apply || {});
  }
  const main = tryonText(line, slots);
  if (main) {
    tokens[slots.main] = main;
    // don't let sample attributions ride along with the user's own line (misattribution risk)
    if ('attribution' in tokens && slots.main !== 'attribution') tokens.attribution = '';
  }
  if (kicker) { if ('kicker' in tokens) tokens.kicker = kicker; else dropped.push('masthead label'); }
  if (cta) { if ('cta' in tokens) tokens.cta = cta; else dropped.push('CTA'); }
  const r = opt.ratios.includes(ratio) ? ratio : opt.ratios[0];
  return { post: { postName: `Try-on · ${opt.design}/${opt.slide}`, design: opt.design, ratio: r, slides: [{ slide: opt.slide, tokens }] }, dropped, ratioFellBack: r !== ratio };
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
    const { post: p, dropped, ratioFellBack } = tryonPost(opt, photo, line, kicker, cta, ratio);
    const card = el('div', { class: 'tryon-card' });
    const ph = el('div', { class: 'tryon-thumb' }, el('span', { class: 'muted' }, 'rendering…'));
    card.append(ph);
    const meta = el('div', { class: 'meta' });
    meta.append(el('div', { class: 'name' }, opt.label + (opt.slide !== 'cover' ? ` · ${opt.slide}` : '')));
    meta.append(el('div', { class: 'sub' }, `${opt.laneLabel} · ${p.ratio}${ratioFellBack ? ' (no ' + ratio + ' on this template)' : ''}`));
    if (dropped.length) meta.append(el('div', { class: 'help' }, `This lane doesn't carry a ${dropped.join(' or ')} — it's chrome-free by design.`));
    const open = el('button', {}, 'Open in editor');
    open.onclick = () => load(p);
    meta.append(open);
    card.append(meta);
    grid.append(card);
    return { post: p, ph };
  });
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: job.post, scale: 0.5 }) });
        if (!r.ok) throw new Error(((await r.json()).validation || {}).issues?.[0]?.msg || 'render failed');
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
  if (!campaigns.length) { box.className = 'muted'; box.textContent = 'No campaigns yet — compose one above, or have an agent POST a set for review.'; return; }
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

// Campaign previews are plain GET image URLs (server renders slide 1, content-hash
// versioned, cached server-side and by the browser) — no long fetches to time out
// on mobile, and a revised post gets a new ?v so thumbnails can't go stale.
function previewPost(campId, p, target, holder) {
  if (holder) holder.classList.add('loading');
  target.loading = 'lazy';
  target.onload = () => { if (holder) holder.classList.remove('loading'); };
  target.onerror = () => {
    if (holder) holder.classList.remove('loading');
    target.alt = '✕ preview failed — tap to retry';
    target.classList.add('failed');
    target.onclick = e => { e.stopPropagation(); target.classList.remove('failed'); if (holder) holder.classList.add('loading'); target.src = target.src.split('&r=')[0] + '&r=' + Date.now(); };
  };
  target.src = `/api/campaigns/${campId}/posts/${p.id}/preview.png?v=${p.previewV || ''}`;
}

async function openCampaign(id) {
  const c = await (await fetch('/api/campaigns/' + id)).json();
  $('#campaignsHome').hidden = true;
  const d = $('#campaignDetail'); d.hidden = false;
  $('#campName').textContent = c.name;
  $('#campBrief').textContent = c.brief || '';

  const grid = $('#campGrid'); grid.innerHTML = '';
  const feed = c.posts.filter(p => p.post.ratio !== '9:16');
  const stories = c.posts.filter(p => p.post.ratio === '9:16');
  feed.forEach(p => {
    const cell = el('div', { class: 'ig-cell' });
    const img = el('img');
    cell.append(img); grid.append(cell);
    previewPost(id, p, img, cell);
    img.onclick = () => openLightbox(img.src, p.post.postName);
  });
  const sbox = $('#campStories'); sbox.innerHTML = '';
  if (stories.length) {
    sbox.append(el('h3', { class: 'gridlabel' }, 'Stories'));
    const row = el('div', { class: 'story-row' });
    stories.forEach(p => { const cell = el('div', { class: 'ig-cell story' }); const img = el('img'); cell.append(img); row.append(cell); previewPost(id, p, img, cell); img.onclick = () => openLightbox(img.src, p.post.postName); });
    sbox.append(row);
  }

  const list = $('#campPosts'); list.innerHTML = '';
  c.posts.forEach(p => {
    const card = el('div', { class: 'review-card' });
    const thumbWrap = el('div', { class: 'review-thumb-wrap' });
    const img = el('img', { class: 'review-thumb' });
    thumbWrap.append(img);
    previewPost(id, p, img, thumbWrap);
    card.append(thumbWrap);
    const meta = el('div', { class: 'meta' });
    meta.append(el('div', { class: 'name' }, p.post.postName || p.post.design));
    meta.append(el('div', { class: 'sub' }, `${p.post.design} · ${p.post.ratio} · ${p.post.slides.length} slide${p.post.slides.length > 1 ? 's' : ''}`));
    const status = el('span', { class: 'status s-' + p.status }, p.status.replace('_', ' '));
    meta.append(status);
    const btns = el('div', { class: 'actions' });
    const approve = el('button', {}, '✓ Approve');
    approve.onclick = async () => { await fetch(`/api/campaigns/${c.id}/posts/${p.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) }); toast('✓ Approved'); openCampaign(c.id); };
    const edit = el('button', {}, 'Open in editor');
    edit.onclick = () => load(p.post, { campId: c.id, postId: p.id });
    btns.append(approve, edit);
    meta.append(btns);
    const fb = el('textarea', { placeholder: c.canGenerate ? 'Feedback — Claude revises the post against it…' : 'Feedback — saved for the agent to act on…' });
    const send = el('button', { class: 'savebtn' }, c.canGenerate ? 'Request changes — Claude revises' : 'Request changes');
    const note = el('span', { class: 'sub' }, '');
    const revise = async (text) => {
      send.disabled = true;
      status.textContent = 'revising…'; status.className = 'status s-revising';
      note.textContent = 'Claude is revising… (~30–60s)';
      try {
        const r = await fetch(`/api/campaigns/${c.id}/posts/${p.id}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
        const dd = await r.json();
        if (!r.ok) { note.textContent = '✕ ' + (dd.message || dd.error); send.disabled = false; return; }
        toast('✓ Revised — preview updating');
        openCampaign(c.id);
      } catch (e) { note.textContent = '✕ ' + e.message; send.disabled = false; }
    };
    send.onclick = async () => {
      const text = fb.value.trim();
      if (!text) return;
      if (c.canGenerate) return revise(text);
      await fetch(`/api/campaigns/${c.id}/posts/${p.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      toast('✓ Feedback saved for the agent');
      openCampaign(c.id);
    };
    meta.append(fb, send, note);
    const unaddressed = p.feedback.filter(f => !f.addressedAt);
    if (c.canGenerate && unaddressed.length) {
      const redo = el('button', { class: 'savebtn' }, `Revise with Claude (${unaddressed.length} note${unaddressed.length > 1 ? 's' : ''} waiting)`);
      redo.onclick = () => { send.disabled = true; redo.disabled = true; revise(''); };
      meta.append(redo);
    }
    if (p.feedback.length) {
      const fl = el('div', { class: 'fb-list' });
      p.feedback.forEach(f => fl.append(el('div', { class: 'fb-item' + (f.addressedAt ? ' done' : '') }, (f.addressedAt ? '✓ ' : '') + f.text)));
      meta.append(fl);
    }
    card.append(meta);
    list.append(card);
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
      const p = await r.json();
      load(p);
    };
    actions.append(useBtn);
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
        ta.value = '';
        toast('✓ Feedback saved');
        saveBtn.disabled = false;
      } catch (e) {
        toast('Feedback failed to save', false);
        saveBtn.disabled = false;
      }
    };
    meta.append(saveBtn);
    card.append(meta);
    box.append(card);
  });
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
      head.append(el('span', {}, f.savedAt ? new Date(f.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''));
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
    const del = el('a', { style: 'color:#b54' }, 'delete'); del.onclick = async () => { if (confirm('Delete "' + d.name + '"?')) { await fetch('/api/designs/' + d.id, { method: 'DELETE' }); toast('Deleted'); loadDesigns(); } };
    item.append(el('div', { style: 'display:flex;gap:12px' }, [open, del]));
    box.append(item);
  });
}

const SAMPLE = { postName: 'Flower Card Guide — carousel', design: 'carousel-journal', ratio: '4:5', slides: [
  { slide: 'cover', tokens: { kicker: 'The Journal', index: '01', headline: 'The flowers are the easy part.', cta: 'Read the guide →', photo: 'samples/osaka_45.png', theme: 'light' } },
  { slide: 'interior', tokens: { kicker: 'The Journal', index: '02', label_1: 'For a hard week', quote_1: '“I can’t make it lighter — but you’re not carrying it alone.”', label_2: 'Just because', quote_2: '“No occasion. I thought of you, and that was reason enough.”', label_3: 'To say thank you', quote_3: '“You made it easier than it needed to be. Thank you.”', cta: 'Next →' } },
  { slide: 'closing', tokens: { voice: 'For the moment they feel what you meant.', cta: 'Read the guide →', url: 'figandbloom.com/journal', photo: 'samples/osaka_45.png' } }
] };

function flash(btn, text) {
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, 1600);
}

function wire() {
  // ⋯ menu
  const menu = $('#moreMenu');
  $('#btnMore').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('click', () => { menu.hidden = true; });
  $('#btnRender').onclick = renderSet;
  $('#btnZip').onclick = zipAll;
  $('#btnExport').onclick = () => { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(post(), null, 2)], { type: 'application/json' })), download: (post().postName || 'post').replace(/\W+/g, '-') + '.json' }); a.click(); toast('✓ Exported post.json'); };
  $('#btnImport').onclick = () => $('#fileInput').click();
  $('#fileInput').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        if (!p.design || !Array.isArray(p.slides)) throw new Error('not a post.json');
        load(p);
        toast('✓ Imported ' + (p.postName || f.name));
      } catch (x) { toast('Couldn\'t read that file — it isn\'t valid post JSON.', false); }
      e.target.value = '';
    };
    r.readAsText(f);
  };
  $('#btnSave').onclick = async () => {
    const btn = $('#btnSave');
    btn.disabled = true;
    try {
      const p = post();
      await fetch('/api/designs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.postName, post: p }) });
      toast('✓ Saved to My posts');
      flash(btn, '✓ Saved');
      loadDesigns();
    } catch (e) { toast('Save failed: ' + e.message, false); }
    finally { btn.disabled = false; }
  };
  $('#btnSaveCampaign').onclick = async () => {
    if (!CAMPAIGN_REF) return;
    await fetch(`/api/campaigns/${CAMPAIGN_REF.campId}/posts/${CAMPAIGN_REF.postId}/post`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: post() })
    });
    toast('✓ Saved back to the campaign');
    showView('campaigns'); openCampaign(CAMPAIGN_REF.campId);
  };
  $('#btnSample').onclick = () => { load(SAMPLE); toast('Sample loaded'); };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
}

boot();
