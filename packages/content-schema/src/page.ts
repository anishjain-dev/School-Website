import { z } from 'astro/zod';
import { imageRefSchema } from './media';

// Tier A pages — content/group/** and content/campuses/<slug>/** (WA-2).
export const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  // group-only pages never propagate to campuses (e.g. board, careers).
  scope: z.enum(['inheritable', 'group-only']).default('inheritable'),
  draft: z.boolean().default(false),
  // Dispatches to the Stage 5 template; 'content' is the standard page.
  template: z
    .enum(['content', 'programme', 'admissions', 'contact', 'landing', 'home', 'early-years'])
    .default('content'),
  heroImage: imageRefSchema.optional(),
  order: z.number().optional(),
  /** Exclude this page from the site header nav (e.g. footer-only pages). */
  hideFromNav: z.boolean().default(false),
  /** Fact panel rows (programme/admissions templates) */
  facts: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  /** FAQ rendered as native <details> — zero JS */
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  /**
   * Early-years programme table (WA-47). Preschools carry no PYP/MYP/DP, so
   * they take this instead of FALH's programme catalogue (WA-35) — the
   * deliberately simpler shape: what age, how long, which days.
   */
  earlyYears: z
    .object({
      programmes: z.array(
        z.object({
          name: z.string(),
          ageFrom: z.number(),
          ageTo: z.number(),
          duration: z.string(),
          days: z.string(),
        }),
      ),
      /** e.g. "1:10" — adult-to-child, if the centre publishes it */
      ratio: z.string().optional(),
    })
    .optional(),
});

export type PageFrontmatter = z.infer<typeof pageSchema>;
