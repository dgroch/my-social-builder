'use strict';
const fs = require('fs');
const path = require('path');
const { renderPost } = require('../lib/render.js');

(async () => {
  const post = JSON.parse(fs.readFileSync('examples/story-promo-9x16.json', 'utf8'));
  const { slices } = await renderPost(post, { scale: 2 });
  console.log('Slices:', slices.length);
  for (const s of slices) {
    console.log(`Slice ${s.index} (${s.slide}): pngBase64 length=${s.pngBase64.length}`);
    // Check what the first chars of base64 decode to
    const head64 = s.pngBase64.substring(0, 30);
    console.log(`  base64 head: ${head64}...`);
    const decoded = Buffer.from(s.pngBase64, 'base64');
    console.log(`  decoded length: ${decoded.length}, first 8 bytes: ${decoded.subarray(0, 8).toString('hex')}`);
    const outPath = `/tmp/test-render-${s.index}.png`;
    fs.writeFileSync(outPath, decoded);
    const stat = fs.statSync(outPath);
    console.log(`  wrote ${outPath}: ${stat.size} bytes`);
    // verify it's PNG
    const fd = fs.openSync(outPath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    console.log(`  PNG sig check: ${buf.toString('hex')} (expected 89504e470d0a1a0a)`);
  }
})();
