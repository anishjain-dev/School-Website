// Form validation schemas (module-boundary honesty per WA-39: the edge
// filters machines; these validate SHAPE — lead quality stays with
// Admissions).
import { z } from 'astro/zod';

const phone = z
  .string()
  .min(8)
  .max(20)
  .regex(/^[+\d][\d\s-]+$/, 'digits, spaces, +, - only');

export const enquiryFormSchema = z.object({
  parentName: z.string().trim().min(2).max(120),
  parentPhone: phone,
  parentEmail: z.string().trim().email().max(200).optional().or(z.literal('').transform(() => undefined)),
  childName: z.string().trim().min(2).max(120),
  childDob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => {
      const d = new Date(s);
      const now = new Date();
      return d < now && d > new Date(now.getFullYear() - 25, 0, 1);
    }, 'implausible date of birth'),
  campus: z.enum(['kunkni', 'malgama', 'fwgs', 'falh', 'fasv']).optional().or(z.literal('').transform(() => undefined)),
  note: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
});

export const applicationFormSchema = z.object({
  applicantName: z.string().trim().min(2).max(120),
  applicantEmail: z.string().trim().email().max(200),
  applicantPhone: phone,
  coverNote: z.string().trim().max(4000).optional().or(z.literal('').transform(() => undefined)),
  talentPoolConsent: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});
