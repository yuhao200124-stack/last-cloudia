// One version for every file of a release (user 2026-09-30, item 32: after an update the browser mixed cached old engine
// files with the new pages for up to ~10 minutes — GitHub Pages caches for 600 s). Run before every publish:
//   node scripts/set-version.mjs            # tag = now, e.g. 20260930-1542
//   node scripts/set-version.mjs <tag>
// It gives every local script / stylesheet / module the same “?v=<tag>”: <script src>, <link href> and the pages' own
// links that already carry one (./characters.html?v=…) in dist/*.html; import / import() specifiers in dist/**/*.mjs|js;
// the frame addresses built in scripts (…html?…&v=…). Data files (game-data/*.json, the Lua scripts) are fetched with the
// fetching module's own “?v=” (new URL(import.meta.url).search), so they follow automatically.
// tests/site-version.test.mjs checks that nothing local is left without the current tag.
import fs from 'node:fs';
import path from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const tag = process.argv[2] || `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
if (!/^\d{8}-[A-Za-z0-9_-]+$/.test(tag)) throw new Error(`版本号格式应为 YYYYMMDD-xxx：${tag}`);

const CODE_FILES = () => {
  const out = [];
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'game-data' && e.name !== 'assets') walk(p); } else if (/\.(html|mjs|js)$/.test(e.name) && e.name !== 'lua-wasm.mjs' && !/^game-skill-data\.js$/.test(e.name)) out.push(p); } };
  walk(dist.pathname);
  return out;
};
const LOCAL = /^(?!https?:|\/\/|data:)(\.{1,2}\/)?[\w./-]+\.(m?js|css)$/;
let changed = 0;
if (import.meta.url === `file://${process.argv[1]}`) for (const file of CODE_FILES()) {
  const src = fs.readFileSync(file, 'utf8');
  let s = src;
  // every version tag already there
  s = s.replace(/([?&])v=\d{8}-[A-Za-z0-9_-]+/g, `$1v=${tag}`);
  if (file.endsWith('.html')) {
    // <script src> / <link href> of local files without one
    s = s.replace(/\b(src|href)="([^"?#]+)"/g, (m, attr, url) => (LOCAL.test(url) ? `${attr}="${url}?v=${tag}"` : m));
  } else {
    // relative module specifiers without one: from './x.mjs' / import('./x.mjs') / import './x.mjs'
    s = s.replace(/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"?]+\.m?js)\2/g, (m, pre, q, url) => `${pre}${q}${url}?v=${tag}${q}`);
  }
  if (s !== src) { fs.writeFileSync(file, s); changed++; }
}
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify({ tag, files: changed }));
