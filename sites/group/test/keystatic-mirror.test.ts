// Keystatic's field definitions are a HAND-WRITTEN mirror of the Zod
// schemas in packages/content-schema. Nothing enforced that until now: the
// claim in keystatic.config.ts that "drift is pinned by
// sites/group/test/schemas.test.ts round-trips" was not true — those tests
// parse hand-typed strings and never import the Keystatic config.
//
// The gap bit for real. WA-49 made `type` required on testimonialSchema;
// the Keystatic collection was not updated, so any CMS-authored testimonial
// would have written YAML without `type` and failed content validation at
// build. All 84 tests passed with that drift present.
//
// This file closes it: every field a schema REQUIRES must exist in the
// matching Keystatic collection, or the build goes red.
import { describe, it, expect } from 'vitest';
import type { z as Zod } from 'astro/zod';
import ksConfig from '../keystatic.config';
import {
  newsSchema,
  eventSchema,
  testimonialSchema,
  gallerySchema,
  programmeSchema,
} from '@fountainhead-web/content-schema';

/**
 * Keys a schema will reject an object for omitting. Fields with `.optional()`
 * or `.default()` report `isOptional()` true, which matches Keystatic's
 * notion of a field the editor may leave alone.
 */
function requiredKeys(schema: Zod.ZodTypeAny): string[] {
  // superRefine/refine wrap the object in ZodEffects — unwrap to the shape.
  let node: any = schema;
  while (node?._def?.schema) node = node._def.schema;
  const shape = typeof node?._def?.shape === 'function' ? node._def.shape() : node?.shape;
  if (!shape) throw new Error('could not read schema shape');
  return Object.entries(shape)
    .filter(([, field]) => !(field as Zod.ZodTypeAny).isOptional())
    .map(([key]) => key)
    .sort();
}

const MIRRORS: { collection: keyof typeof ksConfig.collections; schema: Zod.ZodTypeAny }[] = [
  { collection: 'news', schema: newsSchema },
  { collection: 'events', schema: eventSchema },
  { collection: 'testimonials', schema: testimonialSchema },
  { collection: 'galleries', schema: gallerySchema },
  { collection: 'programmes', schema: programmeSchema },
];

describe('Keystatic field config mirrors the content schemas', () => {
  for (const { collection, schema } of MIRRORS) {
    it(`${collection}: every required schema field has a Keystatic field`, () => {
      const fieldKeys = Object.keys(ksConfig.collections[collection].schema);
      const missing = requiredKeys(schema).filter((key) => !fieldKeys.includes(key));
      expect(missing, `Keystatic '${collection}' is missing required field(s): ${missing.join(', ')}`).toEqual([]);
    });
  }

  // The specific regression that motivated this file.
  it('testimonials exposes `type`, so CMS output satisfies WA-49', () => {
    expect(Object.keys(ksConfig.collections.testimonials.schema)).toContain('type');
  });

  it('testimonials exposes `consentRef`, so a student quote can carry its consent record', () => {
    expect(Object.keys(ksConfig.collections.testimonials.schema)).toContain('consentRef');
  });
});

describe('Keystatic campus options cover every campus', () => {
  it('offers all campuses that exist in content/campuses', async () => {
    const { readdirSync } = await import('node:fs');
    const slugs = readdirSync('../../content/campuses', { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    // `campus` is a select on several collections; read the options off news.
    const field: any = ksConfig.collections.news.schema.campus;
    const offered: string[] = field.options.map((o: { value: string }) => o.value);
    const missing = slugs.filter((s) => !offered.includes(s));
    expect(missing, `campusOptions is missing: ${missing.join(', ')}`).toEqual([]);
    expect(offered).toContain('group');
  });
});
