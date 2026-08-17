// Shared form-endpoint pipeline (WA-39 order is the security design):
// size pre-check → parse → honeypot → shape validation → Turnstile
// siteverify → rate limit → CV magic bytes → single transaction → PRG.
import type { APIContext } from 'astro';
import {
  enquiryFormSchema,
  applicationFormSchema,
  validateCv,
  verifyTurnstile,
  hashIp,
  MAX_CV_BYTES,
} from '@fountainhead-web/form-security';
import { connect, insertEnquiry, insertApplication, recentSubmissionCount } from '@fountainhead-web/interim-store';
import { runtimeEnv, dbUrl, turnstileSecret } from './env';
import { sendAlert } from './notify';

export const NOTICE_VERSION = 'v0.1-prelaunch';
const RATE_LIMIT_PER_HOUR = 8;

const redirect = (ctx: APIContext, to: string) => ctx.redirect(to, 303);
const reject = (status: number, message: string) =>
  new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

type GateResult =
  | { drop: Response }
  | { env: ReturnType<typeof runtimeEnv>; sql: ReturnType<typeof connect>; ipHash: string; turnstileOutcome: string };

async function commonGate(ctx: APIContext, form: FormData): Promise<GateResult> {
  const env = runtimeEnv(ctx);

  // Honeypot (silent drop — bots get a success face)
  if ((form.get('website') as string | null)?.length) {
    return { drop: redirect(ctx, '/thank-you/') };
  }

  const token = (form.get('cf-turnstile-response') as string | null) ?? '';
  const ip = ctx.request.headers.get('cf-connecting-ip') ?? '127.0.0.1';
  const turnstile = await verifyTurnstile(turnstileSecret(env), token, ip);
  if (!turnstile.success) {
    return { drop: reject(403, 'Verification failed — please reload the page and try again.') };
  }

  const ipHash = await hashIp(ip, env.IP_SALT ?? 'dev-salt');
  const sql = connect(dbUrl(env));
  if ((await recentSubmissionCount(sql, ipHash)) >= RATE_LIMIT_PER_HOUR) {
    await sql.end();
    return { drop: reject(429, 'Too many submissions — please try again later.') };
  }
  return { env, sql, ipHash, turnstileOutcome: 'pass' };
}

export async function handleEnquiry(ctx: APIContext): Promise<Response> {
  const length = Number(ctx.request.headers.get('content-length') ?? 0);
  if (length > 512 * 1024) return reject(413, 'Request too large.');

  const form = await ctx.request.formData();
  const gate = await commonGate(ctx, form);
  if ('drop' in gate) return gate.drop;

  const parsed = enquiryFormSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')));
  if (!parsed.success) {
    await gate.sql.end();
    return reject(400, `Please check the form: ${parsed.error.issues.map((i) => `${i.path.join('.')} — ${i.message}`).join('; ')}`);
  }

  const { leadId } = await insertEnquiry(gate.sql, {
    ...parsed.data,
    sourcePath: new URL(ctx.request.headers.get('referer') ?? ctx.url).pathname,
    noticeVersion: NOTICE_VERSION,
    turnstileOutcome: gate.turnstileOutcome,
    ipHash: gate.ipHash,
  });
  await gate.sql.end();

  await sendAlert(gate.env, `New visit enquiry — ${parsed.data.childName}`, [
    `Parent: ${parsed.data.parentName} (${parsed.data.parentPhone})`,
    `Campus: ${parsed.data.campus ?? 'unspecified'}`,
    `Lead: ${leadId}`,
  ]);
  return redirect(ctx, '/thank-you/');
}

export async function handleApplication(ctx: APIContext, kind: 'careers' | 'internship'): Promise<Response> {
  const length = Number(ctx.request.headers.get('content-length') ?? 0);
  if (length > MAX_CV_BYTES + 512 * 1024) return reject(413, 'Request too large — CVs are capped at 5MB.');

  const form = await ctx.request.formData();
  const gate = await commonGate(ctx, form);
  if ('drop' in gate) return gate.drop;

  const parsed = applicationFormSchema.safeParse(
    Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')),
  );
  if (!parsed.success) {
    await gate.sql.end();
    return reject(400, `Please check the form: ${parsed.error.issues.map((i) => `${i.path.join('.')} — ${i.message}`).join('; ')}`);
  }

  const cv = form.get('cv');
  if (!(cv instanceof File) || cv.size === 0) {
    await gate.sql.end();
    return reject(400, 'A CV file is required (.pdf, .doc or .docx, up to 5MB).');
  }
  const bytes = new Uint8Array(await cv.arrayBuffer());
  const verdict = validateCv(cv.name, bytes);
  if (!verdict.ok) {
    await gate.sql.end();
    return reject(422, `CV rejected: ${verdict.reason}`);
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  const { candidacyId } = await insertApplication(gate.sql, {
    kind,
    applicantName: parsed.data.applicantName,
    applicantEmail: parsed.data.applicantEmail,
    applicantPhone: parsed.data.applicantPhone,
    coverNote: parsed.data.coverNote,
    talentPoolConsent: parsed.data.talentPoolConsent,
    cv: { bytes, sha256, mimeDetected: verdict.mime, originalFilename: cv.name },
    sourcePath: new URL(ctx.request.headers.get('referer') ?? ctx.url).pathname,
    noticeVersion: NOTICE_VERSION,
    turnstileOutcome: gate.turnstileOutcome,
    ipHash: gate.ipHash,
  });
  await gate.sql.end();

  await sendAlert(gate.env, `New ${kind} application — ${parsed.data.applicantName}`, [
    `Email: ${parsed.data.applicantEmail}`,
    `Candidacy: ${candidacyId}`,
    'CV: quarantined pending scan (unservable until clean).',
  ]);
  return redirect(ctx, '/thank-you/');
}
