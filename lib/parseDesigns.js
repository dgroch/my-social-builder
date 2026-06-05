'use strict';
// Derives the live token schema from each design's template headers + manifest.json.
// Mirrors the email builder's parseTemplates.js: the form/agent contract is generated
// from the templates themselves, so adding a template surfaces it automatically.

const fs = require('fs');
const path = require('path');

function dsRoot() {
  return path.join(__dirname, '..', 'design-system');
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(dsRoot(), 'manifest.json'), 'utf8'));
}

// Pull the leading <!-- … --> header from a template.
function headerOf(html) {
  const m = html.match(/<!--([\s\S]*?)-->/);
  return m ? m[1] : '';
}

// Parse "name : type[, flag] | help" and "name : enum a|b | help" lines.
// Help is separated by " | " (space-pipe-space) so enum values may contain a bare pipe.
function parseLine(line) {
  const parts = line.split(/\s\|\s/); // [ "name : type", "help" ]
  const left = parts[0];
  const help = (parts[1] || '').trim();
  const ci = left.indexOf(':');
  if (ci === -1) return null;
  const name = left.slice(0, ci).trim();
  const typeStr = left.slice(ci + 1).trim();
  if (!name) return null;
  return { name, typeStr, help };
}

function parseTokens(header) {
  const tokens = [];
  const levers = [];
  const lines = header.split('\n');
  let mode = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^\s*TOKENS:\s*$/.test(line)) { mode = 'tokens'; continue; }
    if (/^\s*LEVERS:\s*$/.test(line)) { mode = 'levers'; continue; }
    if (/^\s*(VISUAL_ROLE|FOCAL|NOTE)\b/.test(line)) { mode = null; continue; }
    if (!mode) continue;
    if (!line.includes(':') || !line.includes('|')) continue;
    const p = parseLine(line);
    if (!p) continue;
    if (mode === 'tokens') {
      const flags = p.typeStr.split(',').map(s => s.trim());
      const type = flags[0]; // text | image
      tokens.push({ name: p.name, type, markdown: flags.includes('markdown'), optional: flags.includes('optional'), help: p.help });
    } else {
      // enum lever: "enum light|dark"
      const m = p.typeStr.match(/^enum\s+(.+)$/);
      const values = m ? m[1].split('|').map(s => s.trim()) : [];
      levers.push({ name: p.name, type: 'enum', values, help: p.help });
    }
  }
  return { tokens, levers };
}

// Full schema the UI form + agents target.
function buildSchema() {
  const manifest = loadManifest();
  const designs = {};
  for (const [id, d] of Object.entries(manifest.designs)) {
    const slides = {};
    for (const [slideId, meta] of Object.entries(d.slides)) {
      const tplPath = path.join(dsRoot(), 'designs', id, meta.template);
      const html = fs.readFileSync(tplPath, 'utf8');
      const { tokens, levers } = parseTokens(headerOf(html));
      slides[slideId] = { ...meta, tokens, levers };
    }
    designs[id] = {
      id, lane: d.lane, label: d.label, format: d.format,
      primaryRatio: d.primaryRatio, ratios: d.ratios,
      bestFor: d.bestFor || [], avoidFor: d.avoidFor || [],
      recommendedSequence: d.recommendedSequence || [],
      requiresPlate: !!d.requiresPlate,
      slides
    };
  }
  return { brand: manifest.brand, version: manifest.version, ratios: manifest.ratios, lanes: manifest.lanes, designs };
}

module.exports = { dsRoot, loadManifest, buildSchema };
