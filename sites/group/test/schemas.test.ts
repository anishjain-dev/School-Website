// Schema round-trips: fixtures in the exact shape Keystatic writes (.mdoc
// frontmatter / YAML) must parse through the content-schema Zod schemas.
// Keystatic cannot consume Zod, so its field config is a hand-written
// mirror — drift between the two becomes a red test here, not silent
// runtime breakage (see keystatic.config.ts).
import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import {
  campusConfigSchema,
  gallerySchema,
  newsSchema,
  eventSchema,
  testimonialSchema,
  isPublishableTestimonial,
  programmeSchema,
  policySchema,
  statutorySchema,
  calendarSchema,
  imageRefSchema,
} from '@fountainhead-web/content-schema';

describe('keystatic round-trips', () => {
  it('news .mdoc frontmatter parses', () => {
    const mdoc = ['---', 'title: Sports day roundup', 'publishDate: 2026-09-01', 'campus: kunkni', 'draft: false', '---', '', 'Body text.'].join('\n');
    expect(() => newsSchema.parse(matter(mdoc).data)).not.toThrow();
  });

  it('event .mdoc frontmatter parses', () => {
    const mdoc = ['---', 'title: PTM', 'start: 2026-09-20', 'campus: group', '---', ''].join('\n');
    expect(() => eventSchema.parse(matter(mdoc).data)).not.toThrow();
  });

  it('testimonial yaml parses', () => {
    const yaml = 'quote: Great school\nattribution: A Parent\ntype: parent\ncampus: fwgs\n';
    expect(() => testimonialSchema.parse(parseYaml(yaml))).not.toThrow();
  });

  it('testimonial type is REQUIRED (WA-49)', () => {
    const yaml = 'quote: Great school\nattribution: A Parent\ncampus: fwgs\n';
    expect(() => testimonialSchema.parse(parseYaml(yaml))).toThrow();
  });

  it('student testimonial without a logged consentRef is rejected (WA-49/WA-19)', () => {
    const yaml = 'quote: I love it here\nattribution: A Student\ntype: student\ncampus: kunkni\n';
    expect(() => testimonialSchema.parse(parseYaml(yaml))).toThrow(/consentRef/);
  });

  it('student testimonial with a consentRef parses, but still does not publish (WA-49)', () => {
    const yaml =
      'quote: I love it here\nattribution: A Student\ntype: student\ncampus: kunkni\nconsentRef: SHP-2026-0142\n';
    const parsed = testimonialSchema.parse(parseYaml(yaml));
    expect(parsed.consentRef).toBe('SHP-2026-0142');
    // Schema-valid is not the same as publishable — students are held back
    // until SHP exists, regardless of consent being on file.
    expect(isPublishableTestimonial(parsed)).toBe(false);
  });

  it('parent and staff testimonials publish', () => {
    expect(isPublishableTestimonial({ type: 'parent' })).toBe(true);
    expect(isPublishableTestimonial({ type: 'staff' })).toBe(true);
  });

  it('the publish gate is an allowlist — an unknown type is withheld (hard rule 6)', () => {
    // A type added to the enum later must NOT become public just by existing.
    expect(isPublishableTestimonial({ type: 'alumnus' as never })).toBe(false);
  });

  it('gallery yaml with consent log parses; consentCheck is REQUIRED (WA-41)', () => {
    const good = parseYaml(
      [
        'title: Annual day',
        'date: 2026-12-01',
        'campus: kunkni',
        'images:',
        '  - ref: { id: "abc123", alt: "Stage decorations" }',
        '    consentCheck: { checkedBy: comms-a, checkedOn: 2026-12-01, consentRef: no-identifiable-child }',
      ].join('\n'),
    );
    expect(() => gallerySchema.parse(good)).not.toThrow();

    const missingConsent = parseYaml(
      ['title: Annual day', 'date: 2026-12-01', 'images:', '  - ref: { id: "abc123", alt: "Stage" }'].join('\n'),
    );
    expect(() => gallerySchema.parse(missingConsent)).toThrow();
  });

  it('programme .mdoc frontmatter parses (both audiences)', () => {
    for (const audience of ['preschool', 'after-school']) {
      const fm = { title: 'X', audience, ageBand: { min: 3, max: 6 } };
      expect(() => programmeSchema.parse(fm)).not.toThrow();
    }
  });
});

describe('schema guards', () => {
  it('campus config rejects bad slugs and unknown brands', () => {
    const base = {
      slug: 'kunkni',
      name: 'FSK',
      brand: 'fountainhead',
      jurisdiction: 'gujarat',
      address: { line1: 'x', city: 'Surat', state: 'Gujarat', pincode: '395007' },
    };
    expect(() => campusConfigSchema.parse(base)).not.toThrow();
    expect(() => campusConfigSchema.parse({ ...base, slug: 'Kun kni' })).toThrow();
    expect(() => campusConfigSchema.parse({ ...base, brand: 'wockhardt' })).toThrow();
  });

  it('campus config defaults inherit to mode all', () => {
    const parsed = campusConfigSchema.parse({
      slug: 'malgama',
      name: 'FSM',
      brand: 'fountainhead',
      jurisdiction: 'gujarat',
      address: { line1: 'x', city: 'Surat', state: 'Gujarat', pincode: '395005' },
    });
    expect(parsed.inherit).toEqual({ mode: 'all', exclude: [], include: [] });
  });

  it('imageRef requires an id; alt may be empty (decorative) but must exist', () => {
    expect(() => imageRefSchema.parse({ id: 'x', alt: '' })).not.toThrow();
    expect(() => imageRefSchema.parse({ id: '', alt: 'x' })).toThrow();
    expect(() => imageRefSchema.parse({ id: 'x' })).toThrow();
  });

  it('policy front-matter carries version, date, owner (WA-13)', () => {
    expect(() =>
      policySchema.parse({ title: 'Uniform', category: 'school', version: '3.0', effectiveDate: '2026-06-01', owner: 'HoSO' }),
    ).not.toThrow();
    expect(() => policySchema.parse({ title: 'Uniform', category: 'school' })).toThrow();
  });

  it('statutory defaults to disabled (dormant, WA-14) and passes unknown future fields through', () => {
    const parsed = statutorySchema.parse({ campus: 'kunkni', jurisdiction: 'gujarat', someFutureBoardField: 'x' });
    expect(parsed.enabled).toBe(false);
    expect((parsed as Record<string, unknown>).someFutureBoardField).toBe('x');
  });

  it('calendar entries use the Nucleus CalendarEntry vocabulary (WA-40 copy-not-transform)', () => {
    expect(() =>
      calendarSchema.parse({
        campus: 'kunkni',
        academicYear: '2026-27',
        entries: [{ date: '2026-08-15', title: 'Independence Day', kind: 'holiday', appliesTo: 'both' }],
      }),
    ).not.toThrow();
    expect(() =>
      calendarSchema.parse({ campus: 'kunkni', academicYear: '2026-27', entries: [{ date: '2026-08-15', title: 'X', kind: 'party' }] }),
    ).toThrow();
  });
});
