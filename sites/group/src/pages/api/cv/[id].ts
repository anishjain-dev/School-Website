// WA-39 layer 6 — safe CV serving. Three locks, all fail-closed:
//   1. scanStatus must be 'clean' (an unscanned file is UNSERVABLE);
//   2. a short-lived HMAC token must verify (minted for staff only);
//   3. Cloudflare Access fronts /api/cv/* in production (HR allowlist).
// Response: forced download, randomised filename, nosniff, CSP sandbox,
// no caching — never inline, never from a cacheable path.
import type { APIRoute } from 'astro';
import { verifyCvToken } from '@fountainhead-web/form-security';
import { connect } from '@fountainhead-web/interim-store';
import { runtimeEnv, dbUrl } from '../../../lib/env';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const env = runtimeEnv(ctx);
  const id = ctx.params.id!;
  const token = ctx.url.searchParams.get('token') ?? '';
  const key = env.DOC_SIGNING_KEY ?? 'dev-signing-key';

  if (!(await verifyCvToken(key, id, token))) {
    return new Response('invalid or expired token', { status: 403 });
  }

  const sql = connect(dbUrl(env));
  const rows = await sql`SELECT "bytes","mimeDetected","scanStatus" FROM "WebDocument" WHERE "id" = ${id}`;
  await sql.end();
  const doc = rows[0];
  if (!doc) return new Response('not found', { status: 404 });
  if (doc.scanStatus !== 'clean') {
    return new Response(`document not servable (scan status: ${doc.scanStatus})`, { status: 409 });
  }

  const ext = doc.mimeDetected === 'application/pdf' ? 'pdf' : doc.mimeDetected === 'application/msword' ? 'doc' : 'docx';
  return new Response(doc.bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="cv-${id}.${ext}"`,
      'x-content-type-options': 'nosniff',
      'content-security-policy': 'sandbox',
      'cache-control': 'no-store',
    },
  });
};
