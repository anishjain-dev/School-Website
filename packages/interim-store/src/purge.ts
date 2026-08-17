// WA-34 retention purge — pure planning function, exhaustively unit-tested;
// the cron handler and the --dry-run CLI both wrap THIS. A retention
// promise without a deletion mechanism is quietly false (WA-40 cond. 3).
//
// Clocks (register-note: interim has no "decision" events, so submission
// date is the only honest clock — stricter than WA-34's post-decision):
//   enquiry              24 months from receivedAt
//   careers/internship   12 months from receivedAt
//   migrated rows        30 days from migratedAt (envelope handover grace)
//   unscanned documents  30 days from uploadedAt (quarantine janitor)

export interface SubmissionRow {
  id: string;
  kind: string; // enquiry | careers | internship
  receivedAt: Date;
  status: string; // received | migrated | purged
  migratedAt: Date | null;
}

export interface DocumentRow {
  id: string;
  submissionId: string;
  uploadedAt: Date;
  scanStatus: string; // pending | clean | infected | failed
}

export interface PurgePlan {
  submissionIds: string[];
  reasons: Record<string, string>;
  quarantineDocIds: string[];
}

const MONTH_MS = 30.44 * 24 * 3600 * 1000; // calendar-mean month
const DAY_MS = 24 * 3600 * 1000;

export const RETENTION_MONTHS: Record<string, number> = {
  enquiry: 24,
  careers: 12,
  internship: 12,
};

export function planPurge(now: Date, submissions: SubmissionRow[], documents: DocumentRow[] = []): PurgePlan {
  const plan: PurgePlan = { submissionIds: [], reasons: {}, quarantineDocIds: [] };

  for (const s of submissions) {
    if (s.status === 'purged') continue;
    if (s.status === 'migrated') {
      if (s.migratedAt && now.getTime() - s.migratedAt.getTime() > 30 * DAY_MS) {
        plan.submissionIds.push(s.id);
        plan.reasons[s.id] = 'migrated+30d envelope grace elapsed';
      }
      continue;
    }
    const months = RETENTION_MONTHS[s.kind];
    if (!months) continue; // unknown kind: never auto-delete — surface, don't guess
    if (now.getTime() - s.receivedAt.getTime() > months * MONTH_MS) {
      plan.submissionIds.push(s.id);
      plan.reasons[s.id] = `${s.kind} retention (${months} months) elapsed`;
    }
  }

  const purging = new Set(plan.submissionIds);
  for (const d of documents) {
    if (purging.has(d.submissionId)) continue; // deleted with its submission anyway
    if ((d.scanStatus === 'pending' || d.scanStatus === 'failed') && now.getTime() - d.uploadedAt.getTime() > 30 * DAY_MS) {
      plan.quarantineDocIds.push(d.id);
      plan.reasons[d.id] = `quarantine janitor: ${d.scanStatus} for >30d`;
    }
  }

  return plan;
}
