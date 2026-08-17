import { describe, expect, it } from 'vitest';
import { trendSeries, worldComparison, type ResultSet } from '../src/lib/results-series';

// The results page publishes a school's exam averages next to the IB's own. Two things can go wrong
// quietly enough to ship: mixing two campuses into one trend line, and stating a comparison that
// stopped being true. Both are tested here because neither fails the build.

const set = (campus: string, sessionYear: number, schoolAverage?: number, worldAverage?: number): ResultSet =>
  ({ campus, sessionYear, cohortSize: 100, schoolAverage, worldAverage });

describe('trendSeries — one campus, never a blend', () => {
  it('keeps the campus with the longest record and drops the other', () => {
    const { campus, series } = trendSeries([
      set('kunkni', 2024, 32.35, 30.3),
      set('kunkni', 2025, 32.69, 30.6),
      set('kunkni', 2026, 32.97, 30.9),
      set('fwgs', 2026, 30.37, 30.9),
    ]);
    expect(campus).toBe('kunkni');
    expect(series.map((s) => s.sessionYear)).toEqual([2024, 2025, 2026]);
  });

  it('never puts two campuses on the same year — the collision that would zigzag the line', () => {
    const { series } = trendSeries([set('kunkni', 2026, 32.97), set('fwgs', 2026, 30.37)]);
    expect(series).toHaveLength(1);
    expect(new Set(series.map((s) => s.sessionYear)).size).toBe(series.length);
  });

  it('sorts ascending, because the chart draws in array order', () => {
    const { series } = trendSeries([set('k', 2026), set('k', 2016), set('k', 2021)]);
    expect(series.map((s) => s.sessionYear)).toEqual([2016, 2021, 2026]);
  });

  it('is deterministic when two campuses tie on length', () => {
    const a = trendSeries([set('bbb', 2025), set('aaa', 2025)]).campus;
    const b = trendSeries([set('aaa', 2025), set('bbb', 2025)]).campus;
    expect(a).toBe(b);
  });

  it('returns nothing rather than throwing when there is no data', () => {
    expect(trendSeries([])).toEqual({ campus: null, series: [] });
  });
});

describe('worldComparison — the claim rewrites itself', () => {
  // The real FSK record on the IB's own basis (diploma-awarded), 2020 onward.
  const real = [
    set('kunkni', 2020, 33.16, 31.3), set('kunkni', 2021, 34.59, 33.0),
    set('kunkni', 2022, 33.68, 32.0), set('kunkni', 2023, 31.82, 30.2),
    set('kunkni', 2024, 32.35, 30.3), set('kunkni', 2025, 32.69, 30.6),
    set('kunkni', 2026, 32.97, 30.9),
  ];

  it('reports the school above the world in every comparable session', () => {
    const r = worldComparison(real);
    expect(r.aboveAll).toBe(true);
    expect(r.minLead).toBeCloseTo(1.59, 2);
    expect(r.maxLead).toBeCloseTo(2.09, 2);
  });

  it('DROPS the claim the moment one session falls below — the page must not keep asserting it', () => {
    const r = worldComparison([...real, set('kunkni', 2027, 30.0, 31.0)]);
    expect(r.aboveAll).toBe(false);
    expect(r.minLead).toBeCloseTo(-1.0, 2);
  });

  it('treats a dead heat as not-above, so "above" always means strictly above', () => {
    expect(worldComparison([set('k', 2025, 30.6, 30.6)]).aboveAll).toBe(false);
  });

  it('ignores sessions with no world figure instead of counting them as wins', () => {
    // 2016-2019 have no published world average. An implementation that skipped the undefined check
    // would compute NaN leads and `every` would return false — or worse, count them as above.
    const r = worldComparison([set('k', 2016, 31.1), set('k', 2026, 32.97, 30.9)]);
    expect(r.compared).toHaveLength(1);
    expect(r.leads.every(Number.isFinite)).toBe(true);
    expect(r.aboveAll).toBe(true);
  });

  it('makes no claim at all when nothing is comparable', () => {
    const r = worldComparison([set('k', 2016, 31.1), set('k', 2017, 33.9)]);
    expect(r.aboveAll).toBe(false);
    expect(r.minLead).toBeNull();
    expect(r.latest).toBeNull();
  });

  it('reads the latest comparable session, not the latest session', () => {
    const r = worldComparison([set('k', 2025, 32.69, 30.6), set('k', 2026, 32.97)]);
    expect(r.latest?.sessionYear).toBe(2025);
  });
});
