// Brand axis — the canonical list lives in @fountainhead-web/content-schema
// (single source of truth since Stage 4); labels are a site concern.
export { BRANDS, type Brand } from '@fountainhead-web/content-schema';
import type { Brand } from '@fountainhead-web/content-schema';

export const BRAND_LABELS: Record<Brand, string> = {
  fountainhead: 'Fountainhead',
  fwgs: 'FWGS',
  falh: 'FALH (placeholder)',
  fasv: 'FASV (placeholder)',
};
