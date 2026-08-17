import { z } from 'astro/zod';
import { imageRefSchema } from './media';

// FALH programme catalogue (WA-35). Two audiences on one site:
// preschool (feeder funnel to FASV) and after-school families whose
// children attend other schools. The audience field drives navigation
// and conversion paths — it is the IA split, not a display tag.
export const programmeSchema = z.object({
  title: z.string(),
  audience: z.enum(['preschool', 'after-school']),
  ageBand: z.object({ min: z.number().int(), max: z.number().int() }),
  batches: z
    .array(
      z.object({
        days: z.string(), // e.g. "Mon-Wed-Fri"
        time: z.string(), // e.g. "16:30-17:30"
        startDate: z.coerce.date().optional(),
      }),
    )
    .default([]),
  sessionCount: z.number().int().positive().optional(),
  fees: z.object({ amount: z.number(), period: z.enum(['month', 'term', 'course']) }).optional(),
  enrolmentStatus: z.enum(['open', 'waitlist', 'closed']).default('open'),
  cover: imageRefSchema.optional(),
  draft: z.boolean().default(false),
});
