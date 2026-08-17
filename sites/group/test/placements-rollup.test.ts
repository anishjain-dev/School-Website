import { describe, expect, it } from 'vitest';
import { byCountry, rollUp, toMapPoints, type CohortView, type InstitutionRef } from '../src/lib/placements-aggregate';

// WA-50 (VK, 2026-07-27): "different countries are different campuses, can't count them in the
// same breath". Roll-up stops at the border. These tests exist because the failure is invisible:
// a Dubai student silently added to the UK column and plotted in Edinburgh looks exactly like
// correct output.

const institutions = new Map<string, InstitutionRef>([
  [
    'heriot-watt',
    {
      id: 'heriot-watt',
      name: 'Heriot-Watt University',
      country: 'UK',
      coordinates: { lat: 55.9105, lng: -3.3216 },
      units: [
        { id: 'hw-dubai', name: 'Dubai Campus', country: 'United Arab Emirates', coordinates: { lat: 25.1279, lng: 55.3897 } },
        // Same country as the parent: ordinary detail, folds in.
        { id: 'hw-borders', name: 'Scottish Borders', coordinates: { lat: 55.5852, lng: -2.7861 } },
      ],
    },
  ],
  [
    'toronto',
    {
      id: 'toronto',
      name: 'University of Toronto',
      country: 'Canada',
      coordinates: { lat: 43.6608, lng: -79.3955 },
      units: [{ id: 'utm', name: 'Mississauga', coordinates: { lat: 43.589, lng: -79.6441 } }],
    },
  ],
]);

const cohort = (placements: CohortView['placements']): CohortView => ({
  year: 2025,
  campus: 'FSK',
  cohortSize: 100,
  placements,
  otherOutcomes: [],
});

describe('rollUp — roll-up stops at the border (WA-50)', () => {
  it('splits an overseas campus out of its parent, at its own coordinates and country', () => {
    const r = rollUp(
      [cohort([
        { institution: 'heriot-watt', count: 4 },
        { institution: 'heriot-watt', unit: 'hw-dubai', count: 3 },
      ])],
      institutions,
    );

    const uk = r.find((x) => x.id === 'heriot-watt')!;
    const dubai = r.find((x) => x.id === 'hw-dubai')!;

    expect(uk.count).toBe(4); // NOT 7 — the Dubai students left
    expect(uk.country).toBe('UK');
    expect(dubai.count).toBe(3);
    expect(dubai.country).toBe('United Arab Emirates');
    expect(dubai.coordinates).toEqual({ lat: 25.1279, lng: 55.3897 });
    // Still recorded as Heriot-Watt's — the degree really is Heriot-Watt's.
    expect(dubai.partOf).toEqual({ id: 'heriot-watt', name: 'Heriot-Watt University', country: 'UK' });
  });

  it('keeps a same-country campus folded in, as detail', () => {
    const r = rollUp(
      [cohort([
        { institution: 'toronto', count: 2 },
        { institution: 'toronto', unit: 'utm', count: 5 },
      ])],
      institutions,
    );
    expect(r).toHaveLength(1);
    expect(r[0].count).toBe(7);
    expect(r[0].units).toEqual([{ name: 'Mississauga', count: 5 }]);
  });

  it('never invents or loses a student — the split moves counts, it does not change the total', () => {
    const placements = [
      { institution: 'heriot-watt', count: 4 },
      { institution: 'heriot-watt', unit: 'hw-dubai', count: 3 },
      { institution: 'heriot-watt', unit: 'hw-borders', count: 2 },
      { institution: 'toronto', unit: 'utm', count: 5 },
    ];
    const r = rollUp([cohort(placements)], institutions);
    const total = placements.reduce((s, p) => s + p.count, 0);
    expect(r.reduce((s, x) => s + x.count, 0)).toBe(total);
    expect(byCountry(r).reduce((s, x) => s + x.count, 0)).toBe(total);
  });

  it('attributes the country tally to the campus, not the brand', () => {
    const r = rollUp(
      [cohort([
        { institution: 'heriot-watt', count: 4 },
        { institution: 'heriot-watt', unit: 'hw-dubai', count: 3 },
      ])],
      institutions,
    );
    const tally = Object.fromEntries(byCountry(r).map((c) => [c.country, c.count]));
    expect(tally).toEqual({ UK: 4, 'United Arab Emirates': 3 });
  });

  it('drops the parent entirely when every placement was overseas', () => {
    const r = rollUp([cohort([{ institution: 'heriot-watt', unit: 'hw-dubai', count: 3 }])], institutions);
    expect(r.map((x) => x.id)).toEqual(['hw-dubai']);
    // No phantom "Heriot-Watt UK: 0" bubble over Edinburgh.
    expect(r.find((x) => x.id === 'heriot-watt')).toBeUndefined();
  });

  it('plots the overseas campus as its own bubble, named so its parent is clear', () => {
    const points = toMapPoints(
      rollUp(
        [cohort([
          { institution: 'heriot-watt', count: 4 },
          { institution: 'heriot-watt', unit: 'hw-dubai', count: 3 },
        ])],
        institutions,
      ),
    );
    const dubai = points.find((p) => p.id === 'hw-dubai')!;
    expect(dubai.lat).toBeCloseTo(25.1279, 4);
    expect(dubai.name).toBe('Dubai Campus (Heriot-Watt University)');
    // The regression this guards: the Dubai students appearing at Edinburgh's coordinates.
    expect(points.find((p) => p.id === 'heriot-watt')!.lat).toBeCloseTo(55.9105, 4);
  });

  // WA-51: a school is part of the COURSE, not a place. It shows as detail and can never move a
  // bubble or a country total — which is the whole reason it stopped being a "unit".
  it('keeps school detail against the place, without creating a second bubble', () => {
    const r = rollUp(
      [cohort([
        { institution: 'toronto', school: 'Rotman Commerce', count: 4 },
        { institution: 'toronto', school: 'Faculty of Arts & Science', count: 2 },
        { institution: 'toronto', count: 1 },
      ])],
      institutions,
    );
    expect(r).toHaveLength(1);
    expect(r[0].count).toBe(7);
    expect(r[0].units).toEqual([
      { name: 'Rotman Commerce', count: 4 },
      { name: 'Faculty of Arts & Science', count: 2 },
    ]);
    expect(toMapPoints(r)).toHaveLength(1);
  });

  it('does not let school detail follow an overseas campus out of its parent', () => {
    const r = rollUp(
      [cohort([
        { institution: 'heriot-watt', school: 'Edinburgh Business School', count: 5 },
        { institution: 'heriot-watt', unit: 'hw-dubai', count: 3 },
      ])],
      institutions,
    );
    const uk = r.find((x) => x.id === 'heriot-watt')!;
    const dubai = r.find((x) => x.id === 'hw-dubai')!;
    expect(uk.count).toBe(5);
    expect(uk.units).toEqual([{ name: 'Edinburgh Business School', count: 5 }]);
    expect(dubai.count).toBe(3);
    expect(dubai.units).toEqual([]);
  });

  it('still refuses to invent a destination the reference does not know', () => {
    const r = rollUp([cohort([{ institution: 'not-in-reference', count: 9 }])], institutions);
    expect(r).toEqual([]);
  });
});
