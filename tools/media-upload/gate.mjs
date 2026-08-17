// The WA-38 gate as a pure function — the upload CLI is the only door into
// the media store, and this is the door's lock. Tested in
// sites/group/test/media-gate.test.ts.

// Closed allowlist (mirror of WA-39's principle: never a blocklist).
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

export function gate({ containsIdentifiableChild, filename }) {
  const ext = (filename.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      allowed: false,
      message: `'${ext || filename}' is not an allowed image type (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}).`,
    };
  }
  if (containsIdentifiableChild) {
    return {
      allowed: false,
      message:
        'REFUSED (WA-38): any identifiable child goes through SHP, never the CMS.\n' +
        'Until SHP is live (WA-41): check the signed paper consent register, then\n' +
        'publish via the gallery consent log — image, date, checking staff member,\n' +
        'consent reference. A manual check without a record is no check.',
    };
  }
  return { allowed: true, message: 'ok' };
}
