// One version for every local file of a release (scripts/set-version.mjs; user 2026-09-30, item 32): after an update a
// cached old engine file must never meet the new pages, so every local script, stylesheet and module specifier carries
// the same “?v=<tag>”, and data files are fetched with the fetching module's own version.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = [];
const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'game-data' && e.name !== 'assets') walk(p); } else if (/\.(html|mjs|js)$/.test(e.name) && e.name !== 'lua-wasm.mjs' && e.name !== 'game-skill-data.js') files.push(p); } };
walk(dist);
const rel = f => path.relative(dist, f);

test('every local script, stylesheet and module import carries the one release version', () => {
  const tags = new Set();
  for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/[?&]v=(\d{8}-[A-Za-z0-9_-]+)/g)) tags.add(m[1]);
  assert.equal(tags.size, 1, `versions in use: ${[...tags].join(', ')} — run node scripts/set-version.mjs`);
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.html')) for (const m of s.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|\/\/|data:)/.test(m[1]) || !/\.(m?js|css)(\?|$)/.test(m[1])) continue;
      assert.match(m[1], /\?v=\d{8}-/, `${rel(f)}: ${m[1]}`);
    } else for (const m of s.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+\.m?js[^'"]*)['"]/g)) assert.match(m[1], /\?v=\d{8}-/, `${rel(f)}: ${m[1]}`);
  }
});

test('data files are fetched with the fetching file’s own version', () => {
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/fetch\(([^;]{0,160})/g)) {
      if (!/game-data|path/.test(m[1])) continue;
      assert.match(m[1], /\+ V|\$\{V\}/, `${rel(f)}: fetch(${m[1].slice(0, 80)}`);
    }
  }
});
