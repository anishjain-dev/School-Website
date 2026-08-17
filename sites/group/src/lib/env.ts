// Runtime env access that works in both worlds: Cloudflare Workers
// (locals.runtime.env via the adapter) and local `astro dev` (process.env
// / .env). Secrets never ship in wrangler.jsonc vars.
import type { APIContext } from 'astro';
import { TURNSTILE_TEST_SECRET_PASS } from '@fountainhead-web/form-security';

export interface RuntimeEnv {
  DATABASE_URL?: string;
  DB?: { connectionString: string }; // Hyperdrive binding (credential sitting)
  TURNSTILE_SECRET?: string;
  DOC_SIGNING_KEY?: string;
  IP_SALT?: string;
  ALERT_EMAILS?: string;
}

export function runtimeEnv(ctx: APIContext): RuntimeEnv {
  const workerEnv = (ctx.locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {};
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string> } }).process?.env ?? {};
  return { ...nodeEnv, ...workerEnv } as RuntimeEnv;
}

export function dbUrl(env: RuntimeEnv): string {
  const url = env.DB?.connectionString ?? env.DATABASE_URL;
  if (!url) throw new Error('no database configured (DB binding or DATABASE_URL)');
  return url;
}

export function turnstileSecret(env: RuntimeEnv): string {
  // Dummy always-pass secret keeps dev/preview real without credentials;
  // the real key is a Worker secret from the credential sitting.
  return env.TURNSTILE_SECRET ?? TURNSTILE_TEST_SECRET_PASS;
}
