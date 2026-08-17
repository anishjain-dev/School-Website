import { z } from 'astro/zod';
import { imageRefSchema } from './media';

// Galleries (WA-38): CMS holds ONLY images with no identifiable children —
// the upload path refuses those and points to SHP. Until SHP exists, every
// published image carries the WA-41 manual-check log INLINE: the consent
// sub-object is the written record, and it is required, not optional.
// A manual check without a record is indistinguishable from no check.
export const galleryImageSchema = z.object({
  ref: imageRefSchema,
  caption: z.string().optional(),
  consentCheck: z.object({
    checkedBy: z.string().min(1),
    checkedOn: z.coerce.date(),
    // Reference into the signed paper consent register, or the literal
    // 'no-identifiable-child' for scenery/facility shots.
    consentRef: z.string().min(1),
  }),
});

export const gallerySchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  campus: z.string().default('group'),
  images: z.array(galleryImageSchema).default([]),
  draft: z.boolean().default(false),
});
