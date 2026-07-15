'use strict';
// Pixel-accurate descender-intrusion check. `overflow` (scrollHeight vs clientHeight)
// cannot see this bug: a Cervanttis descender overflows its own line-box, not the card,
// so the card never scrolls and `overflow` stays false on a visibly broken slide. This
// measures the ACTUAL rasterised ink — it screenshots the slide, reads the pixels back
// through a canvas, and asserts the lowest ink of a script (Cervanttis) block clears the
// highest ink of the text block stacked directly beneath it, at every supported ratio.
//
// Run stand-alone:  CHROMIUM_PATH=/path/to/chrome node test/descender-intrusion.js
// Or:  const { runIntrusionCheck } = require('./test/descender-intrusion')  and await it.

const path = require('path');
const os = require('os');
const fs = require('fs');
const { assembleSlide } = require('../lib/render');
const { buildSchema } = require('../lib/parseDesigns');

// Cervanttis elements that sit directly above another text block, per template. The bug
// only exists where a script line stacks over copy — a lone/last script line (card-caption
// caption, card-quote-lineart attr, the carousel closing hero voice between spacers) has
// nothing beneath it and cannot collide, so those are intentionally not listed.
const STACKS = [
  { design: 'card-note',        slide: 'cover',    script: '.line',  below: '.sub',   ratios: ['1:1', '4:5', '9:16', '1.91:1'] },
  { design: 'story-promo',      slide: 'cover',    script: '.voice', below: '.h',     ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'story-gift',       slide: 'intro',    script: '.voice', below: '.h',     ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'story-gift',       slide: 'closing',  script: '.voice', below: '.h',     ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'story-studio',     slide: 'cover',    script: '.voice', below: '.h',     ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'story-editorial',  slide: 'cover',    script: '.voice', below: '.quote', ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'story-quote-soft', slide: 'cover',    script: '.voice', below: '.head',  ratios: ['9:16', '4:5', '1:1', '1.91:1'] },
  { design: 'carousel-journal', slide: 'cover',    script: '.voice', below: '.h',     ratios: ['4:5', '1:1', '9:16'] },
  { design: 'carousel-journal', slide: 'intro',    script: '.voice', below: '.lede',  ratios: ['4:5', '1:1', '9:16'] },
  { design: 'carousel-journal', slide: 'interior', script: '.voice', below: '.secs',  ratios: ['4:5', '1:1', '9:16'] },
];

// A descender-heavy voice line — the copywriter shouldn't have to avoid j g y p q; the
// layout must hold with all of them present. `below` copy carries ascenders/caps so its
// ink top is measured at its true highest point.
const VOICE = 'happy journey, gently sprung';
function tokensFor(design, slide) {
  const t = {
    'card-note|cover':          { line: VOICE, sub: 'lofty flight, bright things', motif: 'hand-flower' },
    'story-promo|cover':        { kicker: 'New in', voice: VOICE, headline: 'The Osaka bunch', subhead: 'soft blush peonies', cta: 'See the range', photo: 'samples/osaka_45.png' },
    'story-gift|intro':         { kicker: 'Gifting', voice: VOICE, headline: 'For the moment', body: 'a quiet note', cta: 'Next', photo: 'samples/osaka_45.png' },
    'story-gift|closing':       { kicker: 'Delivered', voice: VOICE, end_line: 'For the moment they feel', cta: 'Choose', url: 'figandbloom.com', photo: 'samples/osaka_45.png' },
    'story-studio|cover':       { kicker: 'In the studio', voice: VOICE, headline: 'Hands at work', body: 'a quiet note', cta: 'Read', photo: 'samples/osaka_45.png' },
    'story-editorial|cover':    { kicker: 'The journal', voice: VOICE, quote: 'Flowers are the easy part', attribution: 'Fig & Bloom', photo: 'samples/osaka_45.png' },
    'story-quote-soft|cover':   { kicker: 'The studio', voice: VOICE, headline: 'A poetic line here', body: 'a quiet note', url: 'fig.com', cta: 'Visit', photo: 'samples/osaka_45.png' },
    'carousel-journal|cover':   { kicker: 'The Journal', index: '01', voice: VOICE, headline: 'On leaving fashion for flowers', photo: 'samples/osaka_45.png' },
    'carousel-journal|intro':   { kicker: 'New Post', index: '01', voice: VOICE, lede: 'A serif opening line', body: 'body text here', lead_in: 'A few to borrow', cta: 'Next' },
    'carousel-journal|interior':{ kicker: 'The Journal', index: '02', voice: VOICE, label_1: 'One', quote_1: 'first', label_2: 'Two', quote_2: 'second', label_3: 'Three', quote_3: 'third', cta: 'Next' },
  };
  return t[design + '|' + slide];
}

