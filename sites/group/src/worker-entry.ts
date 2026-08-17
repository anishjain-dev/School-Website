// Custom Worker entry: Astro handles fetch; `scheduled` runs the WA-34
// purge on the cron trigger (wrangler.jsonc: 03:00 IST daily). One Worker,
// both faces — the purge job lives WITH the store's front door from day
// one (WA-40 binding condition 3).
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import { connect, runPurge } from '@fountainhead-web/interim-store';

interface Env {
  DB?: { connectionString: string };
  DATABASE_URL?: string;
}

// Minimal structural types — enough for our two handlers without pulling
// @cloudflare/workers-types into a DOM-typed project.
interface WorkerCtx {
  waitUntil(promise: Promise<unknown>): void;
}
interface ScheduledCtrl {
  cron: string;
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  return {
    default: {
      async fetch(request: Request, env: unknown, ctx: WorkerCtx) {
        return handle(manifest, app, request as never, env as never, ctx as never);
      },
      async scheduled(_controller: ScheduledCtrl, env: Env, _ctx: WorkerCtx) {
        const url = env.DB?.connectionString ?? env.DATABASE_URL;
        if (!url) {
          console.error('purge cron: no database configured (DB binding / DATABASE_URL secret)');
          return;
        }
        const sql = connect(url);
        try {
          const result = await runPurge(sql);
          console.log(
            `purge cron (wa-34-daily): ${result.rowsDeleted} rows deleted — ${result.submissionIds.length} submissions, ${result.quarantineDocIds.length} quarantine docs`,
          );
        } finally {
          await sql.end();
        }
      },
    },
  };
}
