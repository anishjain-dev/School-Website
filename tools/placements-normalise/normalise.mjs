#!/usr/bin/env node
// Placements normaliser (WA-43) — the ONE-TIME legacy import.
//
//   node tools/placements-normalise/normalise.mjs <path-to.xlsx> [--write]
//
// Reads the legacy "FS students placements data for awesome tables" workbook
// and emits the de-identified content-tier dataset. Without --write it reports
// only, so the merge decisions can be reviewed before anything lands.
//
// THE SOURCE WORKBOOK MUST NEVER ENTER THIS REPO. It carries student names,
// FSK IDs, photo URLs, Grade 10/12 finals and scholarship amounts. Git history
// is permanent (hard rule 1) — a committed copy would survive consent
// withdrawal in every clone forever. Pass a path from outside the repo.
//
// What is dropped, deliberately and by construction (WA-45): Student, FSK ID,
// Directory, Picture, Grade 10 Final Grade, Grade 12 Final Grade, per-student
// Scholarship, per-student coordinates. The output shape has nowhere to put
// them — see packages/content-schema/src/placements.ts.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { HIERARCHY, ALIASES, NON_UNIVERSITY, CLUSTER_MAP } from './hierarchy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const OUT = join(REPO, 'content', 'placements');
const SHEET = 'Student Placement Data';
const SOURCE_LABEL = 'legacy placements workbook, normalised once (WA-43)';

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const xlsxPath = argv.find((a) => !a.startsWith('--'));
if (!xlsxPath) {
  console.error('usage: normalise.mjs <path-to.xlsx> [--write]');
  process.exit(1);
}
if (xlsxPath.replace(/\\/g, '/').includes('/content/') || xlsxPath.startsWith(REPO)) {
  console.error('refusing: the source workbook must live OUTSIDE the repo (hard rule 1).');
  process.exit(1);
}

