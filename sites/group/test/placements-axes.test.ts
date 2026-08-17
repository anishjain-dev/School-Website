import { describe, expect, it } from 'vitest';
import {
  byContinent, byField, inCountry, institutionDetail, rollUp,
  type CohortView, type InstitutionRef,
} from '../src/lib/placements-aggregate';

// The three drill-down axes (2026-07-30). These exist because every failure here is SILENT: a
// country filed on the wrong continent, a field total that quietly double-counts, or an institution
// page that grows a per-year breakdown it was explicitly not allowed to have all render as
// perfectly plausible pages.

const institutions = new Map<string, InstitutionRef>([
  ['iitb', { id: 'iitb', name: 'IIT Bombay', country: 'India', continent: 'Asia', units: [] }],
  ['auro', { id: 'auro', name: 'Auro University', country: 'India', continent: 'Asia', units: [] }],
  ['purdue', { id: 'purdue', name: 'Purdue University', country: 'USA', continent: 'North America', units: [] }],
  ['ucl', { id: 'ucl', name: 'UCL', country: 'UK', continent: 'Europe', units: [] }],
  // Deliberately disagrees with its country's majority, to prove one stray row cannot move a
  // country onto another landmass.
  ['lse', { id: 'lse', name: 'LSE', country: 'UK', continent: 'Asia', units: [] }],
  ['sussex', { id: 'sussex', name: 'Sussex', country: 'UK', continent: 'Europe', units: [] }],
  // No continent recorded at all — a real state the reference produces.
  ['uva', { id: 'uva', name: 'University of Virginia', country: 'Neverland', units: [] }],
  // WA-50: a campus in another country from its parent.
  ['mdx', {
    id: 'mdx', name: 'Middlesex University', country: 'UK', continent: 'Europe',
    units: [{ id: 'mdx-dubai', name: 'Middlesex Dubai', country: 'United Arab Emirates' }],
  }],
]);

const cohorts: CohortView[] = [
  {
    year: 2024, campus: 'kunkni', cohortSize: 20,
    placements: [
      { institution: 'iitb', cluster: 'stem', count: 3 },
      { institution: 'auro', cluster: 'business-administration-commerce', count: 5 },
      // Same institution, two fields — the shape that makes field totals != institution totals.
      { institution: 'purdue', cluster: 'stem', count: 2 },
      { institution: 'purdue', cluster: 'finance', count: 1 },
      { institution: 'ucl', cluster: 'law', count: 1 },
      { institution: 'lse', cluster: 'finance', count: 1 },
      { institution: 'sussex', cluster: 'law', count: 1 },
      { institution: 'uva', cluster: 'stem', count: 1 },
      { institution: 'mdx', unit: 'mdx-dubai', cluster: 'business-administration-commerce', count: 2 },
      // No cluster recorded — belongs to no field, and must not be invented into one.
      { institution: 'iitb', count: 4 },
    ],
    otherOutcomes: [],
  },
  {
    year: 2025, campus: 'kunkni', cohortSize: 10,
    placements: [
      { institution: 'iitb', cluster: 'stem', count: 2 },
      { institution: 'purdue', cluster: 'stem', count: 1 },
    ],
    otherOutcomes: [],
  },
];

const rollups = rollUp(cohorts, institutions);

