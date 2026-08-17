// Inherit-with-override resolution (WA-11) — the heart of the build.
//
// A campus page request resolves: explicit campus file first, group file as
// fallback. Absence means inherit; overrides are explicit files, never
// flags. This module is a PURE function over plain data — no Astro imports —
// so the same engine drives the route matrix, the Vitest suite, and the
// drift report (`pnpm report`).
//
// Rules, in precedence order:
//   1. An explicit campus file always wins (overridden / campus-only).
//   2. `index` never inherits — a campus home is not the group home; a
//      campus without index.md is a build error.
//   3. Group pages with scope: group-only never propagate.
//   4. Campus inherit policy: all (minus exclude) | listed (include) | none.
//   5. Drafts are excluded; a DRAFT campus override falls back to the
//      published group page (a draft never unpublishes a page).
//   6. A group page id equal to a campus slug is a build error (it would
//      shadow the campus subtree).
//   7. Output is deterministically sorted; route paths are unique.

export interface PageRef {
  /** Path-relative id without extension: 'philosophy', 'academics/pyp', 'index' */
  id: string;
  scope: 'inheritable' | 'group-only';
  draft: boolean;
}

export interface CampusRef {
  slug: string;
  inherit: { mode: 'all' | 'listed' | 'none'; exclude: string[]; include: string[] };
}

export type Source = 'group' | 'inherited' | 'overridden' | 'campus-only';

export interface ResolvedPage {
  /** null = the group site itself */
  campus: string | null;
  id: string;
  source: Source;
  /** URL path, always with trailing slash: '/kunkni/academics/pyp/' */
  path: string;
  /** WA-9: exactly one canonical URL per page. Inherited pages canonicalise
   *  to the group URL; group/overridden/campus-only pages to themselves. */
  canonicalPath: string;
}

export interface ResolveResult {
  pages: ResolvedPage[];
  errors: string[];
}

function pagePath(campus: string | null, id: string): string {
  const idPart = id === 'index' ? '' : `${id}/`;
  return campus ? `/${campus}/${idPart}` : `/${idPart}`;
}

// System surfaces own these path segments (news, staff directory, etc.);
// a Tier A page claiming one would silently shadow or collide with them.
export const RESERVED_IDS = new Set([
  'news',
  'galleries',
  'staff',
  'calendar',
  'policies',
  'programmes',
  'styleguide',
  'api',
  'keystatic',
]);

