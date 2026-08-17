import { describe, expect, it } from 'vitest';
import {
  byClusters, pick, recurringDestinations, repeatRate, rollUp, splitByHomeCity,
  type CohortView, type InstitutionRef,
} from '../src/lib/placements-aggregate';

// The redesigned placements page makes four claims. Each is computed at build time, so each needs a
// test — a wrong marketing number is worse than no marketing number.

const institutions = new Map<string, InstitutionRef>([
  ['auro', { id: 'auro', name: 'Auro University', country: 'India', city: 'Surat', units: [] }],
  ['ckp', { id: 'ckp', name: 'C.K.Pithawala College', country: 'India', city: 'Suart', units: [] }],
  ['nmims', { id: 'nmims', name: 'NMIMS', country: 'India', city: 'Mumbai', units: [] }],
  ['toronto', { id: 'toronto', name: 'University of Toronto', country: 'Canada', city: 'Toronto', units: [] }],
]);

const cohort = (year: number, placements: CohortView['placements'], size = 10): CohortView => ({
  year, campus: 'kunkni', cohortSize: size, placements, otherOutcomes: [],
});

describe('repeatRate — the page\'s central claim', () => {
  const cohorts = [
    cohort(2020, [{ institution: 'auro', count: 4 }]),
    cohort(2021, [{ institution: 'auro', count: 3 }, { institution: 'nmims', count: 1 }]),
    cohort(2022, [{ institution: 'auro', count: 2 }, { institution: 'nmims', count: 2 }, { institution: 'toronto', count: 1 }]),
  ];

  it('counts students who went where we had sent someone before', () => {
    const r = repeatRate(cohorts);
    // 2021: 3 of 4 went to Auro, which 2020 already used. nmims is new.
    expect(r.find((x) => x.year === 2021)).toEqual({ year: 2021, pct: 75, of: 4 });
    // 2022: auro 2 + nmims 2 are returning; toronto is new. 4 of 5.
    expect(r.find((x) => x.year === 2022)).toEqual({ year: 2022, pct: 80, of: 5 });
  });

  it('has no entry for the first year, which has no prior to return to', () => {
    expect(repeatRate(cohorts).some((x) => x.year === 2020)).toBe(false);
  });

  it('uses a TRAILING window, so the series cannot drift upward for arithmetic reasons', () => {
    // With a 1-year window, 2022 may only look back at 2021 — where toronto did not appear and
    // auro did. An all-history version would also count anything from 2020.
    const narrow = repeatRate(cohorts, 1);
    expect(narrow.find((x) => x.year === 2022)!.pct).toBe(80);
    const old = [
      cohort(2010, [{ institution: 'toronto', count: 1 }]),
      cohort(2020, [{ institution: 'auro', count: 4 }]),
      cohort(2021, [{ institution: 'toronto', count: 1 }]),
    ];
    // Toronto last appeared in 2010, outside a 1-year window: not a return.
    expect(repeatRate(old, 1).find((x) => x.year === 2021)!.pct).toBe(0);
  });
});

describe('recurringDestinations', () => {
  const cohorts = [2019, 2020, 2021, 2022].map((y) =>
    cohort(y, [{ institution: 'auro', count: 2 }, ...(y > 2020 ? [{ institution: 'nmims', count: 1 }] : [])]),
  );

  it('counts DISTINCT classes, not placements', () => {
    const r = recurringDestinations(cohorts, institutions, 4);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: 'auro', classes: 4, count: 8 });
  });

  it('excludes an institution that appears often but in too few classes', () => {
    expect(recurringDestinations(cohorts, institutions, 4).some((r) => r.id === 'nmims')).toBe(false);
    expect(recurringDestinations(cohorts, institutions, 2).some((r) => r.id === 'nmims')).toBe(true);
  });

  it('drops an id the reference does not know, rather than inventing a name', () => {
    const ghost = [1, 2, 3, 4].map((i) => cohort(2010 + i, [{ institution: 'nope', count: 1 }]));
    expect(recurringDestinations(ghost, institutions, 4)).toEqual([]);
  });
});

describe('splitByHomeCity', () => {
  it('separates the school\'s own city from everywhere else', () => {
    const r = rollUp([cohort(2025, [
      { institution: 'auro', count: 5 },
      { institution: 'ckp', count: 2 },
      { institution: 'nmims', count: 3 },
    ])], institutions);
    const { home, away } = splitByHomeCity(r, institutions, 'Surat');
    expect(home.map((h) => h.id).sort()).toEqual(['auro', 'ckp']);
    expect(away.map((a) => a.id)).toEqual(['nmims']);
  });

  it('catches the workbook\'s "Suart" misspelling — otherwise a local college lands in the national list', () => {
    const r = rollUp([cohort(2025, [{ institution: 'ckp', count: 2 }])], institutions);
    expect(splitByHomeCity(r, institutions, 'Surat').home).toHaveLength(1);
  });
});

describe('byClusters', () => {
  it('totals the chosen clusters and gives the per-year series', () => {
    const cohorts = [
      cohort(2024, [{ institution: 'nmims', cluster: 'arts-design-media', count: 3 }, { institution: 'auro', cluster: 'finance', count: 9 }]),
      cohort(2025, [{ institution: 'nmims', cluster: 'arts-design-media', count: 5 }, { institution: 'auro', cluster: 'mass-media-journalism', count: 1 }]),
    ];
    const r = byClusters(cohorts, ['arts-design-media', 'mass-media-journalism']);
    expect(r.total).toBe(9);
    expect(r.perYear).toEqual([{ year: 2024, n: 3 }, { year: 2025, n: 6 }]);
  });

  it('ignores placements with no cluster rather than counting them', () => {
    expect(byClusters([cohort(2025, [{ institution: 'auro', count: 4 }])], ['finance']).total).toBe(0);
  });
});

describe('pick — the curated lists', () => {
  const r = rollUp([cohort(2025, [{ institution: 'auro', count: 5 }, { institution: 'nmims', count: 3 }])], institutions);

  it('returns them in the order the editor listed, not by count', () => {
    expect(pick(r, ['nmims', 'auro']).map((x) => x.id)).toEqual(['nmims', 'auro']);
  });

  it('silently drops a curated id with no placements — the list never creates a number', () => {
    expect(pick(r, ['toronto', 'auro']).map((x) => x.id)).toEqual(['auro']);
  });
});
