import { z } from 'astro/zod';

// The brand axis (WA-6): one theme file per brand in packages/tokens.
export const BRANDS = ['fountainhead', 'fwgs', 'falh', 'fasv'] as const;
export const brandSchema = z.enum(BRANDS);
export type Brand = z.infer<typeof brandSchema>;

// Jurisdiction tags for the statutory block (WA-14).
export const jurisdictionSchema = z.enum(['gujarat', 'maharashtra']);

// content/campuses/<slug>/_campus.yaml — campus identity + inheritance policy.
export const campusConfigSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  shortName: z.string().optional(),
  /** One-line card descriptor for the group-home campus index */
  descriptor: z.string().optional(),
  // Counts toward the network positioning claim (WA-47: "6 campuses across
  // 3 cities"). An unlaunched campus still gets a section and a card — it
  // just isn't counted. Keeps the claim derived from real campuses rather
  // than a hardcoded number that can silently go stale.
  launched: z.boolean().default(true),
  brand: brandSchema,
  jurisdiction: jurisdictionSchema,
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  // Primary/switchboard contact. Role-specific desks go in `contacts`.
  phone: z.string().optional(),
  email: z.string().email().optional(),
  // Role-based contacts (marketing IA, 2026-07-27). Admissions, transport
  // and the front office are different desks — one number for all three
  // sends parents to the wrong person.
  contacts: z
    .array(
      z.object({
        role: z.enum(['admissions', 'transport', 'front-office']),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        hours: z.string().optional(),
      }),
    )
    .default([]),
  // Social handles. The group runs shared accounts (Instagram
  // @fountainheadschool, Facebook FountainheadSurat), so these are group
  // defaults a campus only sets to OVERRIDE — not required per campus.
  social: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  // Preschools link to a school as a progression pathway (WA-47). The link
  // is by GEOGRAPHY, not ownership, and the pairing is a content decision —
  // so it is a slug here, never inferred in a template.
  continuesAt: z.string().optional(),
  // Campus domains that 301 into this campus's path (WA-10); consumed by
  // the redirect setup, never by templates.
  domains: z.array(z.string()).default([]),
  // Inherit-with-override policy (WA-11).
  //   all    — inherit every inheritable group page, minus `exclude`
  //   listed — inherit only ids in `include`
  //   none   — own files only (FASV: a single landing page)
  inherit: z
    .object({
      mode: z.enum(['all', 'listed', 'none']).default('all'),
      exclude: z.array(z.string()).default([]),
      include: z.array(z.string()).default([]),
    })
    .default({ mode: 'all', exclude: [], include: [] }),
  nav: z.array(z.object({ label: z.string(), path: z.string() })).optional(),
});

export type CampusConfig = z.infer<typeof campusConfigSchema>;
