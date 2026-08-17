// Runtime data access — postgres.js over the Hyperdrive connection string
// on Workers, DATABASE_URL locally. DECISION (flagged in the Stage 7
// report): Prisma remains the SCHEMA source of truth (same DSL as Nucleus,
// drift-checked), but runtime queries use postgres.js — it is tiny, runs
// cleanly on workerd, and the write path is six INSERTs and four DELETEs.
// Swapping to Prisma Client later touches only this file.
import postgres from 'postgres';
import { mintId } from './ids';
import { planPurge, type PurgePlan } from './purge';

export type Sql = ReturnType<typeof postgres>;

export function connect(connectionString: string): Sql {
  // Workers: one connection per invocation, no pooling client-side —
  // Hyperdrive (prod) owns pooling. max 1 keeps dev honest too.
  return postgres(connectionString, { max: 1, prepare: false });
}

export interface EnquiryInput {
  parentName: string;
  parentPhone: string;
  parentEmail?: string | undefined;
  childName: string;
  childDob: string; // yyyy-mm-dd
  campus?: string | undefined;
  note?: string | undefined;
  sourcePath: string;
  noticeVersion: string;
  turnstileOutcome: string;
  ipHash?: string | undefined;
}

export async function insertEnquiry(sql: Sql, input: EnquiryInput): Promise<{ leadId: string; submissionId: string }> {
  const now = new Date();
  const leadId = mintId();
  const submissionId = mintId();
  const consentId = mintId();
  await sql.begin(async (tx) => {
    await tx`INSERT INTO "Lead" ("id","parentName","parentPhone","parentEmail","childName","childDob","source","stage","targetYear","createdAt","lastActivityAt")
      VALUES (${leadId}, ${input.parentName}, ${input.parentPhone}, ${input.parentEmail ?? null}, ${input.childName}, ${input.childDob}, 'web', 'new', ${input.campus ?? null}, ${now}, ${now})`;
    await tx`INSERT INTO "ConsentRecord" ("id","purpose","dataCategory","granted","at","method","packVersion")
      VALUES (${consentId}, 'admissions-processing', 'enquiry-contact-details', true, ${now}, 'form-declared', ${input.noticeVersion})`;
    await tx`INSERT INTO "WebSubmission" ("id","kind","receivedAt","leadId","applicantName","applicantEmail","applicantPhone","coverNote","sourcePath","noticeVersion","turnstileOutcome","ipHash","status")
      VALUES (${submissionId}, 'enquiry', ${now}, ${leadId}, ${input.parentName}, ${input.parentEmail ?? null}, ${input.parentPhone}, ${input.note ?? null}, ${input.sourcePath}, ${input.noticeVersion}, ${input.turnstileOutcome}, ${input.ipHash ?? null}, 'received')`;
  });
  return { leadId, submissionId };
}

export interface ApplicationInput {
  kind: 'careers' | 'internship';
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  coverNote?: string | undefined;
  talentPoolConsent: boolean;
  cv: { bytes: Uint8Array; sha256: string; mimeDetected: string; originalFilename: string };
  sourcePath: string;
  noticeVersion: string;
  turnstileOutcome: string;
  ipHash?: string | undefined;
}

