import { z } from 'astro/zod';

// Interim Tier C (WA-43/WA-40): university placements authored as YAML until
// the Career Counselling module is live in Nucleus. Field names deliberately
// mirror the CC emit shape — Institution / Programme / Placement — so the
// cutover is a loader swap, not a transform.
//
// WA-45 governs what may appear here: this is the AGGREGATE data layer.
// There is no student field, by construction. Counts, never people. The named
// celebration layer is separate content under WA-19/WA-41.

/** A destination that is not a university — a real outcome, not missing data.
 *  The convocation deck treats Gap Year as a destination bucket; so do we. */
export const NON_UNIVERSITY_OUTCOMES = ['gap-year', 'family-business', 'semester-gap', 'other'] as const;

/** The career-cluster taxonomy. The convocation deck shows twelve because that
 *  is what the 2026 cohort actually chose; the decade of history carries four
 *  more (health sciences, hospitality, marketing, transport & logistics). The
 *  full list is the vocabulary — the deck renders whichever have students. */
export const CAREER_CLUSTERS = [
  'business-administration-commerce',
  'finance',
  'marketing',
  'stem',
  'health-sciences',
  'arts-design-media',
  'information-technology',
  'human-services',
  'hospitality-tourism',
  'architecture-construction',
  'law',
  'mass-media-journalism',
  'government-public-administration',
  'transportation-logistics',
  'sports',
  'gap-year',
] as const;

const coordinates = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * A campus or constituent school of a parent institution.
 *
 * The test for parenthood is DEGREE-GRANTING IDENTITY, not brand similarity:
 * Penn State Berks awards a Penn State degree and UTM awards a Toronto degree,
 * so both are children. IIT Bombay does not award an "IIT" degree and NIT
 * Trichy is not a campus of a national NIT — those are federated peers and get
 * their own top-level entry.
 *
 * Children carry their own coordinates: Mississauga genuinely is not St George.
 */
export const institutionUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  /** Absent = falls back to the parent's country. */
  country: z.string().optional(),
  coordinates: coordinates.optional(),
});

/** A destination brand. Placement counts roll up here; units hold the detail. */
export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  /** A SECOND AXIS over country, never a replacement for it. Country is the place — what pins a map
   *  bubble and where a roll-up stops (WA-50) — and continent is the coarser grouping laid over it,
   *  so "4 continents" and "17 countries" are both true at once. Derived in the Career Counselling
   *  app and published from there; never re-derived here, or the two copies drift. Optional because
   *  null is a correct answer for an unclassified country, and the page must show that as a gap
   *  rather than invent a continent for it. */
  continent: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  website: z.string().url().optional(),
  /** Site-relative path ("/logos/x.png") into this site's own public/logos/ — never a hotlinked
   *  third-party URL, so a mark the school doesn't control can't vanish from under the page.
   *  Copied in by the publish step from the Career Counselling app, which owns the file. */
  logo: z.string().optional(),
  /** The primary campus's position — what a brand-level bubble is drawn at. */
  coordinates: coordinates.optional(),
  units: z.array(institutionUnitSchema).default([]),
  /** Provenance for the one-time legacy normalisation (WA-43). Every raw
   *  spelling that folded into this record, so a merge stays auditable and
   *  reversible rather than becoming folklore. */
  aliases: z.array(z.string()).default([]),
});

/** One aggregated placement row. No student identifier exists in this shape —
 *  that is the WA-45 guarantee expressed as a type, not a convention. */
export const placementRowSchema = z.object({
  institution: z.string(),
  /** Set when the destination is a genuinely different PLACE — Rutgers New Brunswick, not Newark.
   *  A campus gets its own map bubble and its own country column (WA-50). */
  unit: z.string().optional(),
  /** The constituent school within that place — "Anil Surendra Modi School of Commerce" (WA-51).
   *  Part of the COURSE, not of the geography: the student went to Mumbai either way, so this
   *  never moves a bubble or a country total. Free text, because a school is described by whoever
   *  records the placement rather than drawn from the institution reference. */
  school: z.string().optional(),
  cluster: z.enum(CAREER_CLUSTERS).optional(),
  course: z.string().optional(),
  count: z.number().int().positive(),
});

export const nonUniversityRowSchema = z.object({
  outcome: z.enum(NON_UNIVERSITY_OUTCOMES),
  count: z.number().int().positive(),
});

/** One graduating cohort. WA-46: campus is carried on every cohort so a parent
 *  browsing a JV campus is never left to infer another campus's record is theirs. */
export const placementCohortSchema = z.object({
  year: z.number().int(),
  campus: z.string(),
  programme: z.string().default('DP'),
  cohortSize: z.number().int().nonnegative(),
  placements: z.array(placementRowSchema).default([]),
  otherOutcomes: z.array(nonUniversityRowSchema).default([]),
  /** Institution-level or cohort-level only — never against an individual (WA-45). */
  scholarshipTotalUsd: z.number().nonnegative().optional(),
  /** Stamped by the normaliser so a stale dataset is visible on the page,
   *  which is the one real failure mode of a published-snapshot model. */
  generatedAt: z.string(),
  source: z.string(),
});

export const institutionReferenceSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  institutions: z.array(institutionSchema).default([]),
});

export type Institution = z.infer<typeof institutionSchema>;
export type InstitutionUnit = z.infer<typeof institutionUnitSchema>;
export type PlacementCohort = z.infer<typeof placementCohortSchema>;
export type PlacementRow = z.infer<typeof placementRowSchema>;

/**
 * The editorial layer over the record (2026-07-28). Counts are GENERATED from the Career
 * Counselling app and must never be edited; this is the human judgement laid on top — which
 * universities lead the page and how each is described.
 *
 * It creates no numbers. An id listed here with no placements simply does not render, which is why
 * every field is a reference or a sentence and none of them is a count.
 */
const standingEntry = z.object({
  id: z.string(),
  /** Printed verbatim. Must carry its source and year — NIRF bands move annually. */
  standing: z.string().default(''),
});

export const placementHighlightsSchema = z.object({
  worldLeading: z.array(z.string()).default([]),
  indiaLeading: z.array(standingEntry).default([]),
  /** Outside the NIRF framework rather than below it — several deliberately do not participate. */
  indiaEmerging: z.array(standingEntry).default([]),
  homeCity: z.string().default('Surat'),
  creativeSpecialists: z.array(z.string()).default([]),
});

export type PlacementHighlights = z.infer<typeof placementHighlightsSchema>;