const norm = (s) => String(s ?? '').trim();
const lc = (s) => norm(s).toLowerCase().replace(/\s+/g, ' ');
const slug = (s) =>
  lc(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ---- read -------------------------------------------------------------------
const wb = XLSX.read(readFileSync(xlsxPath), { type: 'buffer' });
if (!wb.SheetNames.includes(SHEET)) {
  console.error(`refusing: no "${SHEET}" tab — is this the right workbook?`);
  process.exit(1);
}
const raw = XLSX.utils.sheet_to_json(wb.Sheets[SHEET], { header: 1, defval: '' });
const header = raw[0].map(norm);
const col = Object.fromEntries(header.map((h, n) => [h, n]));
// Row 2 is the Awesome Tables directive row (StringFilter / MapsLat / Hidden…).
const rows = raw.slice(2).filter((r) => norm(r[col['Student']]) !== '');
const get = (r, name) => norm(r[col[name]]);

// ---- classify ---------------------------------------------------------------
const flags = {
  unmappedCluster: new Map(),
  noCoordinates: new Set(),
  noCountry: [],
  noCohort: [],
  // A raw name that matched a parent brand but none of its known schools, while
  // still carrying extra words — i.e. it names a school we have not mapped.
  // Folding it silently into the parent would quietly lose a real destination,
  // so it is surfaced for review instead (WA-43: validate and flag).
  unmappedUnit: new Map(),
};

function classifyOutcome(name) {
  const n = lc(name);
  for (const [outcome, pats] of Object.entries(NON_UNIVERSITY)) {
    if (pats.some((p) => n === p || n.startsWith(p))) return outcome;
  }
  return null;
}

function resolveInstitution(rawName) {
  const n = lc(rawName);
  for (const h of HIERARCHY) {
    const hitsParent = h.parentMatch.some((p) => n.includes(p));
    if (!hitsParent) continue;
    const unit = h.units.find((u) => u.match.some((m) => n.includes(lc(m))));
    if (!unit) {
      // Does the raw name carry words beyond the brand itself?
      const brandHit = h.parentMatch.find((p) => n.includes(p)) ?? '';
      const remainder = n.replace(brandHit, '').replace(/[^a-z0-9]+/g, ' ').trim();
      const filler = /^((the )?university( of)?|international( deemed university)?|deemed(( to be)? university)?|india|mumbai|pune|)$/;
      if (remainder && !filler.test(remainder)) {
        flags.unmappedUnit.set(rawName, (flags.unmappedUnit.get(rawName) ?? 0) + 1);
      }
    }
    return { parent: h.parent, country: h.country, unit: unit ? unit.name : null };
  }
  for (const [canonical, variants] of Object.entries(ALIASES)) {
    if (variants.some((v) => n === lc(v))) return { parent: canonical, unit: null };
  }
  return { parent: norm(rawName), unit: null };
}

function resolveCluster(rawCluster, placementName) {
  if (classifyOutcome(placementName) === 'gap-year') return 'gap-year';
  const key = lc(rawCluster);
  if (CLUSTER_MAP[key]) return CLUSTER_MAP[key];
  for (const [k, v] of Object.entries(CLUSTER_MAP)) if (key.startsWith(k.slice(0, 24))) return v;
  if (rawCluster) flags.unmappedCluster.set(rawCluster, (flags.unmappedCluster.get(rawCluster) ?? 0) + 1);
  return null;
}

// ---- build ------------------------------------------------------------------
const institutions = new Map(); // parent -> record
const cohorts = new Map(); // year -> { placements: Map, other: Map, size }

for (const r of rows) {
  const yearRaw = get(r, 'Class of').replace(/\.0$/, '');
  const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  if (!year) { flags.noCohort.push(get(r, 'Final Placement')); continue; }

  const placementName = get(r, 'Final Placement');
  if (!cohorts.has(year)) cohorts.set(year, { placements: new Map(), other: new Map(), size: 0 });
  const cohort = cohorts.get(year);
  cohort.size += 1;

  const outcome = classifyOutcome(placementName);
  if (outcome) {
    cohort.other.set(outcome, (cohort.other.get(outcome) ?? 0) + 1);
    continue;
  }

  const { parent, unit, country: hierCountry } = resolveInstitution(placementName);
  const parentId = slug(parent);
  const country = get(r, 'Country') || hierCountry || '';
  if (!country) flags.noCountry.push(placementName);

  if (!institutions.has(parentId)) {
    institutions.set(parentId, {
      id: parentId, name: parent, country, city: get(r, 'City') || undefined,
      state: get(r, 'State') || undefined,
      website: /^https?:\/\//.test(get(r, 'Website')) ? get(r, 'Website') : undefined,
      coordinates: undefined, units: new Map(), aliases: new Set(),
    });
  }
  const inst = institutions.get(parentId);
  inst.aliases.add(placementName);

  const lat = Number(get(r, 'Latitude')), lng = Number(get(r, 'Longitude'));
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) && get(r, 'Latitude') !== '';

  if (unit) {
    const unitId = slug(`${parent}-${unit}`);
    if (!inst.units.has(unitId)) {
      inst.units.set(unitId, {
        id: unitId, name: unit, city: get(r, 'City') || undefined,
        state: get(r, 'State') || undefined,
        country: country !== inst.country ? country : undefined,
        coordinates: hasGeo ? { lat, lng } : undefined,
      });
    } else if (hasGeo && !inst.units.get(unitId).coordinates) {
      inst.units.get(unitId).coordinates = { lat, lng };
    }
  }
  // The parent bubble sits at its primary campus — first coordinates seen.
  if (hasGeo && !inst.coordinates) inst.coordinates = { lat, lng };

  const cluster = resolveCluster(get(r, 'Clusters'), placementName);
  const key = `${parentId}|${unit ? slug(`${parent}-${unit}`) : ''}|${cluster ?? ''}`;
  const row = cohort.placements.get(key) ?? { institution: parentId, unit: unit ? slug(`${parent}-${unit}`) : undefined, cluster: cluster ?? undefined, count: 0 };
  row.count += 1;
  cohort.placements.set(key, row);
}

