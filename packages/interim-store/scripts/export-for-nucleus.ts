// Anti-permanence (WA-40): the migration copy queries, written NOW so the
// interim store carries its own exit. At Nucleus 3.0 module go-live this
// emits per-table JSON that Nucleus imports verbatim (ids survive —
// cuid2). Nucleus-side acts: mint Person from the envelope precursors,
// stamp the nullable FKs, mark envelopes migrated (30-day purge follows).
// Sunsets: Lead → Admissions go-live; Candidacy/WebDocument → Recruitment
// go-live; ConsentRecord → R3-12 registry go-live.
import { writeFileSync, mkdirSync } from 'node:fs';
import { connect } from '../src/db';

const dsn = process.env.DATABASE_URL ?? 'postgresql://fw:fw@localhost:15432/fw_interim';
const out = process.argv[2] ?? '../../artifacts/nucleus-export';
const sql = connect(dsn);

mkdirSync(out, { recursive: true });
const tables = ['Lead', 'Requisition', 'Candidacy', 'ConsentRecord'] as const;
for (const t of tables) {
  const rows = await sql`SELECT * FROM ${sql(t)}`;
  writeFileSync(`${out}/${t}.json`, JSON.stringify(rows, null, 2));
  console.log(`export: ${t} — ${rows.length} rows`);
}
// Person-precursor map: envelope → the fields Nucleus needs to mint Person
const precursors = await sql`SELECT "id","kind","leadId","candidacyId","applicantName","applicantEmail","applicantPhone" FROM "WebSubmission" WHERE "status" = 'received'`;
writeFileSync(`${out}/person-precursors.json`, JSON.stringify(precursors, null, 2));
console.log(`export: person-precursors — ${precursors.length} rows → ${out}`);
await sql.end();
