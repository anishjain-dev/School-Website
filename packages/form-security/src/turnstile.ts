// Cloudflare Turnstile server-side verification (WA-39: the widget alone
// is decoration; siteverify is the check). Dummy keys make local dev and
// negative tests real: secret 1x…AA always passes, 2x…AA always fails.

export const TURNSTILE_TEST_SITEKEY_PASS = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_PASS = '1x0000000000000000000000000000000AA';
export const TURNSTILE_TEST_SECRET_FAIL = '2x0000000000000000000000000000000AA';

export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; errorCodes: string[] }> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  return { success: json.success === true, errorCodes: json['error-codes'] ?? [] };
}
