'use strict';
let SCHEMA = null, STATE = { design: null, ratio: null, slides: [] }, LAST = null;

const $ = s => document.querySelector(s);
const el = (t, a = {}, kids = []) => { const e = document.createElement(t); for (const k in a) { if (k === 'class') e.className = a[k]; else if (k === 'html') e.innerHTML = a[k]; else e.setAttribute(k, a[k]); } (Array.isArray(kids) ? kids : [kids]).forEach(c => c && e.append(c)); return e; };

async function boot() {
  SCHEMA = await (await fetch('/api/schema')).json();
  const ds = $('#design'); ds.innerHTML = '';
  Object.values(SCHEMA.designs).forEach(d => ds.append(el('option', { value: d.id }, d.label)));
  ds.onchange = () => selectDesign(ds.value);
  $('#ratio').onchange = e => { STATE.ratio = e.target.value; sync(); };
  selectDesign(ds.value);
  wire(); loadDesigns();
}

function selectDesign(id) {
  const d = SCHEMA.designs[id];
  STATE.design = id; STATE.ratio = d.primaryRatio;
  const rs = $('#ratio'); rs.innerHTML = '';
  d.ratios.forEach(r => rs.append(el('option', { value: r }, `${r} · ${SCHEMA.ratios[r].label}`)));
  rs.value = d.primaryRatio;
  $('#laneNote').textContent = `Lane: ${SCHEMA.lanes[d.lane].label} — ${SCHEMA.lanes[d.lane].intent}`;
  STATE.slides = d.recommendedSequence.map(slide => ({ slide, tokens: defaultsFor(d, slide) }));
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
    if (s.slide === 'interior') title.append(el('button', { class: 'del' }, '✕ remove'));
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
      const help = tok.help + (tok.markdown ? '  ·  *word* = italic accent' : '') + (tok.type === 'image' ? '  ·  URL or samples/osaka_45.png' : '');
      card.append(el('div', { class: 'field' }, [el('label', {}, tok.name), inp, el('div', { class: 'help' }, help)]));
    });
    if (s.slide === 'interior') title.querySelector('.del').onclick = () => { STATE.slides.splice(i, 1); renderForm(); };
    wrap.append(card);
  });
  sync();
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
  ['preview', 'json', 'designs'].forEach(n => $('#panel-' + n).classList.toggle('on', n === name));
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

function load(p) {
  $('#design').value = p.design; selectDesign(p.design);
  STATE.ratio = p.ratio; $('#ratio').value = p.ratio;
  STATE.slides = p.slides.map(s => ({ slide: s.slide, tokens: Object.assign({}, s.tokens) }));
  renderForm(); showTab('preview');
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
  $('#addInterior').onclick = () => { const d = SCHEMA.designs[STATE.design]; const idx = STATE.slides.filter(s => s.slide === 'interior').length + 2; const t = defaultsFor(d, 'interior'); t.index = String(idx).padStart(2, '0'); t.cta = 'Next →'; const at = STATE.slides.map(s => s.slide).lastIndexOf('interior'); STATE.slides.splice(at + 1, 0, { slide: 'interior', tokens: t }); renderForm(); };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
}

boot();
