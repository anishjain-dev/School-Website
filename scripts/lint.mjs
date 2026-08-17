// Repo-wide lint: the same rules the .githooks scripts enforce on staged
// files, applied to every tracked file. Hooks catch the commit; this catches
// anything that slipped past (merge, --no-verify, another machine).
//
// Rule 1 (CLAUDE.md): no binary media in git — WA-36/WA-41.
// Rule 2 (CLAUDE.md): no hardcoded brand values outside packages/tokens/.
// Rule 3 (CLAUDE.md): no browser storage APIs.
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const BLOCKED_EXT = /\.(jpg|jpeg|png|gif|webp|avif|bmp|tiff|heic|mp4|mov|avi|webm|mkv|mp3|wav|m4a)$/i;
// Rule 1 exists to stop a PHOTOGRAPH OF A PERSON entering permanent history: git keeps it in every
// clone after consent is withdrawn, which is what WA-36/WA-41 forbid. An institution's own crest is
// not that — there is no data subject, no consent to withdraw, and the mark is published by the
// university precisely to be reproduced. So `<site>/public/logos/` is a NARROW, DELIBERATE carve-out
// (VK, 2026-07-29), not a softening of the rule: the size ceiling below still applies to every file
// in it, and nothing here permits a photograph. Anything depicting a person still belongs in
// Cloudflare Images behind the WA-38 child gate, wherever it lives.
const BINARY_ALLOW_DIR = /^(packages\/ui\/src\/icons\/|public\/favicon|docs\/|sites\/[^/]+\/public\/logos\/)/;
const MAX_BINARY_BYTES = 51200; // 50KB — inline SVG and favicons only

const CODE_EXT = /\.(astro|css|ts|tsx|jsx|svelte|vue)$/;
const CODE_SCAN = /^(packages\/ui\/|sites\/)/;
const CODE_ALLOW = /^packages\/tokens\//;
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\([0-9]|hsla?\([0-9]/i;
const BROWSER_STORAGE = /localStorage|sessionStorage|indexedDB/;

const files = execSync('git ls-files -z', { encoding: 'utf8' }).split('\0').filter(Boolean);
const failures = [];

function looksBinary(path) {
  const buf = readFileSync(path);
  const probe = buf.subarray(0, 8192);
  return probe.includes(0);
}

for (const f of files) {
  // The allow-list is consulted BEFORE the extension check, or an exempt directory could never
  // hold a .png at all and the carve-out above would be dead code.
  const binaryExempt = BINARY_ALLOW_DIR.test(f);
  if (BLOCKED_EXT.test(f) && !binaryExempt) {
    failures.push(`${f}\n  binary media must not enter git (hard rule 1) — use Cloudflare Images and reference by ID`);
    continue;
  }
  if (!binaryExempt) {
    try {
      const size = statSync(f).size;
      if (size > MAX_BINARY_BYTES && looksBinary(f)) {
        failures.push(`${f}\n  large binary (${size} bytes) — if this is media it belongs in Cloudflare (hard rule 1)`);
        continue;
      }
    } catch {
      continue; // deleted from working tree but still tracked — nothing to scan
    }
  }

  if (CODE_EXT.test(f) && CODE_SCAN.test(f) && !CODE_ALLOW.test(f)) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (COLOUR_LITERAL.test(line)) {
        failures.push(`${f}:${i + 1}\n  colour literal — use var(--...); literals belong only in packages/tokens/brands/ (hard rule 2)`);
      }
      if (BROWSER_STORAGE.test(line)) {
        failures.push(`${f}:${i + 1}\n  browser storage API — not permitted (hard rule 3)`);
      }
    });
  }
}

if (failures.length > 0) {
  console.error('lint: FAIL\n');
  for (const msg of failures) console.error(`  ${msg}\n`);
  process.exit(1);
}
console.log(`lint: ok (${files.length} tracked files)`);
