// WA-39 layer 6 — safe serving: short-lived HMAC tokens for CV reads.
// The route additionally requires scanStatus='clean' (fail-closed gate)
// and responds attachment-only with a randomised name; Cloudflare Access
// fronts the whole path in production.

const enc = new TextEncoder();

async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export async function signCvToken(key: string, documentId: string, expiresAt: number): Promise<string> {
  return `${expiresAt}.${await hmac(key, `${documentId}.${expiresAt}`)}`;
}

export async function verifyCvToken(key: string, documentId: string, token: string): Promise<boolean> {
  const [expStr, sig] = token.split('.');
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = await hmac(key, `${documentId}.${expiresAt}`);
  // constant-time-ish compare
  if (!sig || sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
