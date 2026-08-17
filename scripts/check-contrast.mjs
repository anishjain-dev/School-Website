// WCAG 2.1 contrast guard for every brand (WA-21 target: AA).
// The design system gates its own palette upstream, but FWGS and the
// FALH/FASV placeholders are defined here, outside that gate — so every
// brand's declared fg/bg pairs are re-verified on every build.
import { readFileSync } from 'node:fs';

const BASE = 'packages/tokens/base.css';
const BRANDS = {
  fountainhead: 'packages/tokens/brands/fountainhead.css',
  fwgs: 'packages/tokens/brands/fwgs.css',
  falh: 'packages/tokens/brands/falh.css',
  fasv: 'packages/tokens/brands/fasv.css',
};

// [foreground, background, minimum ratio]
//   4.5 = AA normal text (1.4.3)
//   3.0 = AA non-text contrast for UI component boundaries (1.4.11)
const PAIRS = [
  ['--fh-color-text', '--fh-color-bg', 4.5],
  ['--fh-color-text', '--fh-color-surface', 4.5],
  ['--fh-color-text-muted', '--fh-color-surface', 4.5],
  ['--fh-color-text-link', '--fh-color-bg', 4.5],
  ['--fh-color-primary-fg', '--fh-color-primary', 4.5],
  ['--fh-color-primary-subtle-fg', '--fh-color-primary-subtle', 4.5],
  ['--fh-color-secondary-fg', '--fh-color-secondary', 4.5],
  ['--fh-color-accent-fg', '--fh-color-accent', 4.5],
  ['--fh-color-hero-fg', '--fh-color-hero-bg', 4.5],
  ['--fh-color-hero-cta-fg', '--fh-color-hero-cta-bg', 4.5],
  // 1.4.11: the hero CTA must stay visible as a BUTTON against the hero
  // field. FALH's yellow-on-yellow passed the 4.5 label check while the
  // button itself had no boundary at all — this is the pair that catches it.
  ['--fh-color-hero-cta-bg', '--fh-color-hero-bg', 3],
  ['--fh-color-footer-fg', '--fh-color-footer-bg', 4.5],
  ['--fh-color-eyebrow', '--fh-color-surface', 4.5],
];

function parseProps(css) {
  const props = {};
  for (const m of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) props[m[1]] = m[2].trim();
  return props;
}

function resolve(name, props, depth = 0) {
  if (depth > 10) return null;
  const value = props[name];
  if (!value) return null;
  const varMatch = value.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) return resolve(varMatch[1], props, depth + 1);
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

function luminance(hex) {
  const chan = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(1) + 0.7152 * chan(3) + 0.0722 * chan(5);
}

function contrast(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const baseProps = parseProps(readFileSync(BASE, 'utf8'));
const failures = [];
let checked = 0;

for (const [brand, file] of Object.entries(BRANDS)) {
  const props = { ...baseProps, ...parseProps(readFileSync(file, 'utf8')) };
  for (const [fgToken, bgToken, min] of PAIRS) {
    const fg = resolve(fgToken, props);
    const bg = resolve(bgToken, props);
    if (!fg || !bg) {
      failures.push(`${brand}: cannot resolve ${fgToken} on ${bgToken} to hex`);
      continue;
    }
    const ratio = contrast(fg, bg);
    checked++;
    if (ratio < min) {
      failures.push(`${brand}: ${fgToken} (${fg}) on ${bgToken} (${bg}) = ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
  }
}

if (failures.length) {
  console.error('contrast: FAIL\n');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`contrast: ok (${checked} pairs across ${Object.keys(BRANDS).length} brands, AA)`);
