import { z } from 'astro/zod';

// Single-source policies (WA-13): one markdown file renders to both the
// website and the PDF export. Front-matter makes the artifact
// self-identifying on both surfaces.
export const policySchema = z.object({
  title: z.string(),
  category: z.enum(['school', 'academic', 'health', 'other']),
  version: z.string(),
  effectiveDate: z.coerce.date(),
  // A role, not a person — people change, the owning role does not.
  owner: z.string(),
  reviewDue: z.coerce.date().optional(),
  status: z.enum(['active', 'superseded']).default('active'),
  summary: z.string().optional(),
});

export type PolicyFrontmatter = z.infer<typeof policySchema>;
