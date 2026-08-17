# Project Status — living handoff

**Purpose:** the cross-machine memory. A fresh Claude session (or human) on
any machine reads CLAUDE.md → this file and knows exactly where things
stand. Update it whenever state changes materially. Last updated:
**2026-07-27** (IA restructure).

---

## Latest — IA restructure (2026-07-27)

Marketing head's proposed site structure, taken through the register and
built. **Register first:** WA-47 (preschool estate + early-years template),
WA-48 (network nav depth + common-page scoping) and WA-49 (testimonials
scope + consent staging) added; **WA-21 and WA-23 locked** — the register
now has 46 of 49 locked and 3 open, none of them blockers.

What changed in the code:

- **FWGS is in Chhatrapati Sambhajinagar, Maharashtra** — the seeded config
  said Surat/Gujarat. `jurisdiction` drives the WA-14 statutory block, so
  board, recognition authority and fee committee all differ. Real address
  supplied by VK the same day: Shendra MIDC, **431154** — comms to confirm
  the printed line1/line2 split (the source string repeats "Shendra MIDC").
- **Nav is now two levels** (WA-48), built on native `<details name>` — the
  exclusive accordion, zero JS. Deliberately not a hover menu: those must be
  dismissible under WCAG 1.4.13 and there is no way to wire Escape without
  script. Grouping logic is a pure module (`src/lib/nav-tree.ts`) with 9
  tests. The footer now carries the full sitemap, derived from the same
  `NavItem[]` the header renders, so the two cannot drift.
- **Two preschool campuses** — `/adajan/` and `/vesu/` (WA-47), on a new
  `early-years` template. Network positioning is now **6 campuses across 3
  cities**, derived from a `launched` flag on campus config rather than a
  hardcoded number.
- **Fixed a live WCAG 1.4.11 failure on `/falh/`:** the hero CTA read
  `--fh-color-accent`, which on the FALH brand is the same yellow as
  `--fh-color-hero-bg` — an invisible button. New `--fh-color-hero-cta-*`
  slots, and `check-contrast.mjs` gained the non-text-contrast pair that
  would have caught it (52 pairs, was 44).

**Cache hazard worth knowing:** Astro's content store is incremental and
lives in **two** places — `sites/group/.astro/` *and*
`sites/group/node_modules/.astro/`. After a content-schema change, entries
whose files did not change keep data parsed under the OLD schema, and the
build fails in confusing ways. Clear **both** before trusting a build.

## Where things stand

**Phase 0 is complete** (all 7 stages + credential sitting) and the full
pipeline is **live in production**:

- **Production:** https://fountainhead-web.fsgroup.workers.dev (Workers
  Static Assets, deploys on push to `main` via Workers Builds; every
  branch push gets a preview URL surfaced as a GitHub check).
- **Forms are real end-to-end:** Turnstile (live keys) → `/api/enquiry/`,
  `/api/careers/`, `/api/internship/` → Hyperdrive (`fw-interim`) →
  **Railway Singapore Postgres** in Nucleus schema shape (WA-40 deviation,
  register-noted, sunset = India-hosted at `.org` cutover).
- **Staff surfaces:** `/admin/submissions/` and `/api/cv/*` behind
  Cloudflare Access ("Fountainhead Web — Admin" app). CV serving is
  fail-closed on virus-scan status.
- **Purge cron:** daily 03:00 IST in the Worker (`WebPurgeRun` audit rows).
  First live run: night of 2026-07-20 → **verify next session**.
- **Brand truth:** all four campus brand files carry real values from the
  2025 Brand Manuals (WA-6 revised — FWGS uses the group palette; FALH
  keeps its warm preschool hero per VK). 2025 manuals live in the shared
  Drive; both school manuals are curves-exports readable only visually.
- **Content skeleton:** every owed Tier A page exists as a `draft: true`
  stub with a `TODO (comms)` note; several pre-filled from print
  collateral. `pnpm report` = content progress dashboard ("✍ in draft").
- **Comms workflow:** Keystatic GitHub mode is code-complete behind the
  `KEYSTATIC_GITHUB=1` build variable — see `docs/Comms Publishing
  Guide.md` for VK's one-time GitHub App setup.

## Pending — the short list

