import { z } from 'astro/zod';
import { jurisdictionSchema } from './campus';

// Statutory block (WA-14): schema exists from day one, renders NOTHING
// while the group is IB-only. All disclosure fields optional and
// jurisdiction-tagged; a future CBSE/state-board affiliation is
// configuration, not a rebuild. `enabled: false` is the dormancy switch.
export const statutorySchema = z
  .object({
    campus: z.string(),
    jurisdiction: jurisdictionSchema,
    enabled: z.boolean().default(false),
    affiliation: z
      .object({
        board: z.enum(['ib', 'cbse', 'gseb', 'msbshse']),
        number: z.string().optional(),
        validFrom: z.coerce.date().optional(),
        validTo: z.coerce.date().optional(),
      })
      .optional(),
    recognition: z.object({ authority: z.string(), number: z.string().optional() }).optional(),
    feeRegulation: z.object({ committee: z.string(), orderRef: z.string().optional() }).optional(),
    safety: z
      .object({
        fireNocValidTo: z.coerce.date().optional(),
        buildingSafetyValidTo: z.coerce.date().optional(),
      })
      .optional(),
    mandatoryDisclosureUrl: z.string().url().optional(),
  })
  // Future boards add fields via configuration, not schema rebuild.
  .passthrough();
