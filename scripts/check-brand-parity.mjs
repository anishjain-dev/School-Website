// Brand-parity proof (DoD #3): the four built styleguide token pages must be
// byte-identical after brand identifiers are normalised away — i.e. switching
// brand changes ONLY the data-brand attribute and label text, never the
// markup. A divergence means a component branched on brand, which is exactly
// what the token architecture forbids. Requires a prior `pnpm build`.
import { readFileSync, existsSync } from 'node:fs';

const DIST = 'sites/group/dist/styleguide';
const BRANDS = ['fountainhead', 'fwgs', 'falh', 'fasv'];
const LABELS = ['FALH (placeholder)', 'FASV (placeholder)', 'Fountainhead', 'FWGS', 'FALH', 'FASV'];

function normalise(html) {
  let out = html;
  for (const label of LABELS) out = out.replaceAll(label, '·');
  for (const slug of BRANDS) out = out.replaceAll(new RegExp(slug, 'gi'), '·');
  return out;
}

const pages = BRANDS.map((b) => `${DIST}/${b}/tokens/index.html`);
const missing = pages.filter((p) => !existsSync(p));
if (missing.length) {
  console.error(`brand parity: FAIL — run \`pnpm build\` first; missing:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const [reference, ...rest] = pages.map((p) => normalise(readFileSync(p, 'utf8')));
const diverged = rest
  .map((html, i) => (html === reference ? null : BRANDS[i + 1]))
  .filter(Boolean);

if (diverged.length) {
  console.error(`brand parity: FAIL — markup diverges from ${BRANDS[0]} for: ${diverged.join(', ')}`);
  console.error('Components must not branch on brand; only [data-brand] token re-maps may differ.');
  process.exit(1);
}
console.log(`brand parity: ok (${BRANDS.length} styleguide pages identical modulo brand identifiers)`);
