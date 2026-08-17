import { z } from 'astro/zod';
import { imageRefSchema } from './media';

// Interim Tier C (WA-15/WA-40): staff authored as markdown until SD-DIR is
// live in Nucleus. Field names deliberately mirror the SD-DIR shape so the
// cutover is a loader swap — the frontend must not know the difference.
export const staffSchema = z.object({
  name: z.string(),
  designation: z.string(),
  campus: z.string(),
  department: z.string().optional(),
  qualifications: z.string().optional(),
  // Absent photo = consent-off or none on file; renderers show initials.
  photo: imageRefSchema.optional(),
  order: z.number().optional(),
});

// Interim Tier C (WA-16/WA-40): calendar as YAML until CAL is live.
// Shape mirrors Nucleus CalendarEntry (kind/appliesTo vocabulary) so the
// cutover is a copy, not a transform.
export const calendarSchema = z.object({
  campus: z.string(),
  academicYear: z.string(), // e.g. "2026-27"
  entries: z
    .array(
      z.object({
        date: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        title: z.string(),
        kind: z.enum(['instructional', 'exam', 'trip', 'non-instructional', 'holiday', 'weekly-off', 'event', 'ptm']),
        appliesTo: z.enum(['staff', 'student', 'both']).default('both'),
      }),
    )
    .default([]),
});
