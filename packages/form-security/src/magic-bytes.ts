// WA-39 layer 1: magic-byte validation. NEVER trust the extension — the
// file's actual signature must match its claim, and the claim must be on
// the allowlist (layer 2). Dependency-free on purpose: the checks below
// ARE the security property, spelled out and unit-tested (DoD 9: an .exe
// renamed .pdf is rejected here).

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;
export const MAX_CV_BYTES = 5 * 1024 * 1024; // WA-39 layer 3

export interface Verdict {
  ok: boolean;
  mime: string;
  reason: string;
}

const at = (buf: Uint8Array, offset: number, bytes: number[]): boolean =>
  bytes.every((b, i) => buf[offset + i] === b);

const contains = (buf: Uint8Array, ascii: string, limit = buf.length): boolean => {
  const needle = [...ascii].map((c) => c.charCodeAt(0));
  outer: for (let i = 0; i <= Math.min(limit, buf.length) - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (buf[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
};

export function validateCv(filename: string, buf: Uint8Array): Verdict {
  const ext = (filename.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase();
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, mime: '', reason: `extension '${ext || '(none)'}' not in allowlist (${ALLOWED_EXTENSIONS.join(', ')})` };
  }
  if (buf.length === 0) return { ok: false, mime: '', reason: 'empty file' };
  if (buf.length > MAX_CV_BYTES) return { ok: false, mime: '', reason: `over the ${MAX_CV_BYTES / 1024 / 1024}MB cap` };

  // %PDF-
  if (ext === '.pdf') {
    return at(buf, 0, [0x25, 0x50, 0x44, 0x46, 0x2d])
      ? { ok: true, mime: 'application/pdf', reason: 'pdf signature' }
      : { ok: false, mime: '', reason: 'claimed .pdf but no %PDF- signature' };
  }

  // OLE CFB (D0 CF 11 E0 A1 B1 1A E1). Admits any OLE container (xls, msi
  // shells) — acceptable because .doc never serves inline and sits behind
  // the scan gate (layers 4/6).
  if (ext === '.doc') {
    return at(buf, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
      ? { ok: true, mime: 'application/msword', reason: 'ole-cfb signature' }
      : { ok: false, mime: '', reason: 'claimed .doc but no OLE signature' };
  }

  // .docx: PK zip is NECESSARY but not sufficient (any zip matches) —
  // require OOXML markers: [Content_Types].xml near the front and a word/
  // entry anywhere. A generic zip renamed .docx is a rejection.
  if (!at(buf, 0, [0x50, 0x4b, 0x03, 0x04])) {
    return { ok: false, mime: '', reason: 'claimed .docx but not a zip container' };
  }
  if (!contains(buf, '[Content_Types].xml', 4096) || !contains(buf, 'word/')) {
    return { ok: false, mime: '', reason: 'zip container without OOXML word/ structure — not a real .docx' };
  }
  return { ok: true, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', reason: 'ooxml docx structure' };
}
