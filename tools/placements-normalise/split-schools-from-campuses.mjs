// One-time reclassification of institution "units" (WA-51, VK 2026-07-27).
//
// The reference had conflated two different things under one `units` array:
//
//   a CAMPUS is a PLACE. Rutgers New Brunswick is not Rutgers Newark; a student who went to one did
//     not go to the other. It earns its own record, its own map bubble and its own country column.
//   a SCHOOL is part of the COURSE. Anil Surendra Modi School of Commerce is inside NMIMS Mumbai.
//     The student went to Mumbai either way, so it must not be a second place — but which school
//     they attended is real counselling signal, so it moves onto the placement as `school` rather
//     than being deleted.
//
// VK's test is geography, not corporate structure: same place => one record. Applied by hand per
// unit below rather than by comparing the `city` field, because that field is demonstrably wrong —
// UToronto Mississauga is filed as "Toronto", NMIMS Navi Mumbai as "Mumbai", and NMIMS's Mukesh
// Patel school as "Hyderabad" when its own coordinates are Mumbai.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , ROOT, YAML_MODULE] = process.argv;
if (!ROOT || !YAML_MODULE) {
  console.error('usage: node split-schools-from-campuses.mjs <repo root> <path to a yaml module>');
  process.exit(2);
}
const YAML = (await import(pathToFileURL(YAML_MODULE).href)).default;
const INST = path.join(ROOT, 'content/placements/institutions.yaml');
const COHORTS = path.join(ROOT, 'content/placements/cohorts');

// SCHOOL   -> becomes `school` on the placement; the unit record goes away.
// PARENT   -> the unit is just the parent campus under another name; the placement loses its unit.
// CAMPUS   -> a genuinely different place; stays a unit.
const VERDICT = {
  // NMIMS, Mumbai. Everything below is the Vile Parle campus except Navi Mumbai.
  'narsee-monjee-institute-of-management-studies-nmims-balwant-': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-kirit-p-': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-anil-sur': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-school-o': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-pravin-d': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-centre-f': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-sarla-an': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-jyoti-da': 'SCHOOL',
  // Filed as "Hyderabad" but its own coordinates are Mumbai (Vile Parle). Treated as a school of
  // the Mumbai campus — flagged for Ritu, since NMIMS does also run a Hyderabad campus.
  'narsee-monjee-institute-of-management-studies-nmims-mukesh-p': 'SCHOOL',
  'narsee-monjee-institute-of-management-studies-nmims-mumbai': 'PARENT',
  // A genuinely different city, whatever the city field says.
  'narsee-monjee-institute-of-management-studies-nmims-navi-mum': 'CAMPUS',

  'nirma-university-institute-of-law': 'SCHOOL',
  'nirma-university-institute-of-technology': 'SCHOOL',

  // Penn State. NB the PARENT record's city is "Erie", which is wrong for Penn State as a whole —
  // left alone here because renaming the brand is a separate decision.
  'pennsylvania-state-university-erie-the-behrend-college': 'PARENT',
  'pennsylvania-state-university-university-park': 'CAMPUS',
  'pennsylvania-state-university-smeal-college-of-business': 'SCHOOL',
  'pennsylvania-state-university-berks': 'CAMPUS',
  'pennsylvania-state-university-scranton': 'CAMPUS',

  'rutgers-university-newark': 'PARENT',
  'rutgers-university-new-brunswick': 'CAMPUS',
  'rutgers-university-camden': 'CAMPUS',

  // Symbiosis, all Pune.
  'symbiosis-international-university-symbiosis-school-of-liber': 'SCHOOL',
  'symbiosis-international-university-symbiosis-institute-of-co': 'SCHOOL',
  'symbiosis-international-university-symbiosis-centre-for-mana': 'SCHOOL',
  'symbiosis-international-university-symbiosis-school-of-econo': 'SCHOOL',
  'symbiosis-international-university-symbiosis-school-of-culin': 'SCHOOL',
  'symbiosis-international-university-symbiosis-law-school-pune': 'SCHOOL',
  'symbiosis-international-university-symbiosis-school-of-sport': 'SCHOOL',
  // SSPU is a separate university, not a Symbiosis International school. Kept as a school for now
  // so no count moves silently; flagged below for Ritu to split out properly.
  'symbiosis-international-university-symbiosis-skills-and-prof': 'SCHOOL',

  'university-of-british-columbia-okanagan': 'CAMPUS',

  'university-of-massachusetts-amherst': 'PARENT',
  'university-of-massachusetts-lowell': 'CAMPUS',
  'university-of-massachusetts-boston': 'CAMPUS',

  'university-of-toronto-st-george-downtown': 'PARENT',
  // ~20 km from St George and a different city, exactly like NMIMS Navi Mumbai.
  'university-of-toronto-mississauga': 'CAMPUS',
};

