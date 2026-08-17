// WA-11 resolver suite. Silent drift is the failure mode inherit-with-
// override exists to prevent — these tests pin every rule, including the
// deliberate judgement calls (draft-override fallback, index never
// inherits, group-only scoping).
import { describe, expect, it } from 'vitest';
import { resolveMatrix, buildReport, type CampusRef, type PageRef } from '../src/lib/resolve';

const page = (id: string, extra: Partial<PageRef> = {}): PageRef => ({
  id,
  scope: 'inheritable',
  draft: false,
  ...extra,
});

const campus = (slug: string, inherit: Partial<CampusRef['inherit']> = {}): CampusRef => ({
  slug,
  inherit: { mode: 'all', exclude: [], include: [], ...inherit },
});

const GROUP = [page('index'), page('philosophy'), page('admissions'), page('academics/pyp'), page('careers', { scope: 'group-only' })];

const find = (r: ReturnType<typeof resolveMatrix>, campusSlug: string | null, id: string) =>
  r.pages.find((p) => p.campus === campusSlug && p.id === id);

describe('inherit-with-override resolution (WA-11)', () => {
  it('1. campus with no file inherits the group page', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'philosophy')).toMatchObject({ source: 'inherited', path: '/kunkni/philosophy/' });
  });

  it('2. explicit campus file overrides the group counterpart', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('admissions')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'admissions')?.source).toBe('overridden');
  });

  it('3. campus-only page with no group counterpart', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('transport')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'transport')?.source).toBe('campus-only');
  });

  it('4. nested paths inherit', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'academics/pyp')).toMatchObject({ source: 'inherited', path: '/kunkni/academics/pyp/' });
  });

  it('5. nested override wins', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('academics/pyp')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'academics/pyp')?.source).toBe('overridden');
  });

  it('6. group-only pages appear on the group site and zero campuses', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]], ['malgama', [page('index')]]]), [campus('kunkni'), campus('malgama')]);
    expect(find(r, null, 'careers')).toBeDefined();
    expect(r.pages.filter((p) => p.id === 'careers' && p.campus !== null)).toHaveLength(0);
  });

  it('7. campus file whose group counterpart is group-only renders as campus-only', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('careers')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'careers')?.source).toBe('campus-only');
  });

  it('8. inherit.mode none emits only own files — the FASV single-landing case', () => {
    const r = resolveMatrix(GROUP, new Map([['fasv', [page('index')]]]), [campus('fasv', { mode: 'none' })]);
    expect(r.pages.filter((p) => p.campus === 'fasv')).toHaveLength(1);
    expect(find(r, 'fasv', 'index')?.path).toBe('/fasv/');
  });

  it('9. inherit.mode listed carries only included ids plus own files', () => {
    const r = resolveMatrix(GROUP, new Map([['falh', [page('index'), page('contact')]]]), [
      campus('falh', { mode: 'listed', include: ['philosophy'] }),
    ]);
    const ids = r.pages.filter((p) => p.campus === 'falh').map((p) => p.id).sort();
    expect(ids).toEqual(['contact', 'index', 'philosophy']);
  });

  it('10. inherit.mode all + exclude removes exactly the excluded id', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni', { exclude: ['admissions'] })]);
    expect(find(r, 'kunkni', 'admissions')).toBeUndefined();
    expect(find(r, 'kunkni', 'philosophy')).toBeDefined();
  });

  it('11. exclude works on nested ids', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni', { exclude: ['academics/pyp'] })]);
    expect(find(r, 'kunkni', 'academics/pyp')).toBeUndefined();
  });

  it('12. group index is never inherited into a campus', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    const kunkniIndex = find(r, 'kunkni', 'index');
    expect(kunkniIndex?.source).toBe('campus-only');
  });

  it('13. campus without a published index is a build error', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('philosophy')]]]), [campus('kunkni')]);
    expect(r.errors.some((e) => e.includes("campus 'kunkni' has no published index"))).toBe(true);
  });

  it('14. draft group page is absent from group and all campuses', () => {
    const r = resolveMatrix([...GROUP, page('upcoming', { draft: true })], new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    expect(find(r, null, 'upcoming')).toBeUndefined();
    expect(find(r, 'kunkni', 'upcoming')).toBeUndefined();
  });

  it('15. draft group page with a published campus override still renders the override', () => {
    const r = resolveMatrix([...GROUP, page('fees', { draft: true })], new Map([['kunkni', [page('index'), page('fees')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'fees')?.source).toBe('campus-only');
  });

  it('16. DRAFT campus override falls back to the inherited group page (a draft never unpublishes)', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('admissions', { draft: true })]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'admissions')?.source).toBe('inherited');
  });

  it('17. group page id colliding with a campus slug is a build error', () => {
    const r = resolveMatrix([...GROUP, page('kunkni')], new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    expect(r.errors.some((e) => e.includes('collides with campus slug'))).toBe(true);
  });

  it('18. no duplicate route paths across the full matrix', () => {
    const campuses = [campus('kunkni'), campus('malgama'), campus('fwgs')];
    const pagesMap = new Map(campuses.map((c) => [c.slug, [page('index'), page('admissions')]]));
    const r = resolveMatrix(GROUP, pagesMap, campuses);
    expect(r.errors).toEqual([]);
    const paths = r.pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('19. deterministic output — two runs deep-equal', () => {
    const run = () => resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('transport')]]]), [campus('kunkni')]);
    expect(run()).toEqual(run());
  });

  it('20. canonical: inherited pages canonicalise to the group URL (WA-9)', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'philosophy')?.canonicalPath).toBe('/philosophy/');
  });

  it('21. canonical: overridden and campus-only pages canonicalise to themselves', () => {
    const r = resolveMatrix(GROUP, new Map([['kunkni', [page('index'), page('admissions'), page('transport')]]]), [campus('kunkni')]);
    expect(find(r, 'kunkni', 'admissions')?.canonicalPath).toBe('/kunkni/admissions/');
    expect(find(r, 'kunkni', 'transport')?.canonicalPath).toBe('/kunkni/transport/');
  });

  it('22. report counts and id lists match the matrix exactly', () => {
    const campuses = [campus('kunkni', { exclude: ['academics/pyp'] })];
    const pagesMap = new Map([['kunkni', [page('index'), page('admissions'), page('transport')]]]);
    const r = resolveMatrix(GROUP, pagesMap, campuses);
    const report = buildReport(r, GROUP, campuses, pagesMap);
    expect(report.campuses.kunkni).toEqual({
      inherited: ['philosophy'],
      overridden: ['admissions'],
      campusOnly: ['index', 'transport'],
      excluded: ['academics/pyp'],
      drafting: [],
    });
    expect(report.groupOnly).toEqual(['careers']);
  });

  it('25. drafts surface in the report as owed content (the progress tracker)', () => {
    const group = [...GROUP, page('about', { draft: true })];
    const pagesMap = new Map([['kunkni', [page('index'), page('fees', { draft: true })]]]);
    const campuses = [campus('kunkni')];
    const report = buildReport(resolveMatrix(group, pagesMap, campuses), group, campuses, pagesMap);
    expect(report.groupDrafts).toEqual(['about']);
    expect(report.campuses.kunkni!.drafting).toEqual(['fees']);
  });

  it('24. reserved system segments are build errors (news, staff, ...)', () => {
    const r = resolveMatrix([...GROUP, page('news')], new Map([['kunkni', [page('index'), page('staff')]]]), [campus('kunkni')]);
    expect(r.errors.filter((e) => e.includes('reserved system segment'))).toHaveLength(2);
  });

  it('23. full-matrix integration snapshot — every rule at once', () => {
    const group = [...GROUP, page('upcoming', { draft: true })];
    const campuses = [
      campus('kunkni', { exclude: ['academics/pyp'] }),
      campus('falh', { mode: 'listed', include: ['philosophy'] }),
      campus('fasv', { mode: 'none' }),
    ];
    const pagesMap = new Map<string, PageRef[]>([
      ['kunkni', [page('index'), page('admissions'), page('transport'), page('fees', { draft: true })]],
      ['falh', [page('index')]],
      ['fasv', [page('index')]],
    ]);
    const r = resolveMatrix(group, pagesMap, campuses);
    expect(r.errors).toEqual([]);
    // Sort is (campus, id): group ids alphabetical, so 'index' (→ /) lands
    // between 'careers' and 'philosophy'.
    expect(r.pages.map((p) => `${p.path} ${p.source}`)).toEqual([
      '/academics/pyp/ group',
      '/admissions/ group',
      '/careers/ group',
      '/ group',
      '/philosophy/ group',
      '/falh/ campus-only',
      '/falh/philosophy/ inherited',
      '/fasv/ campus-only',
      '/kunkni/admissions/ overridden',
      '/kunkni/ campus-only',
      '/kunkni/philosophy/ inherited',
      '/kunkni/transport/ campus-only',
    ]);
  });
});
