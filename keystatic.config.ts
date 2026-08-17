// Keystatic (WA-4): Tier B editing surface, local mode for Phase 0
// (github mode is a Phase 1 decision needing a GitHub App).
//
// ── MEDIA RULE (brief §9a / DoD #10, met-by-intent as ratified by VK) ──
// Keystatic has NO external-storage support; its built-in image field
// commits binaries to git, which §9a forbids. Therefore there is NO
// fields.image ANYWHERE in this config — structurally, Keystatic cannot
// ingest a binary. Images are referenced by Cloudflare Images ID, uploaded
// through `pnpm media` (tools/media-upload), which enforces the WA-38
// identifiable-child gate.
//
// Field definitions are hand-written mirrors of packages/content-schema —
// drift is pinned by sites/group/test/schemas.test.ts round-trips.
//
// NOTE: paths are relative to the Astro project (sites/group) because
// local-mode Keystatic resolves from the dev-server cwd. When github mode
// lands (Phase 1), these become repo-root-relative: content/news/* etc.
import { config, collection, fields } from '@keystatic/core';

// STORAGE MODES (VK 2026-07-20: comms deliver via GitHub):
//   local  — `pnpm keystatic` on a dev machine (repo checkout required)
//   github — the deployed admin at /keystatic; comms sign in with GitHub,
//            edits become branches + PRs (branch protection stands).
//            Enabled by the KEYSTATIC_GITHUB=1 build variable; needs the
//            GitHub App + Worker secrets from docs/Comms Publishing Guide.
const storage =
  process.env.KEYSTATIC_GITHUB === '1'
    ? ({ kind: 'github', repo: { owner: 'vardan-kabra', name: 'fountainhead-web' } } as const)
    : ({ kind: 'local' } as const);

const campusOptions = [
  { label: 'Group (all campuses)', value: 'group' },
  { label: 'Kunkni', value: 'kunkni' },
  { label: 'Malgama', value: 'malgama' },
  { label: 'FWGS', value: 'fwgs' },
  { label: 'FALH', value: 'falh' },
  { label: 'FASV', value: 'fasv' },
  // Preschool estate (WA-47) — without these, Adajan and Vesu cannot be
  // selected for any CMS-managed content.
  { label: 'Fountainhead Preschool Adajan', value: 'adajan' },
  { label: 'Fountainhead Preschool Vesu', value: 'vesu' },
];

// Cloudflare Images reference — id + alt, never a file.
const imageRef = (label: string) =>
  fields.object(
    {
      id: fields.text({
        label: `${label} — Cloudflare Image ID`,
        description: 'From `pnpm media upload <file>`. Never paste a file path.',
        validation: { isRequired: true },
      }),
      alt: fields.text({
        label: `${label} — alt text`,
        description: 'Describe the image for screen readers. Leave empty ONLY if purely decorative.',
      }),
    },
    { label },
  );

