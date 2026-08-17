import { z } from 'astro/zod';

// Cloudflare Images reference — NEVER a file path. Binary media does not
// enter git (CLAUDE.md hard rule 1, brief §9a); markdown/CMS entries carry
// the image ID and renderers build the delivery URL. Ids beginning
// `fixture:` render as inline SVG placeholders (used before real media
// exists and in tests).
export const imageRefSchema = z.object({
  id: z.string().min(1),
  // WCAG: alt is required; empty string is the explicit "decorative" opt-in.
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type ImageRef = z.infer<typeof imageRefSchema>;
