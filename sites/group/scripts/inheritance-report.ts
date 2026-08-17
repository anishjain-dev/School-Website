// Standalone drift report (`pnpm report`) — answers "which campuses have
// their own admissions page?" in about a second, no Astro build needed.
// Reads content/ from disk through the SAME resolver the build uses.
// Usage: pnpm report [--json path]
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { resolveMatrix, buildReport, formatReport, type PageRef, type CampusRef } from '../src/lib/resolve';

const CONTENT = join(import.meta.dirname, '../../../content');

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

const toId = (base: string, file: string) =>
  relative(base, file).replace(/\\/g, '/').replace(/\.(md|mdoc)$/, '');

function pageRef(base: string, file: string): PageRef {
  const fm = matter(readFileSync(file, 'utf8')).data as Record<string, unknown>;
  return {
    id: toId(base, file),
    scope: fm.scope === 'group-only' ? 'group-only' : 'inheritable',
    draft: fm.draft === true,
  };
}

const groupBase = join(CONTENT, 'group');
const group = walk(groupBase, ['.md', '.mdoc']).map((f) => pageRef(groupBase, f));

const campusesBase = join(CONTENT, 'campuses');
const campuses: CampusRef[] = [];
const campusPages = new Map<string, PageRef[]>();
for (const configPath of walk(campusesBase, ['_campus.yaml'])) {
  const data = parseYaml(readFileSync(configPath, 'utf8'));
  const slug = data.slug as string;
  campuses.push({
    slug,
    inherit: { mode: 'all', exclude: [], include: [], ...(data.inherit ?? {}) },
  });
  const campusDir = dirname(configPath);
  const pages = walk(campusDir, ['.md', '.mdoc'])
    .filter((f) => !relative(campusDir, f).replace(/\\/g, '/').startsWith('programmes/'))
    .map((f) => pageRef(campusDir, f));
  campusPages.set(slug, pages);
}

const result = resolveMatrix(group, campusPages, campuses);
if (result.errors.length) {
  console.error('resolution errors:');
  for (const e of result.errors) console.error(`  ${e}`);
  process.exit(1);
}

const report = buildReport(result, group, campuses, campusPages);
console.log(formatReport(report));
console.log(`\n  total routes: ${result.pages.length}`);

const jsonFlag = process.argv.indexOf('--json');
if (jsonFlag !== -1) {
  const out = process.argv[jsonFlag + 1] ?? join(import.meta.dirname, '../../../artifacts/inheritance-report.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));
  console.log(`  written: ${out}`);
}
