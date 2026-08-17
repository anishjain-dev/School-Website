// Operational safety valve: `pnpm --filter @fountainhead-web/interim-store
// purge:dry` prints the plan against any DSN without deleting; without
// --dry-run it executes and writes the WebPurgeRun audit row.
import { connect, runPurge } from '../src/db';
import { planPurge } from '../src/purge';

const dsn = process.env.DATABASE_URL ?? 'postgresql://fw:fw@localhost:15432/fw_interim';
const dry = process.argv.includes('--dry-run');
const sql = connect(dsn);

if (dry) {
  const submissions = await sql`SELECT "id","kind","receivedAt","status","migratedAt" FROM "WebSubmission"`;
  const documents = await sql`SELECT "id","submissionId","uploadedAt","scanStatus" FROM "WebDocument"`;
  const plan = planPurge(
    new Date(),
    submissions.map((s) => ({ ...s, receivedAt: new Date(s.receivedAt), migratedAt: s.migratedAt ? new Date(s.migratedAt) : null })) as never,
    documents.map((d) => ({ ...d, uploadedAt: new Date(d.uploadedAt) })) as never,
  );
  console.log(`purge (dry-run): ${plan.submissionIds.length} submissions, ${plan.quarantineDocIds.length} quarantine docs would go`);
  for (const [id, reason] of Object.entries(plan.reasons)) console.log(`  ${id}: ${reason}`);
} else {
  const result = await runPurge(sql);
  console.log(`purge: ${result.rowsDeleted} rows deleted (${result.submissionIds.length} submissions, ${result.quarantineDocIds.length} quarantine docs)`);
}
await sql.end();
