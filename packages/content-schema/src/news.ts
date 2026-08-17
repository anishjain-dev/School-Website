import { z } from 'astro/zod';
import { imageRefSchema } from './media';

// Tier B — Keystatic-managed (WA-17). `campus: group` = group-wide story.
export const newsSchema = z.object({
  title: z.string(),
  publishDate: z.coerce.date(),
  campus: z.string().default('group'),
  cover: imageRefSchema.optional(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
});

export const eventSchema = z.object({
  title: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  campus: z.string().default('group'),
  location: z.string().optional(),
  draft: z.boolean().default(false),
});

// Testimonials (WA-49). Parent and staff ship at launch; STUDENT
// testimonials are held back — a student testimonial is a child's name and
// words, which WA-19 governs at capture and WA-38/WA-41 gate for media.
// `type` exists now so students slot in later without a schema change.
export const TESTIMONIAL_TYPES = ['parent', 'staff', 'student'] as const;
/** Types clear to publish today. Student waits for SHP or a logged check. */
export const PUBLISHABLE_TESTIMONIAL_TYPES = ['parent', 'staff'] as const;

export const testimonialSchema = z
  .object({
    quote: z.string(),
    attribution: z.string(),
    role: z.string().optional(),
    type: z.enum(TESTIMONIAL_TYPES),
    campus: z.string().default('group'),
    // Logged consent reference — the WA-41 interim pattern (a record, not a
    // boolean, so it is auditable). Required before a student quote renders.
    consentRef: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'student' && !value.consentRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['consentRef'],
        message:
          'student testimonials require a logged consentRef before publication (WA-49; WA-19/WA-41)',
      });
    }
  });

/**
 * Publication gate (WA-49). Keep this as the single decision point so the
 * rule is testable and cannot be re-implemented differently per template.
 */
export function isPublishableTestimonial(t: {
  type: (typeof TESTIMONIAL_TYPES)[number];
  consentRef?: string | undefined;
}): boolean {
  // ALLOWLIST, not a denylist. CLAUDE.md hard rule 6 — nothing is public by
  // default (WA-42). A denylist (`type !== 'student'`) would silently
  // publish any future testimonial type the moment it is added to the enum;
  // this way a new type is withheld until someone adds it here deliberately.
  return (PUBLISHABLE_TESTIMONIAL_TYPES as readonly string[]).includes(t.type);
}