| # | Item | Who | Notes |
|---|---|---|---|
| 1 | `fasv.in` GoDaddy forwarding flip | VK | Forward-only · 301 → `https://fountainhead-web.fsgroup.workers.dev/fasv/` (WA-10 mechanism = GoDaddy forwarding, register-noted). Then fsksurat/fsmsurat at launch; fwgs.in/falh.in only on explicit go (live sites today) |
| 2 | Search Console export → `tools/crawl-inventory/data/gsc-pages.csv` | VK | then `pnpm inventory:join` completes DoD 6 (traffic-ranked page list for comms) |
| 3 | Keystatic GitHub App setup | VK | ~15 min, steps in Comms Publishing Guide; then comms self-serve |
| 4 | Lead-alert provider decision | VK | MailChannels is dead; Resend proposed (DNS record + API key + small notifier swap). Meanwhile alerts log-only; `/admin/submissions/` is the visibility surface |
| 5 | Verify first purge-cron run | Claude | query `WebPurgeRun` on Railway (expect one row, 0 deleted) |
| 6 | Content: 17 Aug freeze | Comms | the draft-tracker list + transcription worklist Sheet (in VK's My Drive) |
| 8 | Facts owed to the IA restructure | VK / marketing | **Resolved 2026-07-27:** FWGS address (Shendra MIDC, CSN 431154 — comms to confirm the printed split); MLC = **Maverick Learning Centre** (FSK-only, taught programme); FHSD = **Fountainhead High School Diploma** (group-level, will expand — WA-48 addendum). **Still open:** preschool `continuesAt` pairing (Adajan/Vesu → which school, by geography per WA-47); which campuses have an "A Day in the Life" video. Programme copy for MLC/FHSD/BTEC is in the Nucleus ERP specs — a copy source for comms, not an integration |
| 10 | Academics content owed | Comms / academics | `/academics/` is now **published** (the two-level nav needs a real parent to group under), so its body ships — keep TODOs out of it. Owed: the FS Learning Model and Early Years sections marketing asked for, as pages beneath the hub; the continuum narrative connecting PYP/MYP/DP; and MLC / BTEC / FHSD programme copy from the Nucleus ERP specs. FHSD additionally must name the campuses that run it before it leaves draft (WA-48 addendum) |
| 9 | Header "Enquire" pill contrast | VK | Yellow `#F2C418` on white = **1.66:1**, under 1.4.11's 3:1 for a component boundary. Pre-existing, every brand and page, and it is the group's signature accent — a brand decision, deliberately not changed. Arguable (the dark label itself passes), but worth a ruling now WA-21 is locked as stated AA |
| 7 | September lane | all | `.org` cutover (DNS + WP rollback per WA-26), full redirect map, India Postgres migration (WA-40 sunset), ClamAV India host, Instagram build-time fetch (WA-18 — **not yet built**), careers page application form |

## Infra map (who talks to what)

GitHub `vardan-kabra/fountainhead-web` (main protected, PR-only) →
Workers Builds → Worker `fountainhead-web` (account: fsgroup) with:
ASSETS (static), Hyperdrive binding `DB` (571fb89a…, → Railway
`interchange.proxy.rlwy.net:25370`), cron `30 21 * * *` UTC, secrets
`DATABASE_URL · TURNSTILE_SECRET · DOC_SIGNING_KEY · IP_SALT`. Turnstile
widget `0x4AAAAAAD5regU_f1oBYVql` (site key, baked at build via the
`PUBLIC_TURNSTILE_SITE_KEY` build variable). Zero Trust Access app guards
`/admin` + `/api/cv`.

## Fresh-machine quickstart

```bash
git clone https://github.com/vardan-kabra/fountainhead-web && cd fountainhead-web
git config core.hooksPath .githooks     # guardrails on (hooks are LF, committed)
npm i -g pnpm && pnpm install
docker compose up -d postgres            # local store on port 15432 (5432/5433 are taken on VK's main machine)
# recreate sites/group/.env — GITIGNORED, DOES NOT TRAVEL VIA GIT:
#   DATABASE_URL=postgresql://fw:fw@localhost:15432/fw_interim
#   IP_SALT / DOC_SIGNING_KEY = any local value for dev
#   PROD_DATABASE_URL = Railway public URL (Railway dashboard → Postgres → DATABASE_PUBLIC_URL)
cd packages/interim-store && DATABASE_URL=postgresql://fw:fw@localhost:15432/fw_interim pnpm exec prisma migrate dev
pnpm dev            # http://localhost:4321
pnpm test && pnpm report
```

**⚠ Secrets don't travel:** `sites/group/.env` on the original machine
holds the Railway URL and the generated production secret values — copy it
between machines via a password manager or USB, never via git or chat.
Production itself needs nothing: its secrets live in the Cloudflare
dashboard.

## Canonical references

- `docs/Web Architecture Decision Register.md` — THE authority (WA-1–42 +
  Part 3 corrections; every deviation of this project is recorded there).
- `docs/Phase 0 Build Brief.md` — original task definition + DoD.
- `docs/Comms Publishing Guide.md` — content workflow + App setup.
- Transcription worklist (comms): Google Sheet in VK's My Drive,
  "Website Content Transcription Worklist — 2026-07-20".
- Print collateral: shared Drive folder (Ankita's), incl. the 2025 Brand
  Manuals per campus.
