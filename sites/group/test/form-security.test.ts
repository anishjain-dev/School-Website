// WA-39 hardening suite. The DoD 9 regression test lives here: a Windows
// executable renamed to .pdf MUST be rejected by magic-byte validation.
import { describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:net';
import {
  validateCv,
  MAX_CV_BYTES,
  signCvToken,
  verifyCvToken,
  hashIp,
  enquiryFormSchema,
  applicationFormSchema,
} from '@fountainhead-web/form-security';
import { scanBytes } from '@fountainhead-web/form-security/clamd';

const bytes = (...parts: (string | number[])[]) => {
  const arrs = parts.map((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p));
  return new Uint8Array(arrs.flat());
};

describe('magic-byte validation (WA-39 layers 1–3)', () => {
  it('DoD 9: a .exe renamed to .pdf is REJECTED', () => {
    // MZ header — the PE executable signature — claiming to be a PDF.
    const exe = bytes([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00], 'fake pe body');
    const verdict = validateCv('resume.pdf', exe);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain('no %PDF- signature');
  });

  it('accepts a real PDF signature', () => {
    expect(validateCv('cv.pdf', bytes('%PDF-1.7\nrest of file')).ok).toBe(true);
  });

  it('accepts OLE .doc; rejects .doc without the OLE signature', () => {
    const ole = bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 'word content');
    expect(validateCv('cv.doc', ole).ok).toBe(true);
    expect(validateCv('cv.doc', bytes('plain text')).ok).toBe(false);
  });

  it('accepts real docx structure; rejects a generic zip renamed .docx', () => {
    const docx = bytes([0x50, 0x4b, 0x03, 0x04], '....[Content_Types].xml....word/document.xml....');
    expect(validateCv('cv.docx', docx).ok).toBe(true);
    const plainZip = bytes([0x50, 0x4b, 0x03, 0x04], '....random.txt content....');
    const verdict = validateCv('cv.docx', plainZip);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain('not a real .docx');
  });

  it('extension allowlist is closed — .exe, .zip, .html, no extension all rejected', () => {
    for (const name of ['cv.exe', 'cv.zip', 'cv.html', 'cv']) {
      expect(validateCv(name, bytes('%PDF-anything')).ok).toBe(false);
    }
  });

  it('enforces the 5MB cap and rejects empty files', () => {
    expect(validateCv('cv.pdf', new Uint8Array(0)).ok).toBe(false);
    const big = new Uint8Array(MAX_CV_BYTES + 1);
    big.set(bytes('%PDF-'), 0);
    expect(validateCv('cv.pdf', big).ok).toBe(false);
  });
});

describe('CV serving tokens (WA-39 layer 6)', () => {
  it('signs and verifies; expiry and tampering fail closed', async () => {
    const token = await signCvToken('k', 'doc1', Date.now() + 60_000);
    expect(await verifyCvToken('k', 'doc1', token)).toBe(true);
    expect(await verifyCvToken('k', 'doc2', token)).toBe(false); // different doc
    expect(await verifyCvToken('wrong', 'doc1', token)).toBe(false); // wrong key
    const expired = await signCvToken('k', 'doc1', Date.now() - 1);
    expect(await verifyCvToken('k', 'doc1', expired)).toBe(false);
    expect(await verifyCvToken('k', 'doc1', 'garbage')).toBe(false);
  });

  it('ip hashing is salted and stable', async () => {
    expect(await hashIp('1.2.3.4', 's')).toBe(await hashIp('1.2.3.4', 's'));
    expect(await hashIp('1.2.3.4', 's')).not.toBe(await hashIp('1.2.3.4', 'other'));
  });
});

describe('form schemas', () => {
  it('enquiry: accepts a sane submission, rejects implausible DOB', () => {
    const base = { parentName: 'A Parent', parentPhone: '+91 98765 43210', childName: 'A Child', childDob: '2019-06-01' };
    expect(enquiryFormSchema.safeParse(base).success).toBe(true);
    expect(enquiryFormSchema.safeParse({ ...base, childDob: '1980-01-01' }).success).toBe(false);
    expect(enquiryFormSchema.safeParse({ ...base, childDob: '2050-01-01' }).success).toBe(false);
  });

  it('application: talent-pool checkbox transforms to boolean', () => {
    const base = { applicantName: 'A Person', applicantEmail: 'a@b.co', applicantPhone: '9876543210' };
    expect(applicationFormSchema.parse({ ...base, talentPoolConsent: 'on' }).talentPoolConsent).toBe(true);
    expect(applicationFormSchema.parse(base).talentPoolConsent).toBe(false);
  });
});

describe('clamd INSTREAM client (WA-39 layer 4)', () => {
  // In-process mock speaking the clamd wire protocol; the real container
  // run is docker compose --profile scan (same code path).
  const EICAR = ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE', '!$H+H*'].join('');

  function mockClamd(): Promise<{ server: Server; port: number }> {
    return new Promise((resolve) => {
      const server = createServer((socket) => {
        const chunks: Buffer[] = [];
        socket.on('data', (d) => {
          chunks.push(d);
          const all = Buffer.concat(chunks);
          // zero-length chunk terminator observed → reply
          if (all.length > 10 && all.subarray(-4).equals(Buffer.from([0, 0, 0, 0]))) {
            const body = all.toString('latin1');
            socket.end(body.includes('EICAR-STANDARD') ? 'stream: Eicar-Signature FOUND\0' : 'stream: OK\0');
          }
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ server, port: (server.address() as { port: number }).port }));
    });
  }

  it('clean bytes → clean; EICAR → infected; dead port → failed', async () => {
    const { server, port } = await mockClamd();
    expect((await scanBytes(bytes('%PDF- harmless'), '127.0.0.1', port)).status).toBe('clean');
    expect((await scanBytes(bytes(EICAR), '127.0.0.1', port)).status).toBe('infected');
    server.close();
    expect((await scanBytes(bytes('x'), '127.0.0.1', 1)).status).toBe('failed');
  });
});
