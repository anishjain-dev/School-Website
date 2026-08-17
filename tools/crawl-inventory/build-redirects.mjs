// Generates sites/group/public/_redirects from the human-reviewed mapping
// (WA-25: generated, never hand-edited — the pre-push hook enforces it).
// The FULL map is a September (.org cutover) deliverable; the mechanism
// ships now. Usage: node build-redirects.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRedirects } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const mapPath = join(HERE, 'data', 'redirect-map.csv');
const outPath = join(HERE, '../../sites/group/public/_redirects');

const body = buildRedirects(readFileSync(mapPath, 'utf8'));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, body);
console.log(`redirects: ${body.trim().split('\n').length - 1} rules → sites/group/public/_redirects`);
console.log('note: commits touching _redirects need "redirect-map-regen" in the message (pre-push guard).');
