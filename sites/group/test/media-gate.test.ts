// WA-38 gate: the upload tool is the ONLY door into the media store, and it
// must refuse any image containing an identifiable child, pointing to SHP
// (manual WA-41 log until SHP exists). The gate is a pure function so the
// rule is testable without credentials or network.
import { describe, expect, it } from 'vitest';
import { gate, ALLOWED_IMAGE_EXTENSIONS } from '../../../tools/media-upload/gate.mjs';

describe('media upload gate (WA-38)', () => {
  it('refuses when the image contains an identifiable child', () => {
    const verdict = gate({ containsIdentifiableChild: true, filename: 'sports-day.jpg' });
    expect(verdict.allowed).toBe(false);
    expect(verdict.message).toMatch(/SHP/);
    expect(verdict.message).toMatch(/WA-38/);
  });

  it('allows a no-child image with an allowed extension', () => {
    const verdict = gate({ containsIdentifiableChild: false, filename: 'campus-lawn.jpg' });
    expect(verdict.allowed).toBe(true);
  });

  it('refuses non-image files regardless of the child answer', () => {
    const verdict = gate({ containsIdentifiableChild: false, filename: 'cv.pdf' });
    expect(verdict.allowed).toBe(false);
  });

  it('extension allowlist is closed (never a blocklist)', () => {
    expect(ALLOWED_IMAGE_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
  });
});
