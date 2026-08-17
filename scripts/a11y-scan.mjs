// WCAG 2.1 AA scan (WA-21): axe-core against the BUILT pages, one per
// template, via headless Chromium. Fails on any violation. Run:
//   pnpm build && pnpm a11y
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { serveDist } from './lib/serve-dist.mjs';

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');

// One representative page per template (brief §7).
const PAGES = [
  '/', // 1 group home
  '/kunkni/', // 2 campus home
  '/kunkni/philosophy/', // 3 content (inherited)
  '/academics/pyp/', // 4 programme
  '/policies/school/uniform-policy/', // 5 policy
  '/kunkni/admissions/', // 6 admissions
  '/kunkni/staff/', // 7 staff directory
  '/kunkni/calendar/', // 8 calendar
  '/news/', // 9a news index
  '/galleries/', // 10a gallery index
  '/falh/programmes/', // 11a catalogue index
  '/falh/programmes/robotics-explorers/', // 11b catalogue detail
  '/kunkni/contact/', // 12 contact + form
  '/fasv/', // 14 landing
  '/adajan/', // 15 early years (WA-47) — also covers the two-level nav disclosure
];

const { port, close } = await serveDist('sites/group/dist');
const browser = await chromium.launch();
const page = await browser.newPage();

let totalViolations = 0;
for (const path of PAGES) {
  const res = await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load' });
  if (!res || res.status() !== 200) {
    console.error(`a11y: ${path} — HTTP ${res?.status() ?? 'no response'}`);
    totalViolations++;
    continue;
  }
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(() =>
    // eslint-disable-next-line no-undef
    axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }),
  );
  if (result.violations.length === 0) {
    console.log(`a11y: ok    ${path}`);
  } else {
    for (const v of result.violations) {
      totalViolations++;
      console.error(`a11y: FAIL  ${path} — [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
      for (const n of v.nodes.slice(0, 3)) console.error(`        ${n.target.join(' ')}`);
    }
  }
}

await browser.close();
close();

if (totalViolations > 0) {
  console.error(`\na11y: ${totalViolations} violation groups across ${PAGES.length} pages`);
  process.exit(1);
}
console.log(`\na11y: all ${PAGES.length} template pages pass WCAG 2.1 A/AA (axe-core)`);
