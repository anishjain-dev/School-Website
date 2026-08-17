// Shim: the real config lives at the repo root (brief §2). The Keystatic
// integration resolves config from the Astro project directory, so this
// re-export bridges the two.
export { default } from '../../keystatic.config';