describe('byContinent', () => {
  it('groups countries under their continent, biggest continent first', () => {
    const groups = byContinent(rollups);
    // Asia = India (iitb 3+4+2=9, auro 5) = 14. North America = Purdue 4. Europe = UK 3.
    expect(groups[0].continent).toBe('Asia');
    expect(groups[0].count).toBe(14);
    expect(groups[0].countries.map((c) => c.country)).toEqual(['India']);
  });

  it('resolves a country by MAJORITY, so one mislabelled institution cannot move it', () => {
    // UK has two institutions saying Europe (ucl, sussex) and one saying Asia (lse).
    const groups = byContinent(rollups);
    const withUK = groups.find((g) => g.countries.some((c) => c.country === 'UK'));
    expect(withUK?.continent).toBe('Europe');
    // ...and Asia must not have gained a UK entry.
    const asia = groups.find((g) => g.continent === 'Asia');
    expect(asia?.countries.map((c) => c.country)).not.toContain('UK');
  });

  it('puts a country with no recorded continent in its own group, LAST, never guessed', () => {
    const groups = byContinent(rollups);
    const unknown = groups.find((g) => g.continent === null);
    expect(unknown).toBeDefined();
    expect(unknown!.countries.map((c) => c.country)).toContain('Neverland');
    // A gap must never lead the page.
    expect(groups[groups.length - 1].continent).toBeNull();
  });

  it('files a WA-50 overseas campus under its OWN country, not its parent continent', () => {
    const groups = byContinent(rollups);
    const europe = groups.find((g) => g.continent === 'Europe');
    // Middlesex Dubai's 2 students are in the UAE, so they must not appear in Europe's total.
    expect(europe?.countries.map((c) => c.country)).not.toContain('United Arab Emirates');
    const uae = groups.flatMap((g) => g.countries).find((c) => c.country === 'United Arab Emirates');
    expect(uae?.count).toBe(2);
  });

  it('every student is counted exactly once across all groups', () => {
    const groups = byContinent(rollups);
    const total = groups.reduce((n, g) => n + g.count, 0);
    expect(total).toBe(rollups.reduce((n, r) => n + r.count, 0));
  });
});

describe('inCountry', () => {
  it('returns only that country, including a split-out campus', () => {
    expect(inCountry(rollups, 'India').map((r) => r.id).sort()).toEqual(['auro', 'iitb']);
    expect(inCountry(rollups, 'United Arab Emirates').map((r) => r.id)).toEqual(['mdx-dubai']);
  });
});

describe('byField', () => {
  it('totals students per field, biggest first', () => {
    const fields = byField(cohorts);
    // stem = iitb 3+2 + purdue 2+1 + uva 1 = 9
    expect(fields[0]).toMatchObject({ cluster: 'stem', count: 9 });
  });

  it('lists an institution under EVERY field its students studied', () => {
    const fields = byField(cohorts);
    const stem = fields.find((f) => f.cluster === 'stem')!;
    const finance = fields.find((f) => f.cluster === 'finance')!;
    expect(stem.destinations.find((d) => d.id === 'purdue')?.count).toBe(3);
    expect(finance.destinations.find((d) => d.id === 'purdue')?.count).toBe(1);
  });

  it('never invents a field for a placement with no cluster recorded', () => {
    const fields = byField(cohorts);
    // iitb's 4 uncategorised students belong to no field, so stem must not absorb them.
    const stem = fields.find((f) => f.cluster === 'stem')!;
    expect(stem.destinations.find((d) => d.id === 'iitb')?.count).toBe(5); // 3 + 2, not 9
    expect(fields.some((f) => f.cluster === '' || f.cluster === undefined)).toBe(false);
    // Field totals therefore sum to LESS than all placements, by exactly the untagged ones.
    const fieldTotal = fields.reduce((n, f) => n + f.count, 0);
    const allPlacements = rollups.reduce((n, r) => n + r.count, 0);
    expect(fieldTotal).toBe(allPlacements - 4);
  });
});

describe('institutionDetail', () => {
  it('pools across every class and lists the fields studied', () => {
    const d = institutionDetail(rollups, cohorts, 'purdue')!;
    expect(d.rollup.count).toBe(4); // 2 + 1 in 2024, 1 in 2025 — pooled
    expect(d.fields).toEqual([
      { cluster: 'stem', count: 3 },
      { cluster: 'finance', count: 1 },
    ]);
  });

  it('exposes NO per-year breakdown — the pooling is the privacy guarantee', () => {
    const d = institutionDetail(rollups, cohorts, 'purdue')!;
    // Regression-locked deliberately: a future "helpful" addition of years here would turn
    // "1 student" into "1 student, 2025", the narrowest cell on the site.
    expect(Object.keys(d).sort()).toEqual(['fields', 'rollup']);
    expect(JSON.stringify(d)).not.toMatch(/\b20(1|2)\d\b/);
  });

  it('returns null for an id with no placements rather than an empty page', () => {
    expect(institutionDetail(rollups, cohorts, 'not-a-destination')).toBeNull();
  });

  it('keeps a WA-50 campus answerable on its own, saying whose it is', () => {
    const d = institutionDetail(rollups, cohorts, 'mdx-dubai')!;
    expect(d.rollup.country).toBe('United Arab Emirates');
    expect(d.rollup.partOf?.name).toBe('Middlesex University');
  });
});