export async function insertApplication(
  sql: Sql,
  input: ApplicationInput,
): Promise<{ candidacyId: string; submissionId: string; documentId: string }> {
  const now = new Date();
  const candidacyId = mintId();
  const submissionId = mintId();
  const documentId = mintId();
  await sql.begin(async (tx) => {
    await tx`INSERT INTO "Candidacy" ("id","stage") VALUES (${candidacyId}, 'applied')`;
    await tx`INSERT INTO "ConsentRecord" ("id","purpose","dataCategory","granted","at","method","packVersion")
      VALUES (${mintId()}, 'recruitment-processing', 'application-and-cv', true, ${now}, 'form-declared', ${input.noticeVersion})`;
    if (input.talentPoolConsent) {
      await tx`INSERT INTO "ConsentRecord" ("id","purpose","dataCategory","granted","at","method","packVersion")
        VALUES (${mintId()}, 'recruitment-talent-pool', 'application-and-cv', true, ${now}, 'form-declared', ${input.noticeVersion})`;
    }
    await tx`INSERT INTO "WebSubmission" ("id","kind","receivedAt","candidacyId","applicantName","applicantEmail","applicantPhone","coverNote","sourcePath","noticeVersion","turnstileOutcome","ipHash","status")
      VALUES (${submissionId}, ${input.kind}, ${now}, ${candidacyId}, ${input.applicantName}, ${input.applicantEmail}, ${input.applicantPhone}, ${input.coverNote ?? null}, ${input.sourcePath}, ${input.noticeVersion}, ${input.turnstileOutcome}, ${input.ipHash ?? null}, 'received')`;
    await tx`INSERT INTO "WebDocument" ("id","submissionId","bytes","sha256","sizeBytes","mimeDetected","originalFilename","uploadedAt","scanStatus","retentionClass")
      VALUES (${documentId}, ${submissionId}, ${input.cv.bytes}, ${input.cv.sha256}, ${input.cv.bytes.length}, ${input.cv.mimeDetected}, ${input.cv.originalFilename}, ${now}, 'pending', 'cv-12mo')`;
  });
  return { candidacyId, submissionId, documentId };
}

/** In-store rate limit (WA-39 edge-side fallback until the zone WAF rule
 *  lands): submissions from one ipHash in the last hour. */
export async function recentSubmissionCount(sql: Sql, ipHash: string): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM "WebSubmission"
    WHERE "ipHash" = ${ipHash} AND "receivedAt" > ${new Date(Date.now() - 3600_000)}`;
  return rows[0]?.n ?? 0;
}

/** Execute the purge plan transactionally; every run leaves an audit row. */
export async function runPurge(sql: Sql, now = new Date()): Promise<PurgePlan & { rowsDeleted: number }> {
  const submissions = await sql`SELECT "id","kind","receivedAt","status","migratedAt" FROM "WebSubmission"`;
  const documents = await sql`SELECT "id","submissionId","uploadedAt","scanStatus" FROM "WebDocument"`;
  const plan = planPurge(
    now,
    submissions.map((s) => ({ ...s, receivedAt: new Date(s.receivedAt), migratedAt: s.migratedAt ? new Date(s.migratedAt) : null })) as never,
    documents.map((d) => ({ ...d, uploadedAt: new Date(d.uploadedAt) })) as never,
  );

  let rowsDeleted = 0;
  await sql.begin(async (tx) => {
    if (plan.submissionIds.length > 0) {
      const subs = await tx`SELECT "id","leadId","candidacyId" FROM "WebSubmission" WHERE "id" IN ${tx(plan.submissionIds)}`;
      const leadIds = subs.map((s) => s.leadId).filter(Boolean);
      const candidacyIds = subs.map((s) => s.candidacyId).filter(Boolean);
      rowsDeleted += (await tx`DELETE FROM "WebDocument" WHERE "submissionId" IN ${tx(plan.submissionIds)}`).count;
      rowsDeleted += (await tx`DELETE FROM "WebSubmission" WHERE "id" IN ${tx(plan.submissionIds)}`).count;
      if (leadIds.length > 0) rowsDeleted += (await tx`DELETE FROM "Lead" WHERE "id" IN ${tx(leadIds)}`).count;
      if (candidacyIds.length > 0) rowsDeleted += (await tx`DELETE FROM "Candidacy" WHERE "id" IN ${tx(candidacyIds)}`).count;
      // ConsentRecord rows purge with their envelope (register-note):
      // orphaned consent about deleted data serves nothing.
    }
    if (plan.quarantineDocIds.length > 0) {
      rowsDeleted += (await tx`DELETE FROM "WebDocument" WHERE "id" IN ${tx(plan.quarantineDocIds)}`).count;
    }
    await tx`INSERT INTO "WebPurgeRun" ("id","ranAt","rule","rowsDeleted","detail")
      VALUES (${mintId()}, ${now}, 'wa-34-daily', ${rowsDeleted}, ${tx.json(plan.reasons)})`;
  });

  return { ...plan, rowsDeleted };
}