export function resolveMatrix(
  group: PageRef[],
  campusPages: Map<string, PageRef[]>,
  campuses: CampusRef[],
): ResolveResult {
  const errors: string[] = [];
  const pages: ResolvedPage[] = [];
  const campusSlugs = new Set(campuses.map((c) => c.slug));

  // Rule 6 — group id shadowing a campus slug
  for (const g of group) {
    if (campusSlugs.has(g.id)) {
      errors.push(`group page '${g.id}.md' collides with campus slug '${g.id}' — it would shadow the campus subtree`);
    }
  }

  // Rule 8 — reserved system segments
  const allRefs = [...group, ...[...campusPages.values()].flat()];
  for (const ref of allRefs) {
    const top = ref.id.split('/')[0]!;
    if (RESERVED_IDS.has(top)) {
      errors.push(`page id '${ref.id}' uses reserved system segment '${top}' (news/staff/calendar/... are system surfaces)`);
    }
  }

  const publishedGroup = group.filter((g) => !g.draft);

  // Group site pages
  for (const g of publishedGroup) {
    pages.push({
      campus: null,
      id: g.id,
      source: 'group',
      path: pagePath(null, g.id),
      canonicalPath: pagePath(null, g.id),
    });
  }

  for (const campus of campuses) {
    const own = campusPages.get(campus.slug) ?? [];
    const ownPublished = own.filter((p) => !p.draft);
    const ownPublishedIds = new Set(ownPublished.map((p) => p.id));

    // Rule 2 — campus home is mandatory and never inherited
    if (!ownPublishedIds.has('index')) {
      errors.push(`campus '${campus.slug}' has no published index.md — every campus needs a front door`);
    }

    // Explicit campus files (Rule 1)
    for (const p of ownPublished) {
      const groupCounterpart = publishedGroup.find((g) => g.id === p.id);
      const source: Source =
        groupCounterpart && groupCounterpart.scope === 'inheritable' && p.id !== 'index'
          ? 'overridden'
          : 'campus-only';
      pages.push({
        campus: campus.slug,
        id: p.id,
        source,
        path: pagePath(campus.slug, p.id),
        canonicalPath: pagePath(campus.slug, p.id),
      });
    }

    // Inherited group pages (Rules 2–5)
    if (campus.inherit.mode !== 'none') {
      for (const g of publishedGroup) {
        if (g.id === 'index') continue; // Rule 2
        if (g.scope === 'group-only') continue; // Rule 3
        if (ownPublishedIds.has(g.id)) continue; // Rule 1/5 — explicit file wins; draft override falls through here
        if (campus.inherit.mode === 'listed' && !campus.inherit.include.includes(g.id)) continue;
        if (campus.inherit.mode === 'all' && campus.inherit.exclude.includes(g.id)) continue;
        pages.push({
          campus: campus.slug,
          id: g.id,
          source: 'inherited',
          path: pagePath(campus.slug, g.id),
          canonicalPath: pagePath(null, g.id), // WA-9
        });
      }
    }
  }

  // Rule 7 — determinism + uniqueness
  pages.sort((a, b) => (a.campus ?? '').localeCompare(b.campus ?? '') || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  for (const p of pages) {
    if (seen.has(p.path)) errors.push(`duplicate route path '${p.path}'`);
    seen.add(p.path);
  }

  return { pages, errors };
}

// ---------------------------------------------------------------------------
// Drift report (brief §4): which campus pages are inherited vs overridden.
// Silent drift is the failure mode WA-11 exists to prevent.
// ---------------------------------------------------------------------------

export interface CampusReport {
  inherited: string[];
  overridden: string[];
  campusOnly: string[];
  /** inheritable group pages this campus does NOT carry (mode/exclude) */
  excluded: string[];
  /** campus files still in draft — the content-progress view */
  drafting: string[];
}

export interface InheritanceReport {
  campuses: Record<string, CampusReport>;
  groupOnly: string[];
  groupPages: string[];
  /** group files still in draft — owed content */
  groupDrafts: string[];
}

export function buildReport(
  result: ResolveResult,
  group: PageRef[],
  campuses: CampusRef[],
  campusPages: Map<string, PageRef[]> = new Map(),
): InheritanceReport {
  const publishedGroup = group.filter((g) => !g.draft);
  const inheritable = publishedGroup.filter((g) => g.scope === 'inheritable' && g.id !== 'index');
  const report: InheritanceReport = {
    campuses: {},
    groupOnly: publishedGroup.filter((g) => g.scope === 'group-only').map((g) => g.id).sort(),
    groupPages: publishedGroup.map((g) => g.id).sort(),
    groupDrafts: group.filter((g) => g.draft).map((g) => g.id).sort(),
  };
  for (const campus of campuses) {
    const rows = result.pages.filter((p) => p.campus === campus.slug);
    const carried = new Set(rows.map((r) => r.id));
    report.campuses[campus.slug] = {
      inherited: rows.filter((r) => r.source === 'inherited').map((r) => r.id).sort(),
      overridden: rows.filter((r) => r.source === 'overridden').map((r) => r.id).sort(),
      campusOnly: rows.filter((r) => r.source === 'campus-only').map((r) => r.id).sort(),
      excluded: inheritable.filter((g) => !carried.has(g.id)).map((g) => g.id).sort(),
      drafting: (campusPages.get(campus.slug) ?? []).filter((p) => p.draft).map((p) => p.id).sort(),
    };
  }
  return report;
}

export function formatReport(report: InheritanceReport): string {
  const lines: string[] = ['Inherit-with-override report (WA-11)', ''];
  for (const [slug, r] of Object.entries(report.campuses)) {
    lines.push(
      `  ${slug}: ${r.inherited.length} inherited, ${r.overridden.length} overridden, ` +
        `${r.campusOnly.length} campus-only${r.excluded.length ? `, ${r.excluded.length} excluded` : ''}`,
    );
    if (r.overridden.length) lines.push(`      overridden: ${r.overridden.join(', ')}`);
    if (r.campusOnly.length) lines.push(`      campus-only: ${r.campusOnly.join(', ')}`);
    if (r.excluded.length) lines.push(`      excluded: ${r.excluded.join(', ')}`);
    if (r.drafting.length) lines.push(`      ✍ in draft: ${r.drafting.join(', ')}`);
  }
  lines.push(`  group-only pages: ${report.groupOnly.join(', ') || '(none)'}`);
  if (report.groupDrafts.length) lines.push(`  ✍ group pages in draft: ${report.groupDrafts.join(', ')}`);
  return lines.join('\n');
}
