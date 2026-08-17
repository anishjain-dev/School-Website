// Correct the published placements dataset in place: remove the one institution name that carries
// a student achievement, retract the coordinates the legacy geocoder invented, and replace the
// "Europe" placeholder with real countries.
import fs from 'node:fs';
import YAML from 'file:///C:/dev/fountainhead-web/node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/index.js';

const ROOT = 'C:/dev/fountainhead-web';
const INST = `${ROOT}/content/placements/institutions.yaml`;

const BOX = {
  India: [6, 36, 68, 98], USA: [18, 72, -172, -66], UK: [49, 61, -9, 2], Canada: [41, 84, -142, -52],
  'United Arab Emirates': [22, 27, 51, 57], Australia: [-44, -9, 112, 154], Singapore: [1, 1.6, 103, 104.2],
  Germany: [47, 55.2, 5.8, 15.1], 'New Zealand': [-48, -33, 165, 179], Thailand: [5, 21, 97, 106],
  Netherlands: [50.7, 53.7, 3.3, 7.3], Grenada: [11.9, 12.4, -61.9, -61.5], China: [18, 54, 73, 135],
  France: [41, 51.2, -5.2, 9.6], Switzerland: [45.8, 47.9, 5.9, 10.6], Ireland: [51.4, 55.4, -10.6, -5.9],
  Finland: [59.7, 70.1, 20.5, 31.6],
};
const EUROPE_FIX = {
  "3is - International Institute De L'image Et Du Son": 'France',
  'B.H.M.S. Business & Hotel Management School': 'Switzerland',
  'Cork Institute of technology': 'Ireland',
  'Delft University of Technology': 'Netherlands',
  'EHL Hospitality Business School': 'Switzerland',
  'KEDGE Business School - Campus Paris': 'France',
  'Paris School Of Business': 'France',
  'Tilburg University': 'Netherlands',
  'Toulouse Business School': 'France',
  'Turku University of Applied Sciences': 'Finland',
};
const FALLBACK = { lat: 21.1702401, lng: 72.8310607 };
const isFallback = (c) => Math.abs(c.lat - FALLBACK.lat) < 1e-6 && Math.abs(c.lng - FALLBACK.lng) < 1e-6;
const looksSurat = (city) => /su[ar]{2}t/i.test(city ?? '');
const collapse = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const ACHIEVEMENT = /\b(air|rank|percentile|topper)\b|\d{2,3}\s*%/i;

const doc = YAML.parse(fs.readFileSync(INST, 'utf8'));
const log = { renamedIds: {}, cleanedNames: 0, retracted: 0, europe: 0, aliasesDropped: 0 };

// 1. The leak. "IIT Bombay \nUCEED 2023 - AIR 9" names one identifiable student in a file that
//    feeds a public website. Its id changes too, so every reference has to follow.
const RENAME_ID = { 'iit-bombay-uceed-2023-air-9': 'iit-bombay' };
const RENAME_NAME = { 'IIT Bombay \nUCEED 2023 - AIR 9': 'IIT Bombay' };

const retract = (row, country, label) => {
  if (!row.coordinates) return;
  const { lat, lng } = row.coordinates;
  const badFallback = isFallback(row.coordinates) && !looksSurat(row.city);
  const b = BOX[country];
  const outside = b && (lat < b[0] || lat > b[1] || lng < b[2] || lng > b[3]);
  if (badFallback || outside) {
    delete row.coordinates;
    log.retracted += 1;
    console.log(`  retracted ${lat.toFixed(4)}, ${lng.toFixed(4)} from ${label} (${row.city}, ${country}) — ${badFallback ? "the school's own point in Surat" : `not in ${country}`}`);
  }
};

for (const inst of doc.institutions) {
  if (RENAME_NAME[inst.name]) {
    console.log(`  renamed ${JSON.stringify(inst.name)} -> ${JSON.stringify(RENAME_NAME[inst.name])}`);
    inst.name = RENAME_NAME[inst.name];
  }
  if (RENAME_ID[inst.id]) {
    log.renamedIds[inst.id] = RENAME_ID[inst.id];
    inst.id = RENAME_ID[inst.id];
  }
  const clean = collapse(inst.name);
  if (clean !== inst.name) { inst.name = clean; log.cleanedNames += 1; }
  if (ACHIEVEMENT.test(inst.name)) throw new Error(`achievement survived: ${inst.name}`);

  if (inst.country === 'Europe') {
    const fixed = EUROPE_FIX[inst.name];
    if (!fixed) throw new Error(`unresolved Europe row: ${inst.name}`);
    inst.country = fixed;
    log.europe += 1;
  }

  if (inst.aliases) {
    const before = inst.aliases.length;
    inst.aliases = [...new Set(inst.aliases.map(collapse).filter((a) => a && !ACHIEVEMENT.test(a)))].sort();
    log.aliasesDropped += before - inst.aliases.length;
  }

  retract(inst, inst.country, inst.name);
  for (const u of inst.units ?? []) {
    u.name = collapse(u.name);
    retract(u, inst.country, `${inst.name} — ${u.name}`);
  }
}

// The header dates are strings in the content schema; YAML would otherwise re-serialise the bare
// 2026-07-27 as a date scalar and fail validation on the next build.
for (const k of ['generatedAt', 'source']) if (doc[k] != null) doc[k] = String(doc[k]);
let outText = YAML.stringify(doc, { lineWidth: 0 });
outText = outText.replace(/^generatedAt: (\d{4}-\d{2}-\d{2})$/m, 'generatedAt: "$1"');
fs.writeFileSync(INST, outText);

// 2. Follow the renamed ids into every cohort file.
let refFixes = 0;
for (const f of fs.readdirSync(`${ROOT}/content/placements/cohorts`)) {
  const p = `${ROOT}/content/placements/cohorts/${f}`;
  let text = fs.readFileSync(p, 'utf8');
  const before = text;
  for (const [from, to] of Object.entries(log.renamedIds)) {
    text = text.replaceAll(`institution: "${from}"`, `institution: "${to}"`);
  }
  if (text !== before) { fs.writeFileSync(p, text); refFixes += 1; console.log(`  updated references in ${f}`); }
}

console.log(`\nnames cleaned ${log.cleanedNames} · aliases dropped ${log.aliasesDropped} · coordinates retracted ${log.retracted} · Europe rows resolved ${log.europe} · cohort files updated ${refFixes}`);

// 3. Every institution referenced by a cohort must still exist.
const ids = new Set(doc.institutions.map((i) => i.id));
let dangling = 0;
for (const f of fs.readdirSync(`${ROOT}/content/placements/cohorts`)) {
  const text = fs.readFileSync(`${ROOT}/content/placements/cohorts/${f}`, 'utf8');
  for (const m of text.matchAll(/institution: "([^"]+)"/g)) {
    if (!ids.has(m[1])) { console.log(`  DANGLING ${m[1]} in ${f}`); dangling += 1; }
  }
}
console.log(dangling === 0 ? 'every cohort reference resolves' : `${dangling} DANGLING REFERENCES`);
if (dangling) process.exitCode = 1;
