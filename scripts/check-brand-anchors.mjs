// Brand-anchor guard: the exact hex anchors are contractual (Brand
// Guidelines 2025 via the design system, and WA-6 for FWGS). An accidental
// edit to any anchor fails the build. Deliberate changes update the token
// file, PROVENANCE.md, and this list in one commit.
import { readFileSync } from 'node:fs';

const CHECKS = [
  // [file, token, exact value, must appear as `token: value`]
  ['packages/tokens/base.css', '--fh-blue-600', '#005BAA'],
  ['packages/tokens/base.css', '--fh-red-600', '#B8292F'],
  ['packages/tokens/base.css', '--fh-yellow-400', '#F2C418'],
  // WA-6 as revised 2026-07-20: every campus maps primaries to the group
  // ramp (2025 brand manuals). A literal hex here would be drift.
  ['packages/tokens/brands/fwgs.css', '--fh-color-primary', 'var(--fh-blue-600)'],
  ['packages/tokens/brands/fwgs.css', '--fh-color-secondary', 'var(--fh-red-600)'],
  ['packages/tokens/brands/falh.css', '--fh-falh-pink', '#F04C9A'],
  ['packages/tokens/brands/fasv.css', '--fh-color-primary', 'var(--fh-blue-600)'],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const failures = [];
for (const [file, token, value] of CHECKS) {
  const css = readFileSync(file, 'utf8');
  const re = new RegExp(`${escapeRe(token)}:\\s*${escapeRe(value)};`);
  if (!re.test(css)) {
    failures.push(`${file}: expected \`${token}: ${value};\` (byte-exact anchor)`);
  }
}

if (failures.length) {
  console.error('brand anchors: FAIL\n');
  for (const f of failures) console.error(`  ${f}`);
  console.error('\nIf this change is deliberate, update PROVENANCE.md and this guard in the same commit.');
  process.exit(1);
}
console.log(`brand anchors: ok (${CHECKS.length} anchors verified)`);
