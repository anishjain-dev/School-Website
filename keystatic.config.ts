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
  import.meta.env.KEYSTATIC_GITHUB === '1'
    ? ({ kind: 'github', repo: { owner: 'vardan-kabra', name: 'fountainhead-web' } } as const)
    : ({ kind: 'local' } as const);

const campusOptions = [
  { label: 'Group (all campuses)', value: 'group' },
  { label: 'Kunkni', value: 'kunkni' },
  { label: 'Malgama', value: 'malgama' },
  { label: 'FWGS', value: 'fwgs' },
  { label: 'FALH', value: 'falh' },
  { label: 'FASV', value: 'fasv' },
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

// ── PAGE CONTENT SCHEMA ──────────────────────────────────────────────────────
// Shared across all campus content page collections. Mirrors pageSchema from
// packages/content-schema/src/page.ts — if that schema changes, update here.
const pageContentSchema = {
  title: fields.text({ label: 'Page title (H1)', validation: { isRequired: true } }),
  description: fields.text({ label: 'Meta description / excerpt', multiline: true }),
  template: fields.select({
    label: 'Page template',
    description: 'Controls which layout the page uses.',
    options: [
      { label: 'Content — standard rich text page', value: 'content' },
      { label: 'Admissions — with facts & FAQ panels', value: 'admissions' },
      { label: 'Contact — address + map + contacts', value: 'contact' },
      { label: 'Home — campus landing page', value: 'home' },
      { label: 'Early Years — preschool programme table', value: 'early-years' },
      { label: 'Programme — single programme detail', value: 'programme' },
      { label: 'Landing — minimal marketing page', value: 'landing' },
    ],
    defaultValue: 'content',
  }),
  draft: fields.checkbox({ label: 'Draft — hide from live site', defaultValue: false }),
  hideFromNav: fields.checkbox({ label: 'Hide from navigation', defaultValue: false }),
  order: fields.integer({ label: 'Nav order (lower = earlier)' }),
  facts: fields.array(
    fields.object({
      label: fields.text({ label: 'Label (e.g. Founded)', validation: { isRequired: true } }),
      value: fields.text({ label: 'Value (e.g. 2005)', validation: { isRequired: true } }),
    }),
    { label: 'Key facts / stats', itemLabel: (p) => `${p.fields.label.value}: ${p.fields.value.value}` },
  ),
  faq: fields.array(
    fields.object({
      q: fields.text({ label: 'Question', validation: { isRequired: true } }),
      a: fields.text({ label: 'Answer', multiline: true, validation: { isRequired: true } }),
    }),
    { label: 'FAQ', itemLabel: (p) => p.fields.q.value },
  ),
  body: fields.markdoc({
    label: 'Page body — use headings (##, ###) for sub-sections',
    description: 'Use ## for section headings, ### for sub-headings inside sections.',
  }),
};

// ── CAMPUS CONFIG SCHEMA (mirrors campusConfigSchema) ───────────────────────
const campusConfigFields = {
  // slugField points here — must be fields.slug(). Directory name = slug value.
  slug: fields.slug({ name: { label: 'Campus slug (URL segment, e.g. kunkni, malgama)' } }),
  name: fields.text({
    label: 'Full campus name (e.g. Fountainhead School Kunkni)',
    validation: { isRequired: true },
  }),
  shortName: fields.text({ label: 'Short name (e.g. FSK)' }),
  descriptor: fields.text({ label: 'Descriptor — one line shown on campus cards' }),
  launched: fields.checkbox({ label: 'Launched — visible on the live site', defaultValue: true }),
  brand: fields.select({
    label: 'Brand identity',
    description: 'Controls the colour palette and logo for this campus.',
    options: [
      { label: 'Fountainhead — main schools (blue)', value: 'fountainhead' },
      { label: 'FWGS — Wockhardt Global School', value: 'fwgs' },
      { label: 'FALH / Preschool (warm palette)', value: 'falh' },
      { label: 'FASV — Avadh School Vapi', value: 'fasv' },
    ],
    defaultValue: 'fountainhead',
  }),
  jurisdiction: fields.select({
    label: 'Jurisdiction',
    options: [
      { label: 'Gujarat', value: 'gujarat' },
      { label: 'Maharashtra', value: 'maharashtra' },
    ],
    defaultValue: 'gujarat',
  }),
  address: fields.object(
    {
      line1: fields.text({ label: 'Address line 1', validation: { isRequired: true } }),
      line2: fields.text({ label: 'Address line 2 / area' }),
      city: fields.text({ label: 'City', validation: { isRequired: true } }),
      state: fields.text({ label: 'State', validation: { isRequired: true } }),
      pincode: fields.text({ label: 'Pincode', validation: { isRequired: true } }),
    },
    { label: 'Address' },
  ),
  phone: fields.text({ label: 'Main phone number (e.g. +91 98765 43210)' }),
  email: fields.text({ label: 'Main email address' }),
  contacts: fields.array(
    fields.object({
      role: fields.select({
        label: 'Department',
        options: [
          { label: 'Admissions', value: 'admissions' },
          { label: 'Transport', value: 'transport' },
          { label: 'Front office', value: 'front-office' },
        ],
        defaultValue: 'admissions',
      }),
      phone: fields.text({ label: 'Phone' }),
      email: fields.text({ label: 'Email' }),
      hours: fields.text({ label: 'Office hours (e.g. Mon–Fri 8 am–4 pm)' }),
    }),
    { label: 'Department contacts', itemLabel: (p) => p.fields.role.value },
  ),
  social: fields.object(
    {
      instagram: fields.text({ label: 'Instagram handle (without @, e.g. fountainheadschools)' }),
      facebook: fields.text({ label: 'Facebook page handle' }),
      youtube: fields.text({ label: 'YouTube channel handle' }),
    },
    { label: 'Social media' },
  ),
  continuesAt: fields.text({
    label: 'Continues at (campus slug — preschools only)',
    description: 'Slug of the paired onward school, e.g. kunkni. Leave blank for schools.',
  }),
  domains: fields.array(
    fields.text({ label: 'Domain', validation: { isRequired: true } }),
    { label: 'Redirect domains (e.g. fsksurat.in)', itemLabel: (p) => p.value },
  ),
  inherit: fields.object(
    {
      mode: fields.select({
        label: 'Inherit group pages',
        options: [
          { label: 'All — every group page (default for new campuses)', value: 'all' },
          { label: 'Listed — only pages named in Include list below', value: 'listed' },
          { label: 'None — campus-specific content only, nothing inherited', value: 'none' },
        ],
        defaultValue: 'all',
      }),
      exclude: fields.array(
        fields.text({ label: 'Page ID (e.g. philosophy)', validation: { isRequired: true } }),
        { label: 'Exclude these group pages', itemLabel: (p) => p.value },
      ),
      include: fields.array(
        fields.text({ label: 'Page ID (e.g. about)', validation: { isRequired: true } }),
        { label: 'Include these group pages (listed mode only)', itemLabel: (p) => p.value },
      ),
    },
    { label: 'Page inheritance from group' },
  ),
};

// Helper: build a campus content-pages collection for one campus
const campusPageCollection = (campusSlug: string, label: string) =>
  collection({
    label,
    path: `../../content/campuses/${campusSlug}/*`,
    slugField: 'title',
    format: { contentField: 'body' },
    schema: pageContentSchema,
  });

export default config({
  storage,
  ui: {
    brand: { name: 'Fountainhead Web CMS' },
    navigation: {
      '🏫 Campus Settings': ['campuses'],
      '📄 Kunkni Pages': ['kunkniPages'],
      '📄 Malgama Pages': ['malgamaPages'],
      '📄 FWGS Pages': ['fwgsPages'],
      '📄 FALH Pages': ['falhPages'],
      '📄 FASV Pages': ['fasvPages'],
      '📄 FP Adajan Pages': ['adajanPages'],
      '📄 FP Vesu Pages': ['vesuPages'],
      '📰 News & Events': ['news', 'events'],
      '🎓 Student Voice': ['testimonials'],
      '🖼️ Galleries': ['galleries'],
      '📚 FALH Programmes': ['programmes'],
    },
  },
  collections: {
    // ── CAMPUS SETTINGS ────────────────────────────────────────────────────
    // Writes content/campuses/<slug>/_campus.yaml — read by Astro's campuses
    // collection at build time. slugField: 'slug' means the directory name
    // equals the slug value (kunkni, malgama, etc.) matching existing files.
    campuses: collection({
      label: 'Campus Settings',
      path: '../../content/campuses/*/_campus',
      slugField: 'slug',
      format: { data: 'yaml' },
      schema: campusConfigFields,
    }),

    // ── CAMPUS PAGE CONTENT ────────────────────────────────────────────────
    // One collection per campus — each manages the markdown pages for that
    // campus (about, admissions, contact, etc.). Edit title (H1), description,
    // template, facts, FAQ, and the full body (## for headings, ### for subs).
    kunkniPages:  campusPageCollection('kunkni',  '📄 Kunkni — Page Content'),
    malgamaPages: campusPageCollection('malgama', '📄 Malgama — Page Content'),
    fwgsPages:    campusPageCollection('fwgs',    '📄 FWGS — Page Content'),
    falhPages:    campusPageCollection('falh',    '📄 FALH — Page Content'),
    fasvPages:    campusPageCollection('fasv',    '📄 FASV — Page Content'),
    adajanPages:  campusPageCollection('adajan',  '📄 FP Adajan — Page Content'),
    vesuPages:    campusPageCollection('vesu',    '📄 FP Vesu — Page Content'),

    // ── TIER B CONTENT ─────────────────────────────────────────────────────
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
