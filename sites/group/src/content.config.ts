// All collections load through glob loaders (WA-2: three sources, one
// interface). Tier B (Keystatic) and interim Tier C (staff/calendar
// markdown, WA-40) are loader swaps later — Payload, SD-DIR, CAL — and the
// templates must not know the difference.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  pageSchema,
  campusConfigSchema,
  policySchema,
  newsSchema,
  eventSchema,
  testimonialSchema,
  gallerySchema,
  programmeSchema,
  staffSchema,
  calendarSchema,
  statutorySchema,
  placementCohortSchema,
  institutionReferenceSchema,
  placementHighlightsSchema,
  resultSetSchema,
} from '@fountainhead-web/content-schema';

const CONTENT = '../../content';

// The resolver keys on literal file paths (WA-11: overrides are explicit
// FILES). Astro's default id generator slugifies and strips trailing
// '/index' — 'kunkni/index.md' would collapse to 'kunkni' — and lets a
// frontmatter `slug` hijack the id. This keeps ids = relative path sans
// extension, exactly what resolve.ts expects.
const pathId = ({ entry }: { entry: string }) => entry.replace(/\.(md|mdoc|yaml)$/, '');

export const collections = {
  // Tier A — group commons + campus overrides (WA-11)
  group: defineCollection({
    loader: glob({ base: `${CONTENT}/group`, pattern: '**/*.md', generateId: pathId }),
    schema: pageSchema,
  }),
  campusPages: defineCollection({
    loader: glob({
      base: `${CONTENT}/campuses`,
      pattern: ['**/*.{md,mdoc}', '!**/_*', '!**/programmes/**'],
      generateId: pathId,
    }),
    schema: pageSchema,
  }),
  campuses: defineCollection({
    loader: glob({ base: `${CONTENT}/campuses`, pattern: '*/_campus.yaml', generateId: pathId }),
    schema: campusConfigSchema,
  }),
  policies: defineCollection({
    loader: glob({ base: `${CONTENT}/policies`, pattern: '**/*.md' }),
    schema: policySchema,
  }),

  // Tier B — Keystatic-managed (WA-17; galleries governed by WA-38/41)
  news: defineCollection({
    loader: glob({ base: `${CONTENT}/news`, pattern: '**/*.{md,mdoc}' }),
    schema: newsSchema,
  }),
  events: defineCollection({
    loader: glob({ base: `${CONTENT}/events`, pattern: '**/*.{md,mdoc}' }),
    schema: eventSchema,
  }),
  testimonials: defineCollection({
    loader: glob({ base: `${CONTENT}/testimonials`, pattern: '**/*.yaml' }),
    schema: testimonialSchema,
  }),
  galleries: defineCollection({
    loader: glob({ base: `${CONTENT}/galleries`, pattern: '**/*.yaml' }),
    schema: gallerySchema,
  }),
  programmes: defineCollection({
    loader: glob({ base: `${CONTENT}/campuses/falh/programmes`, pattern: '**/*.{md,mdoc}' }),
    schema: programmeSchema,
  }),

  // Interim Tier C (WA-40) — loader swap to Nucleus SD-DIR / CAL later
  staff: defineCollection({
    loader: glob({ base: `${CONTENT}/staff`, pattern: '**/*.md' }),
    schema: staffSchema,
  }),
  calendar: defineCollection({
    loader: glob({ base: `${CONTENT}/calendar`, pattern: '**/*.yaml' }),
    schema: calendarSchema,
  }),
  // Interim Tier C (WA-43/WA-40) — placements as YAML until the Career
  // Counselling module is live. One file per cohort; the institution
  // reference is shared across all of them.
  placementCohorts: defineCollection({
    loader: glob({ base: `${CONTENT}/placements/cohorts`, pattern: '**/*.yaml' }),
    schema: placementCohortSchema,
  }),
  // Interim Tier C (WA-43/WA-40) — published exam results as YAML until the
  // IBDP/MYP Results modules are live.
  results: defineCollection({
    loader: glob({ base: `${CONTENT}/results`, pattern: '**/*.yaml' }),
    schema: resultSetSchema,
  }),
  placementInstitutions: defineCollection({
    loader: glob({ base: `${CONTENT}/placements`, pattern: 'institutions.yaml' }),
    schema: institutionReferenceSchema,
  }),
  // The editorial layer: which universities lead the page and how they are described. Separate
  // from the generated data on purpose, so marketing can revise it without a code change.
  placementHighlights: defineCollection({
    loader: glob({ base: `${CONTENT}/placements`, pattern: 'highlights.yaml' }),
    schema: placementHighlightsSchema,
  }),

  // Statutory (WA-14) — schema live, rendering dormant
  statutory: defineCollection({
    loader: glob({ base: `${CONTENT}/statutory`, pattern: '*.yaml' }),
    schema: statutorySchema,
  }),
};
