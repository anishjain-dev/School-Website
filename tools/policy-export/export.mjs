// Policy PDF export (WA-13): print CSS is the single styling source — the
// PDF IS the printed policy page, so web and document can never drift.
// Emits artifacts/policies/<slug>-v<version>.pdf (artifacts/ is gitignored;
// exports ship as deploy assets or attachments, never git objects).
// Run: pnpm build && pnpm export:policies
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serveDist } from '../../scripts/lib/serve-dist.mjs';

const DIST = 'sites/group/dist';
const OUT = 'artifacts/policies';

function findPolicyPages(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findPolicyPages(full, `${prefix}/${name}`));
    else if (name === 'index.html' && prefix) out.push(prefix);
  }
  return out;
}

const policiesRoot = join(DIST, 'policies');
if (!existsSync(policiesRoot)) {
  console.error('export: no policies in dist — run `pnpm build` first');
  process.exit(1);
}
const pages = findPolicyPages(policiesRoot);
mkdirSync(OUT, { recursive: true });

const { port, close } = await serveDist(DIST);
const browser = await chromium.launch();
const page = await browser.newPage();

for (const p of pages) {
  const url = `http://127.0.0.1:${port}/policies${p}/`;
  await page.goto(url, { waitUntil: 'load' });
  const html = readFileSync(join(policiesRoot, p.slice(1), 'index.html'), 'utf8');
  const version = html.match(/Version<\/dt><dd[^>]*>([^<]+)/)?.[1]?.trim() ?? 'x';
  const slug = p.split('/').filter(Boolean).join('-');
  const file = join(OUT, `${slug}-v${version}.pdf`);
  await page.pdf({ path: file, format: 'A4', printBackground: true });
  console.log(`export: ${file}`);
}

await browser.close();
close();
console.log(`export: ${pages.length} policy PDF(s) in ${OUT}`);
