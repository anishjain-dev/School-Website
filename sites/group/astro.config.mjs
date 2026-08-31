// @ts-check
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// WA-9: one app; canonical URLs are subdirectories of the main domain.
// WA-1: Astro — zero client JS by default (check-zero-js gates the output).
//
// WA-5 (revised): Workers Static Assets. The cloudflare adapter keeps every
// content page fully static; only the form endpoints (/api/*), CV serving,
// and the Access-gated admin list opt into the server (prerender = false).
//
// Keystatic admin loads in two modes (WA-4; VK 2026-07-20: comms deliver
// via GitHub):
//   dev    — pnpm keystatic (KEYSTATIC=1, local storage)
//   deploy — KEYSTATIC_GITHUB=1 build variable ships /keystatic on the
//            Worker in github mode (comms edit → branch → PR). The admin
//            is server-rendered with its own client bundle; PUBLIC pages
//            remain static and zero-JS (check-zero-js verifies exactly
//            that distinction).
const KEYSTATIC = process.env.KEYSTATIC === '1' || process.env.KEYSTATIC_GITHUB === '1';
// Miniflare (Cloudflare Workers runtime) crashes on Windows; skip the adapter
// in dev so the Astro Node dev server is used instead.
const IS_DEV = process.env.NODE_ENV !== 'production' && !process.env.CF_PAGES;

export default defineConfig({
  site: 'https://fountainheadschools.org',
  // 'ignore' in Keystatic mode so the admin SPA can handle its own sub-routes
  // without Astro redirecting /keystatic/collection/news → /keystatic/collection/news/
  // and breaking the client-side router. Production builds always use 'always'.
  trailingSlash: KEYSTATIC ? 'ignore' : 'always',
  server: { host: true, allowedHosts: true },
  build: { format: 'directory' },
  adapter: IS_DEV ? undefined : cloudflare({
    workerEntryPoint: { path: 'src/worker-entry.ts', namedExports: [] },
  }),
  integrations: [markdoc(), ...(KEYSTATIC ? [react(), keystatic()] : [])],
});