for (const inst of institutions.values()) {
  if (!inst.coordinates && inst.units.size === 0) flags.noCoordinates.add(inst.name);
}

// ---- report -----------------------------------------------------------------
const totalStudents = [...cohorts.values()].reduce((s, c) => s + c.size, 0);
const withUnits = [...institutions.values()].filter((i) => i.units.size > 0);
console.log(`\nSOURCE  ${xlsxPath}`);
console.log(`ROWS    ${rows.length} students across ${cohorts.size} cohorts (${totalStudents} counted)`);
console.log(`OUTPUT  ${institutions.size} institutions, of which ${withUnits.length} have campuses/schools`);
for (const i of withUnits) console.log(`          ${i.name} -> ${[...i.units.values()].map((u) => u.name).join(', ')}`);

console.log(`\nMERGED SPELLINGS (review these):`);
for (const i of institutions.values()) if (i.aliases.size > 1) console.log(`          ${i.name}  <=  ${[...i.aliases].join(' | ')}`);

console.log(`\nNEEDS ATTENTION`);
console.log(`  institutions with no coordinates : ${flags.noCoordinates.size}${flags.noCoordinates.size ? ' -> ' + [...flags.noCoordinates].join(', ') : ''}`);
console.log(`  rows with no country             : ${flags.noCountry.length}${flags.noCountry.length ? ' -> ' + [...new Set(flags.noCountry)].slice(0, 5).join(', ') : ''}`);
console.log(`  rows with no usable cohort year  : ${flags.noCohort.length}`);
console.log(`  unmapped cluster strings         : ${flags.unmappedCluster.size}`);
for (const [c, n] of flags.unmappedCluster) console.log(`          "${c}" (${n})`);
console.log(`  named schools not yet mapped     : ${flags.unmappedUnit.size} (folded to the parent brand — add to hierarchy.mjs to split them out)`);
for (const [c, n] of flags.unmappedUnit) console.log(`          "${c}" (${n})`);

// ---- write ------------------------------------------------------------------
const yaml = (v, indent = 0) => {
  const pad = ' '.repeat(indent);
  if (Array.isArray(v)) return v.length === 0 ? ' []' : '\n' + v.map((x) => `${pad}- ` + yaml(x, indent + 2).replace(/^\n/, '').replace(/^ +/, '')).join('\n');
  if (v && typeof v === 'object') return '\n' + Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${pad}${k}:` + yaml(x, indent + 2)).join('\n');
  if (typeof v === 'string') return ` ${JSON.stringify(v)}`;
  return ` ${v}`;
};

if (!WRITE) {
  console.log(`\n(report only — pass --write to emit ${OUT})\n`);
  process.exit(0);
}

const generatedAt = new Date().toISOString().slice(0, 10);
mkdirSync(join(OUT, 'cohorts'), { recursive: true });

const reference = {
  generatedAt, source: SOURCE_LABEL,
  institutions: [...institutions.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => ({ ...i, units: [...i.units.values()], aliases: [...i.aliases].sort() })),
};
writeFileSync(join(OUT, 'institutions.yaml'), yaml(reference).replace(/^\n/, '') + '\n');

for (const [year, c] of [...cohorts.entries()].sort((a, b) => a[0] - b[0])) {
  const doc = {
    year, campus: 'kunkni', programme: 'DP', cohortSize: c.size,
    generatedAt, source: SOURCE_LABEL,
    placements: [...c.placements.values()].sort((a, b) => b.count - a.count || a.institution.localeCompare(b.institution)),
    otherOutcomes: [...c.other.entries()].map(([outcome, count]) => ({ outcome, count })),
  };
  writeFileSync(join(OUT, 'cohorts', `${year}.yaml`), yaml(doc).replace(/^\n/, '') + '\n');
}
console.log(`\nwrote ${OUT}: institutions.yaml + ${cohorts.size} cohort files\n`);
