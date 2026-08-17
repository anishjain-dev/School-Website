// WA-39 layer 4 — the quarantine scanner. Claims pending WebDocuments,
// streams bytes to clamd (local container now; the India scan host after
// Phase 0 — the gate is fail-closed either way: pending = unservable).
// Single pass per invocation (cron/systemd-timer friendly): --watch loops.
import { connect } from '../src/db';
import { scanBytes } from '@fountainhead-web/form-security/clamd';

const dsn = process.env.DATABASE_URL ?? 'postgresql://fw:fw@localhost:15432/fw_interim';
const host = process.env.CLAMD_HOST ?? '127.0.0.1';
const port = Number(process.env.CLAMD_PORT ?? 3310);
const watch = process.argv.includes('--watch');

async function pass(): Promise<number> {
  const sql = connect(dsn);
  const docs = await sql`SELECT "id","bytes" FROM "WebDocument" WHERE "scanStatus" = 'pending' ORDER BY "uploadedAt" LIMIT 20`;
  let handled = 0;
  for (const doc of docs) {
    const result = await scanBytes(doc.bytes as Uint8Array, host, port);
    await sql`UPDATE "WebDocument" SET "scanStatus" = ${result.status}, "scannedAt" = ${new Date()} WHERE "id" = ${doc.id}`;
    console.log(`scan: ${doc.id} → ${result.status} (${result.detail})`);
    handled++;
  }
  await sql.end();
  return handled;
}

if (watch) {
  for (;;) {
    await pass();
    await new Promise((r) => setTimeout(r, 15_000));
  }
} else {
  const n = await pass();
  console.log(`scan: pass complete, ${n} document(s) processed`);
}
