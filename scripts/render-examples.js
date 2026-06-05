#!/usr/bin/env node
// Renders every example/*.json to examples/renders/<name>-<ratio>-<slide>-<type>.png
// Usage: node scripts/render-examples.js
'use strict';
const fs = require('fs');
const path = require('path');
const { renderPost } = require('../lib/render.js');

const examplesDir = path.join(__dirname, '..', 'examples');
const outDir = path.join(examplesDir, 'renders');
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error('No example JSONs found in', examplesDir);
  process.exit(1);
}

(async () => {
  for (const f of files) {
    const post = JSON.parse(fs.readFileSync(path.join(examplesDir, f), 'utf8'));
    const stem = f.replace(/\.json$/, '');
    process.stdout.write(`rendering ${stem}... `);
    try {
      const { slices } = await renderPost(post, { scale: 2 });
      for (const s of slices) {
        const slideName = `${stem}-slide-${s.index}-${s.slide}.png`;
        const outPath = path.join(outDir, slideName);
        // lib/render.js now returns a real Buffer in `s.png`; prefer that
        // over decoding the base64 round-trip.
        const buf = s.png || Buffer.from(s.pngBase64, 'base64');
        fs.writeFileSync(outPath, buf);
      }
      console.log(`OK (${slices.length} slices)`);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
  }
  console.log('done');
})();
