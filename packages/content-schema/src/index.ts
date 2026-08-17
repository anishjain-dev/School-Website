// Zod schemas for every collection (brief §2) — the single source of truth
// for content shapes. Consumed by: Astro's content layer (validation),
// Keystatic round-trip tests (drift pinning), the inheritance report, and
// packages/ui fixtures (types).
export { imageRefSchema, type ImageRef } from './media';
export {
  BRANDS,
  brandSchema,
  type Brand,
  jurisdictionSchema,
  campusConfigSchema,
  type CampusConfig,
} from './campus';
export { pageSchema, type PageFrontmatter } from './page';
export { policySchema, type PolicyFrontmatter } from './policy';
export {
  newsSchema,
  eventSchema,
  testimonialSchema,
  isPublishableTestimonial,
  TESTIMONIAL_TYPES,
  PUBLISHABLE_TESTIMONIAL_TYPES,
} from './news';
export { gallerySchema, galleryImageSchema } from './gallery';
export { programmeSchema } from './programme';
export { staffSchema, calendarSchema } from './staff';
export { statutorySchema } from './statutory';
export {
  CAREER_CLUSTERS,
  NON_UNIVERSITY_OUTCOMES,
  institutionSchema,
  institutionUnitSchema,
  institutionReferenceSchema,
  placementRowSchema,
  placementCohortSchema,
  placementHighlightsSchema,
  type Institution,
  type InstitutionUnit,
  type PlacementCohort,
  type PlacementRow,
  type PlacementHighlights,
} from './placements';
export { PROGRAMMES, resultSetSchema, type ResultSet } from './results';