export default config({
  storage,
  ui: { brand: { name: 'Fountainhead Web' } },
  collections: {
    news: collection({
      label: 'News',
      path: '../../content/news/*',
      slugField: 'title',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishDate: fields.date({ label: 'Publish date', validation: { isRequired: true } }),
        campus: fields.select({ label: 'Campus', options: campusOptions, defaultValue: 'group' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: true }),
        body: fields.markdoc({ label: 'Body' }),
      },
    }),
    events: collection({
      label: 'Events',
      path: '../../content/events/*',
      slugField: 'title',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        start: fields.date({ label: 'Start date', validation: { isRequired: true } }),
        end: fields.date({ label: 'End date' }),
        campus: fields.select({ label: 'Campus', options: campusOptions, defaultValue: 'group' }),
        location: fields.text({ label: 'Location' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: true }),
        body: fields.markdoc({ label: 'Details' }),
      },
    }),
    testimonials: collection({
      label: 'Testimonials',
      path: '../../content/testimonials/*',
      slugField: 'attribution',
      format: { data: 'yaml' },
      schema: {
        quote: fields.text({ label: 'Quote', multiline: true, validation: { isRequired: true } }),
        attribution: fields.slug({ name: { label: 'Attribution' } }),
        role: fields.text({ label: 'Role (e.g. Parent, PYP 4)' }),
        // WA-49. `type` is REQUIRED by testimonialSchema — without it here,
        // every CMS-authored testimonial fails content validation and breaks
        // the build. Student is offered but gated: it needs a logged
        // consentRef to parse at all, and still does not publish until SHP
        // exists (isPublishableTestimonial).
        type: fields.select({
          label: 'Who is speaking',
          description: 'Student testimonials need a logged consent reference and do not publish yet (WA-49).',
          options: [
            { label: 'Parent', value: 'parent' },
            { label: 'Staff', value: 'staff' },
            { label: 'Student — needs consent reference', value: 'student' },
          ],
          defaultValue: 'parent',
        }),
        consentRef: fields.text({
          label: 'Consent reference (required for student testimonials)',
          description: 'Logged consent record on the WA-41 pattern. Leave blank for parent/staff.',
        }),
        campus: fields.select({ label: 'Campus', options: campusOptions, defaultValue: 'group' }),
      },
    }),
    galleries: collection({
      label: 'Galleries',
      path: '../../content/galleries/*',
      slugField: 'title',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        campus: fields.select({ label: 'Campus', options: campusOptions, defaultValue: 'group' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: true }),
        images: fields.array(
          fields.object({
            ref: imageRef('Image'),
            caption: fields.text({ label: 'Caption' }),
            // WA-41: the manual consent check travels WITH the publication.
            // WA-38: any identifiable child → the upload tool already
            // refused it; this log records the human check.
            consentCheck: fields.object(
              {
                checkedBy: fields.text({ label: 'Checked by (staff name)', validation: { isRequired: true } }),
                checkedOn: fields.date({ label: 'Checked on', validation: { isRequired: true } }),
                consentRef: fields.text({
                  label: 'Consent reference',
                  description: "Paper register reference, or 'no-identifiable-child' for scenery/facilities.",
                  validation: { isRequired: true },
                }),
              },
              { label: 'Consent check (WA-41 log — required)' },
            ),
          }),
          { label: 'Images', itemLabel: (p) => p.fields.caption.value || p.fields.ref.fields.id.value },
        ),
      },
    }),
    programmes: collection({
      label: 'FALH Programmes',
      path: '../../content/campuses/falh/programmes/*',
      slugField: 'title',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Programme title' } }),
        audience: fields.select({
          label: 'Audience',
          description: 'Drives navigation and conversion paths (WA-35): preschool = FASV feeder; after-school = open to all schools.',
          options: [
            { label: 'Preschool', value: 'preschool' },
            { label: 'After-school', value: 'after-school' },
          ],
          defaultValue: 'after-school',
        }),
        ageBand: fields.object(
          {
            min: fields.integer({ label: 'Age from', validation: { isRequired: true } }),
            max: fields.integer({ label: 'Age to', validation: { isRequired: true } }),
          },
          { label: 'Age band' },
        ),
        batches: fields.array(
          fields.object({
            days: fields.text({ label: 'Days (e.g. Tue-Thu)', validation: { isRequired: true } }),
            time: fields.text({ label: 'Time (e.g. 17:00-18:00)', validation: { isRequired: true } }),
          }),
          { label: 'Batches', itemLabel: (p) => `${p.fields.days.value} ${p.fields.time.value}` },
        ),
        enrolmentStatus: fields.select({
          label: 'Enrolment status',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Waitlist', value: 'waitlist' },
            { label: 'Closed', value: 'closed' },
          ],
          defaultValue: 'open',
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: true }),
        body: fields.markdoc({ label: 'Description' }),
      },
    }),
  },
});