// Read the rendered PNG back through a canvas and return the first/last rows carrying ink
// inside `box` (device pixels). Background is the per-box MEDIAN luminance (type is a small
// minority of pixels in a text box), so this self-calibrates on paper, clay, ink and photo
// grounds alike; ink = a row with a pixel deviating strongly from that median.
async function inkBand(page, pngDataUrl, box) {
  return page.evaluate(async (pngDataUrl, box) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = pngDataUrl; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const x0 = Math.max(0, Math.floor(box.x)), x1 = Math.min(img.width, Math.ceil(box.x + box.w));
    const y0 = Math.max(0, Math.floor(box.y)), y1 = Math.min(img.height, Math.ceil(box.y + box.h));
    if (x1 <= x0 || y1 <= y0) return null;
    const W = x1 - x0, H = y1 - y0;
    const d = ctx.getImageData(x0, y0, W, H).data;
    const lum = new Float32Array(W * H);
    const hist = new Uint32Array(256);
    for (let p = 0; p < W * H; p++) {
      const i = p * 4;
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      lum[p] = l; hist[Math.min(255, Math.max(0, l | 0))]++;
    }
    let acc = 0, median = 0; const half = (W * H) / 2;
    for (let k = 0; k < 256; k++) { acc += hist[k]; if (acc >= half) { median = k; break; } }
    let top = -1, bottom = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (Math.abs(lum[y * W + x] - median) > 45) { if (top < 0) top = y; bottom = y; break; }
      }
    }
    if (top < 0) return null;
    return { top: y0 + top, bottom: y0 + bottom };
  }, pngDataUrl, box);
}

// Returns one row per (design, slide, ratio): the true-ink gap in device px between the
// script block and the block beneath it. gap > 0 ⟺ provably no touching (the script's
// lowest ink sits above the below block's highest ink).
async function runIntrusionCheck(browser, scale = 1) {
  const schema = buildSchema();
  const rows = [];
  for (const st of STACKS) {
    for (const ratio of st.ratios) {
      const { html, w, h } = assembleSlide(schema, st.design, st.slide, tokensFor(st.design, st.slide), ratio, { index: 1, total: 1 });
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'di-'));
      const file = path.join(tmp, 's.html'); fs.writeFileSync(file, html);
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
      await page.goto('file://' + file, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      // Measurement mode: flatten every ground to white and force type to solid black with
      // no shadow, so ink is trivially separable from background even on photo plates. Only
      // colour/background/shadow/opacity are touched — none affect box geometry — so the type
      // positions (and therefore the descender gap we measure) are exactly the real render's.
      await page.addStyleTag({ content: `
        *{ text-shadow:none !important; }
        .stage *{ color:#000 !important; }
        .stage,.plate,.photo,.ov,.shade,.rail,.panel,.col,.secs,.sec,.lcol,.la,.plate,.top{ background:#fff !important; background-image:none !important; }
        .stage::after,.plate::after,.photo::after{ opacity:0 !important; background:none !important; }
        .ov,.shade{ opacity:0 !important; }
        .la,.logo,.avatar,.llogo,.mrule,.frule,.rule,.mark,.krule,.mrule,.div,.lhair,.lkrule,.hairline{ opacity:0 !important; }
      ` });
      await page.evaluateHandle('document.fonts.ready');
      const boxes = await page.evaluate((sSel, bSel, scale) => {
        const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x * scale, y: b.y * scale, w: b.width * scale, h: b.height * scale }; };
        return { s: r(document.querySelector(sSel)), b: r(document.querySelector(bSel)) };
      }, st.script, st.below, scale);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
      const dataUrl = 'data:image/png;base64,' + Buffer.from(png).toString('base64');
      let gap = null, sInk = null, bInk = null;
      if (boxes.s && boxes.b) {
        // Script scan box reaches from the script top DOWN to the below block's top, so the
        // descender that overflows the script line-box is captured but the below copy is not.
        const sBox = { x: boxes.s.x, y: boxes.s.y, w: boxes.s.w, h: Math.max(1, boxes.b.y - boxes.s.y) };
        sInk = await inkBand(page, dataUrl, sBox);
        bInk = await inkBand(page, dataUrl, boxes.b);
        if (sInk && bInk) gap = +(bInk.top - sInk.bottom).toFixed(1);
      }
      await page.close(); fs.rmSync(tmp, { recursive: true, force: true });
      rows.push({ design: st.design, slide: st.slide, ratio, gap });
    }
  }
  return rows;
}

module.exports = { runIntrusionCheck, STACKS, tokensFor };

if (require.main === module) {
  (async () => {
    const puppeteer = require('puppeteer');
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH || undefined, headless: 'new',
        args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none', '--disable-quic'],
      });
    } catch (e) {
      // This check needs a Chromium (like the render path); skip cleanly where none is
      // available rather than failing the run. Set CHROMIUM_PATH to point at one.
      console.log('SKIP — descender-intrusion check needs Chromium (set CHROMIUM_PATH):', e.message.split('\n')[0]);
      process.exit(0);
    }
    const rows = await runIntrusionCheck(browser, 1);
    await browser.close();
    let fail = 0;
    for (const r of rows) {
      const ok = r.gap != null && r.gap > 0;
      if (!ok) fail++;
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${(r.design + '/' + r.slide).padEnd(26)} ${r.ratio.padEnd(7)} inkGap=${r.gap == null ? 'n/a' : r.gap + 'px'}`);
    }
    console.log(fail ? `\n${fail} FAILURE(S) — descender intrusion` : '\nALL CLEAR — no descender intrusion at any ratio');
    process.exit(fail ? 1 : 0);
  })().catch(e => { console.error(e); process.exit(2); });
}
