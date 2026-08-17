import { describe, expect, it } from 'vitest';
import { byCountry, rollUp, type CohortView, type InstitutionRef } from '../src/lib/placements-aggregate';

// WA-46: campus attribution is binding, because FWGS is a joint venture and a parent browsing FWGS
// must never be left inferring that FSK's record is theirs.
//
// The bug these tests exist to prevent: the year page's getStaticPaths mapped over COHORT RECORDS,
// so two campuses graduating in the same year produced the same path twice. Astro writes the last
// one and the other campus's students vanish — silently, with the build exiting zero. It never bit
// because there has only ever been one campus with placement data.

const institutions = new Map<string, InstitutionRef>([
  ['auro', { id: 'auro', name: 'Auro University', country: 'India', coordinates: { lat: 21.17, lng: 72.83 }, units: [] }],
  ['toronto', { id: 'toronto', name: 'University of Toronto', country: 'Canada', coordinates: { lat: 43.66, lng: -79.4 }, units: [] }],
]);

const cohort = (year: number, campus: string, placements: CohortView['placements'], size: number): CohortView => ({
  year,
  campus,
  cohortSize: size,
  placements,
  otherOutcomes: [],
});

describe('two campuses in the same graduating year', () => {
  const cohorts = [
    cohort(2025, 'kunkni', [{ institution: 'auro', count: 12 }, { institution: 'toronto', count: 3 }], 15),
    cohort(2025, 'fwgs', [{ institution: 'auro', count: 2 }], 2),
  ];

  it('produces ONE page per year, not one per cohort record', () => {
    // The exact expression getStaticPaths uses. Mapping over cohorts would yield 2025 twice.
    const paths = [...new Set(cohorts.map((c) => c.year))];
    expect(paths).toEqual([2025]);
    expect(cohorts.map((c) => c.year)).toHaveLength(2); // the collision the Set prevents
  });

  it('counts BOTH campuses on that page — never just the first one found', () => {
    // `.find()` was the original bug: it returns kunkni and silently drops fwgs.
    const first = cohorts.find((c) => c.year === 2025)!;
    expect(first.cohortSize).toBe(15);

    const all = cohorts.filter((c) => c.year === 2025);
    expect(all.reduce((n, c) => n + c.cohortSize, 0)).toBe(17);

    const rollups = rollUp(all, institutions);
    const auro = rollups.find((r) => r.id === 'auro')!;
    expect(auro.count).toBe(14); // 12 + 2, not 12
    expect(rollups.reduce((n, r) => n + r.count, 0)).toBe(17);
  });

  it('names every campus in view, so attribution is never inferred', () => {
    const campuses = [...new Set(cohorts.filter((c) => c.year === 2025).map((c) => c.campus))];
    expect(campuses).toEqual(['kunkni', 'fwgs']);
    expect(campuses).toHaveLength(2);
  });

  it('keeps country totals whole across campuses', () => {
    const tally = Object.fromEntries(byCountry(rollUp(cohorts, institutions)).map((c) => [c.country, c.count]));
    expect(tally).toEqual({ India: 14, Canada: 3 });
  });
});

describe('a single campus is unaffected', () => {
  it('behaves exactly as before when only one campus has a cohort', () => {
    const only = [cohort(2024, 'kunkni', [{ institution: 'toronto', count: 5 }], 5)];
    expect([...new Set(only.map((c) => c.year))]).toEqual([2024]);
    expect(rollUp(only, institutions).reduce((n, r) => n + r.count, 0)).toBe(5);
  });
});
