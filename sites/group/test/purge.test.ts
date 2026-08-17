// WA-34 purge planning — boundary-tested. A retention promise without a
// tested deletion mechanism is quietly false (WA-40 condition 3).
import { describe, expect, it } from 'vitest';
import { planPurge, type SubmissionRow, type DocumentRow } from '@fountainhead-web/interim-store';

const NOW = new Date('2028-07-20T00:00:00Z');
const monthsAgo = (n: number) => new Date(NOW.getTime() - n * 30.44 * 24 * 3600 * 1000);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 3600 * 1000);

const sub = (id: string, kind: string, receivedAt: Date, extra: Partial<SubmissionRow> = {}): SubmissionRow => ({
  id,
  kind,
  receivedAt,
  status: 'received',
  migratedAt: null,
  ...extra,
});

describe('planPurge (WA-34)', () => {
  it('enquiries purge at 24 months, not before', () => {
    const plan = planPurge(NOW, [sub('old', 'enquiry', monthsAgo(24.5)), sub('fresh', 'enquiry', monthsAgo(23.5))]);
    expect(plan.submissionIds).toEqual(['old']);
  });

  it('careers and internships purge at 12 months', () => {
    const plan = planPurge(NOW, [
      sub('c-old', 'careers', monthsAgo(12.5)),
      sub('c-new', 'careers', monthsAgo(11.5)),
      sub('i-old', 'internship', monthsAgo(12.5)),
    ]);
    expect(plan.submissionIds.sort()).toEqual(['c-old', 'i-old']);
  });

  it('migrated envelopes purge 30 days after handover regardless of age', () => {
    const plan = planPurge(NOW, [
      sub('handed', 'enquiry', monthsAgo(2), { status: 'migrated', migratedAt: daysAgo(31) }),
      sub('grace', 'enquiry', monthsAgo(2), { status: 'migrated', migratedAt: daysAgo(29) }),
    ]);
    expect(plan.submissionIds).toEqual(['handed']);
  });

  it('already-purged rows and unknown kinds are never touched', () => {
    const plan = planPurge(NOW, [
      sub('done', 'enquiry', monthsAgo(30), { status: 'purged' }),
      sub('odd', 'mystery-kind', monthsAgo(30)),
    ]);
    expect(plan.submissionIds).toEqual([]);
  });

  it('quarantine janitor: pending/failed docs >30d go; clean and fresh stay', () => {
    const doc = (id: string, scanStatus: string, uploadedAt: Date): DocumentRow => ({
      id,
      submissionId: `s-${id}`,
      uploadedAt,
      scanStatus,
    });
    const plan = planPurge(NOW, [], [
      doc('stale-pending', 'pending', daysAgo(31)),
      doc('stale-failed', 'failed', daysAgo(31)),
      doc('fresh-pending', 'pending', daysAgo(5)),
      doc('old-clean', 'clean', daysAgo(300)),
    ]);
    expect(plan.quarantineDocIds.sort()).toEqual(['stale-failed', 'stale-pending']);
  });

  it('every deletion carries a written reason (audit row content)', () => {
    const plan = planPurge(NOW, [sub('x', 'enquiry', monthsAgo(25))]);
    expect(plan.reasons['x']).toContain('24 months');
  });
});
