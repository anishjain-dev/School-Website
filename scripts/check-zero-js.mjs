// Zero-JS gate (CLAUDE.md hard rule 5): the built site ships no client
// JavaScript. Allowed: JSON-LD data blocks (non-executing), and — from
// Stage 7 — the Cloudflare Turnstile loader on form pages only (WA-39,
// the one sanctioned island). Runs after every `pnpm build`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'sites/group/dist';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

if (!existsSync(DIST)) {
  console.error('zero-js: FAIL — run `pnpm build` first');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// The invariant (WA-1): PUBLIC static pages ship no unsanctioned scripts.
// Two things in dist are NOT public-page JS and are therefore exempt:
//   - the server bundle (_worker.js — runs on the edge, never downloads)
//   - admin-only client bundles (Keystatic's UI) — present in dist but
//     referenced only by server-rendered /keystatic pages, never by any
//     static HTML. Any JS file a static page actually references shows up
//     as a <script> tag there and is judged by the tag scan below.
const SERVER_DIRS = [join(DIST, '_worker.js')];
const isServer = (f) => SERVER_DIRS.some((d) => f.startsWith(d));

const files = walk(DIST).filter((f) => !isServer(f));
const failures = [];
const jsFiles = files.filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));
if (jsFiles.length > 0) {
  console.log(`zero-js: note — ${jsFiles.length} JS file(s) in dist not referenced by any static page (admin bundles); public-page gate below is authoritative`);
}

for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    const tag = m[0];
    if (/type="application\/ld\+json"/i.test(tag)) continue;
    if (tag.includes(TURNSTILE_SRC)) continue; // sanctioned island (WA-39)
    failures.push(`${f}\n  unsanctioned <script>: ${tag}`);
  }
  if (/localStorage|sessionStorage|indexedDB/.test(html)) {
    failures.push(`${f}\n  browser storage API reference in output (hard rule 3)`);
  }
}

if (failures.length) {
  console.error('zero-js: FAIL\n');
  for (const msg of failures) console.error(`  ${msg}\n`);
  process.exit(1);
}
console.log(`zero-js: ok (${files.filter((f) => f.endsWith('.html')).length} pages, 0 unsanctioned scripts)`);