const FLAG = {
  'narsee-monjee-institute-of-management-studies-nmims-mukesh-p':
    'city field said Hyderabad, coordinates said Mumbai — treated as a Mumbai school; NMIMS does also run a Hyderabad campus',
  'symbiosis-international-university-symbiosis-skills-and-prof':
    'Symbiosis Skills & Professional University is a separate university, not a Symbiosis International school — should probably become its own top-level record',
};

const quoteDates = (text) => text.replace(/^generatedAt: (\d{4}-\d{2}-\d{2})$/m, 'generatedAt: "$1"');

const doc = YAML.parse(fs.readFileSync(INST, 'utf8'));
const unitName = new Map();
for (const i of doc.institutions) for (const u of i.units ?? []) unitName.set(u.id, u.name);

for (const id of unitName.keys()) {
  if (!VERDICT[id]) throw new Error(`no verdict for unit ${id} — every unit must be classified by hand`);
}

// --- rewrite the cohort placements ------------------------------------------------------------
const tally = { SCHOOL: 0, PARENT: 0, CAMPUS: 0 };
let before = 0;
let after = 0;
for (const f of fs.readdirSync(COHORTS)) {
  const p = path.join(COHORTS, f);
  const d = YAML.parse(fs.readFileSync(p, 'utf8'));
  let touched = false;
  for (const row of d.placements ?? []) {
    before += row.count ?? 0;
    if (!row.unit) continue;
    const v = VERDICT[row.unit];
    if (v === 'SCHOOL') {
      row.school = unitName.get(row.unit);
      delete row.unit;
      tally.SCHOOL += row.count ?? 0;
      touched = true;
    } else if (v === 'PARENT') {
      delete row.unit;
      tally.PARENT += row.count ?? 0;
      touched = true;
    } else {
      tally.CAMPUS += row.count ?? 0;
    }
  }
  for (const row of d.placements ?? []) after += row.count ?? 0;
  // `generatedAt` is a STRING in the content schema; YAML would otherwise re-serialise the bare
  // 2026-07-27 as a date scalar and fail validation on the next build.
  if (touched) fs.writeFileSync(p, quoteDates(YAML.stringify(d, { lineWidth: 0 })));
}
if (before !== after) throw new Error(`student total changed: ${before} -> ${after}`);

// --- drop the non-campus units from the reference ----------------------------------------------
let removed = 0;
for (const i of doc.institutions) {
  if (!i.units?.length) continue;
  const keep = i.units.filter((u) => VERDICT[u.id] === 'CAMPUS');
  removed += i.units.length - keep.length;
  i.units = keep;
}
for (const k of ['generatedAt', 'source']) if (doc[k] != null) doc[k] = String(doc[k]);
fs.writeFileSync(INST, quoteDates(YAML.stringify(doc, { lineWidth: 0 })));

// --- verify ------------------------------------------------------------------------------------
const ids = new Set(doc.institutions.flatMap((i) => (i.units ?? []).map((u) => u.id)));
let dangling = 0;
for (const f of fs.readdirSync(COHORTS)) {
  const d = YAML.parse(fs.readFileSync(path.join(COHORTS, f), 'utf8'));
  for (const row of d.placements ?? []) if (row.unit && !ids.has(row.unit)) { console.log(`  DANGLING unit ${row.unit} in ${f}`); dangling += 1; }
}

console.log(`units removed from the reference: ${removed} · campuses kept: ${ids.size}`);
console.log(`students by verdict — moved to school detail: ${tally.SCHOOL} · folded into parent: ${tally.PARENT} · stayed on a campus: ${tally.CAMPUS}`);
console.log(`student total unchanged at ${before}`);
console.log(dangling === 0 ? 'every remaining unit reference resolves' : `${dangling} DANGLING`);
console.log('\nflagged for review:');
for (const [id, why] of Object.entries(FLAG)) console.log(`  ${unitName.get(id) ?? id}: ${why}`);
if (dangling) process.exitCode = 1;
