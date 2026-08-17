// Join the inventory against a Google Search Console Performance→Pages
// export (DoD 6). VK supplies the export (Search Console → Performance →
// Pages → Export CSV, 16-month window) as data/gsc-pages.csv.
// Usage: node join-gsc.mjs [path-to-gsc-export.csv]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { joinGsc, toCsv } from './lib.mjs';

const DATA = join(dirname(fileURLToPath(import.meta.url)), 'data');
const gscPath = process.argv[2] ?? join(DATA, 'gsc-pages.csv');

if (!existsSync(gscPath)) {
  console.error(`join: ${gscPath} not found.`);
  console.error('Export it from Search Console → Performance → Pages → Export (CSV), then re-run.');
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(join(DATA, 'inventory.json'), 'utf8')).rows;
const { joined, gscOnly } = joinGsc(inventory, readFileSync(gscPath, 'utf8'));

const COLUMNS = ['url', 'impressions', 'clicks', 'ctr', 'position', 'status', 'depth', 'source', 'title'];
writeFileSync(join(DATA, 'inventory-joined.csv'), toCsv(joined, COLUMNS));
writeFileSync(join(DATA, 'gsc-only.csv'), toCsv(gscOnly, ['url', 'impressions', 'clicks', 'ctr', 'position']));

console.log(`join: ${joined.length} inventory rows joined → data/inventory-joined.csv`);
console.log(`join: ${gscOnly.length} GSC-only URLs (indexed but not crawled — these MUST get redirects) → data/gsc-only.csv`);
console.log('\ntop 10 by impressions:');
for (const r of joined.slice(0, 10)) console.log(`  ${String(r.impressions).padStart(8)}  ${r.url}`);
