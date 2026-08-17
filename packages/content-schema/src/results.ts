import { z } from 'astro/zod';

// Interim Tier C (WA-43/WA-40): published exam results as YAML until the
// IBDP/MYP Results modules are live in Nucleus. Field names mirror those apps'
// DashboardSummary shape (session, cohort {candidates, awarded}, distributions)
// so the cutover is a loader swap, not a transform.
//
// WA-45: this is the AGGREGATE layer. Cohort figures only — there is no
// student field in this shape. Named toppers with their scores are the
// separate celebration layer, governed by WA-19 consent.
//
// These pages replace ~40 hand-designed images per year. The images were
// pictures of numbers: unfilterable, uncomparable across years, and a design
// job every July. The numbers themselves belong in data.

export const PROGRAMMES = ['DP', 'MYP', 'IGCSE'] as const;

/** A published count against a threshold — "40 & above: 11", "As in TOK: 14".
 *  Kept as a list rather than fixed fields because DP, MYP and IGCSE publish
 *  genuinely different cuts, and the cuts change as the school chooses. */
const tally = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
  /** Optional denominator, so a bar can be drawn honestly rather than guessed. */
  of: z.number().int().positive().optional(),
});

export const resultSetSchema = z.object({
  programme: z.enum(PROGRAMMES),
  /** The graduating class — how the school refers to a cohort. */
  classOf: z.number().int(),
  /** The exam session year, which for MYP differs from classOf. */
  sessionYear: z.number().int(),
  campus: z.string().default('kunkni'),
  cohortSize: z.number().int().nonnegative(),

  /** Set when this record POOLS several sessions rather than describing one.
   *  WA-45's rule is pooling, not suppression: where a single year would expose a thin cell, the
   *  years combine. A campus with cohorts of 4-15 has no publishable single year, but a four-year
   *  pool clears every threshold. When present, the page must say so — rendering a pooled figure
   *  as "Class of 2026" would be a straightforward falsehood. */
  pooledFrom: z.number().int().optional(),
  pooledTo: z.number().int().optional(),

  schoolAverage: z.number().optional(),
  worldAverage: z.number().optional(),
  maxPossible: z.number().optional(),
  /** Highest achieved in the cohort — a cohort statistic, not a named student. */
  highestAchieved: z.number().optional(),

  awarded: z
    .object({
      diploma: z.number().int().nonnegative().optional(),
      course: z.number().int().nonnegative().optional(),
    })
    .optional(),

  /** Score bands: "36 & above", "40 & above". */
  distribution: z.array(tally).default([]),
  /** Everything else the school publishes: perfect 7s, As in EE/TOK, core points. */
  notable: z.array(tally).default([]),

  /** Where these figures came from, and whether they still need verifying
   *  against the source system. A published number with unclear provenance is
   *  worse than no number. */
  source: z.string(),
  generatedAt: z.string(),
  /** True until reconciled against the IBDP/MYP Results app export. */
  provisional: z.boolean().default(false),
});

export type ResultSet = z.infer<typeof resultSetSchema>;
