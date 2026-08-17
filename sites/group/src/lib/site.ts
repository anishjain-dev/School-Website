// Group-level site constants. Kept here rather than in a component so a
// campus can override without a template edit.

/**
 * Shared social accounts. The group runs ONE Instagram and ONE Facebook
 * across all campuses (verified 2026-07-27 against the preschool site,
 * which links the same handles), so these are defaults a campus overrides
 * only if it genuinely has its own account.
 *
 * Handles only — these render as links, never as embed scripts (hard rule 3,
 * and WA-18 keeps Instagram build-time static).
 */
export const GROUP_SOCIAL = {
  instagram: 'fountainheadschool',
  facebook: 'FountainheadSurat',
} as const;

export interface SocialLinks {
  instagram?: string | undefined;
  facebook?: string | undefined;
  youtube?: string | undefined;
}

/** Campus override wins per-network; unset networks fall back to the group. */
export function resolveSocial(campusSocial?: SocialLinks | undefined): SocialLinks {
  return { ...GROUP_SOCIAL, ...(campusSocial ?? {}) };
}

const BASE: Record<keyof SocialLinks, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  youtube: 'https://www.youtube.com/@',
};

export function socialUrl(network: keyof SocialLinks, handle: string): string {
  return handle.startsWith('http') ? handle : `${BASE[network]}${handle}`;
}
