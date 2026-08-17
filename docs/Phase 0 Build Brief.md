# Fountainhead Web — Phase 0 Build Brief

**For:** Development team / Claude Code.
**Derived from:** Fountainhead Web Architecture Decision Register (WA-1 to WA-37, 2026-07-19).
**Window:** 21 July – 3 August 2026. Phase 0 must complete before campus content lands.
**Status:** Ready to start. No decisions outstanding that block this work.

---

## 1. What Phase 0 delivers

A working foundation that four campus sites can be poured into, plus the tooling to extract the existing site. **No campus content is authored in Phase 0.**

**Definition of done — all ten must pass:**

1. Monorepo builds and deploys a placeholder page to Cloudflare (Workers Static Assets — WA-5 as revised 2026-07-19) on push to `main`.
2. Preview deploy generates a unique URL per branch.
3. Design tokens resolve per brand; switching brand changes the render with no component edits.
4. Component library covers the template inventory in §7 with real markup.
5. Inherit-with-override resolution works and is covered by tests.
6. Full URL inventory of `fountainheadschools.org` exported to CSV with traffic data joined.
7. Elementor extraction pipeline converts a sample of 10 pages to reviewable markdown.
8. Interim store live in India, in Nucleus schema shape, with the purge job scheduled.
9. Upload pipeline rejects a `.exe` renamed to `.pdf` — the magic-byte test.
10. No binary media in the repository; Keystatic writes uploads to Cloudflare, not git (§9a).

---

## 2. Repository structure

Single monorepo, pnpm workspaces.

```
fountainhead-web/
├─ packages/
│  ├─ tokens/            design tokens, one file per brand
│  ├─ ui/                shared Astro components
│  └─ content-schema/    Zod schemas for every collection
├─ sites/
│  └─ group/             the single Astro app (all campuses)
├─ content/
│  ├─ group/             commons — inherited by every campus
│  ├─ campuses/          per-campus overrides + campus-only pages
│  └─ policies/          single-source policies (WA-13)
├─ tools/
│  ├─ crawl-inventory/   URL inventory + Search Console join
│  └─ extract-legacy/    Elementor → markdown pipeline
└─ keystatic.config.ts
```

**One Astro app, not five.** All campuses are subdirectories of one build (WA-9). Campus domains attach as additional custom domains and 301 to their path (WA-10).

---

## 3. Design tokens

```
packages/tokens/
├─ base.css              type scale, spacing, radii, shadows — shared
└─ brands/
   ├─ fountainhead.css
   ├─ fwgs.css           group palette per the 2025 FWGS Brand Manual (WA-6 as revised 2026-07-20)
   ├─ falh.css
   └─ fasv.css
```

Brand file sets CSS custom properties only. **Components must never reference a brand colour directly** — always `var(--accent)`. A component that hardcodes a hex is a build failure.

Brand resolves from the campus segment of the URL at build time.

---

## 4. Content model

### Three sources, one interface (WA-2)

| Tier | Source | Collections |
|---|---|---|
| A — near-static | markdown in git | group pages, campus pages, policies |
| B — editor-managed | Keystatic (WA-4) | news, events, galleries, testimonials, FALH programmes |
| C — operational | Nucleus API | staff, calendar, circulars, results |

All three surface through Astro's content layer so templates consume them identically. **Payload is not in Phase 1** — Keystatic writes markdown to git, so the swap later is a loader change, not a rebuild.

### Inherit-with-override (WA-11)

```
content/
├─ group/
│  ├─ philosophy.md
│  └─ academics/pyp.md
└─ campuses/
   ├─ kunkni/
   │  ├─ _campus.yaml          brand, name, address, jurisdiction
   │  └─ admissions.md         override
   ├─ malgama/
   │  └─ _campus.yaml
   └─ falh/
      ├─ _campus.yaml
      └─ programmes/           catalogue entries (WA-35)
```

**Resolution:** request `/kunkni/philosophy/` → look for `campuses/kunkni/philosophy.md` → fall back to `group/philosophy.md`. Absence means inherit. Overrides are explicit files, never flags.

Build must emit a report of which campus pages are inherited vs overridden. Silent drift is the failure mode this exists to prevent.

### Policies (WA-13)

One markdown file per policy, rendering to **both** the website and a PDF/DOCX export. Front-matter carries version, effective date, and owner. The current Word-document copies are retired once this ships — no dual maintenance.

### Statutory block (WA-14)

Schema built now, **renders nothing** while the group is IB-only. Fields are optional and jurisdiction-tagged (`gujarat`, `maharashtra`) so a future board affiliation is configuration, not a rebuild.

---

## 5. Interim data layer (WA-40)

**Nucleus 3.0 is under construction. No 3.0 module is available on 31 August.** Reads and writes are handled differently.

### Writes — interim store

Stand up the **Postgres instance Payload needs in Phase 2, brought forward**. This is not throwaway work; it becomes Phase 2 infrastructure arriving early.

| Surface | Lands in | Target on 3.0 |
|---|---|---|
| Visit enquiry | `enquiries` | Admissions leads |
| Careers application | `applications` | Recruitment |
| Internship application | `applications` | Recruitment |

Three binding conditions:
1. **Indian hosting** — DPDP posture holds from day one. *(Deviation accepted 2026-07-20: Railway Singapore for the pilot; sunset = India-hosted at `.org` cutover. See the register's WA-40 note.)*
2. **Nucleus schema shape, not a convenient one** — migration becomes a copy, not a transform. Model the table on the target module's record, not on the form.
3. **The WA-34 purge job runs here from day one** — enquiries 24 months, CVs and internships 12 months.

### Reads — content tier

Staff directory (WA-15) and calendar (WA-16) are **authored as markdown by comms**. Nothing exists in 3.0 to read, so nothing is stubbed. When CAL and SD-DIR come online it is a loader swap and the frontend does not change — the same de-risking as the Keystatic-to-Payload path.

**No public read API is required on 31 August** (WA-42/G3).

### Public visibility — provisional

Until R3 answers G1, the build maintains an **explicit allowlist** of fields renderable publicly. **Nothing is public by default.**

---

## 6. Hosting and domains

- Cloudflare Workers with Static Assets, one Worker (WA-5 as revised 2026-07-19). Cloudflare Images for media.
- Custom domains attached: `fsksurat.in`, `fsmsurat.in`, `fwgs.in`, `falh.in`, `fasv.in` — all 301 to their subdirectory path (WA-10).
- `_redirects` file is generated from the URL inventory, not hand-maintained (WA-25).
- WordPress stays live on a staging hostname through `.org` cutover in September (WA-26).

---

## 7. Template inventory

Build these as real components in Phase 0:

1. Group home
2. Campus home
3. Standard content page
4. Programme page (PYP / MYP / DP / BTEC)
5. Policy page + PDF export
6. Admissions / fees page
7. Staff directory (Nucleus-fed)
8. Calendar (Nucleus-fed)
9. News index + article
10. Gallery — **CMS, no identifiable children** (WA-38); upload refuses and redirects to SHP
11. **Programme catalogue index + detail** — FALH, two audiences (WA-35)
12. Contact + enquiry form
13. Statutory block (dormant)
14. Interest-capture landing page — `/fasv/`

---

## 8. Tooling

**`tools/crawl-inventory`** — crawl `fountainheadschools.org`, emit CSV of every URL with title, depth, and last-modified. Join against Search Console export (impressions, clicks, position). Output drives both the redirect map and the content plan's priority ordering.

**`tools/extract-legacy`** — Elementor stores layouts as serialised JSON in `wp_postmeta`, so a WordPress export yields near-empty pages (WA-24). Extract from **rendered HTML**, not the database. Convert to markdown, download media to a local tree, flag pages where extraction confidence is low for human review.

---

## 8a. Form filtering and upload hardening (WA-39)

**The boundary:** the **edge** answers *"is this a machine?"* — bots, volume, rate. The **module** answers *"is this a real prospect?"* — duplicates, validity, lead quality. Do not blur them.

All public forms: Cloudflare Turnstile plus rate limiting, before anything reaches the interim store.

**CV uploads are the highest-risk surface in the build** — anonymous members of the public sending files. Ships in Phase 0:

1. **Magic-byte validation** — verify the actual file signature against the claimed extension. A real PDF starts `%PDF-`; a real `.docx` starts `PK`. Mismatch rejected. **Never trust the extension.**
2. **Extension allowlist** — `.pdf`, `.doc`, `.docx`. Never a blocklist.
3. **Size cap** — 5MB.
4. **Quarantine then promote** — isolated holding area, virus scan (ClamAV), promote only if clean. Unreachable until it passes.
6. **Safe serving** — separate domain, `Content-Disposition: attachment`, randomised filename.

Layers 5 (strip embedded PDF scripts — **strip, do not re-render**; re-rendering destroys the text layer Recruitment needs) and 7 (browser preview rather than download) belong with Recruitment, not here.

---

## 9. Explicitly out of scope for Phase 0

Named here to prevent scope creep at build time:

- Payload CMS application layer — Phase 2 (WA-4). *Its Postgres instance is brought forward now, per §5.*
- `.org` content migration — September (WA-28)
- Alumni, TEDx, `fsapps`, `parents` subdomains (WA-32)
- India Ultimate — separate repo and instance entirely (WA-33)
- Any campus copywriting — that is the content plan's lane

---

## 9a. Binary media never enters git

**Hard rule, and the reason is legal, not tidiness.**

Git history is permanent. A file deleted from the working tree remains retrievable from every prior commit, in every clone. If a child's photograph is committed to the repository, a consent withdrawal **cannot actually remove it** — the published site stops showing it, but the image stays recoverable by anyone with repo access, forever. That is retention without basis, and it breaks the withdrawal guarantee in WA-36 and WA-41.

**Therefore:**

- **Git holds text only.** Markdown, config, code.
- **All images and video live in Cloudflare Images / R2**, referenced from markdown by ID.
- **Keystatic must be configured to write media to the external store, not the repository** — its default behaviour commits uploads to git, and that default is wrong here.
- Withdrawal then genuinely works: delete from the media store, rebuild, and no copy survives anywhere.

Secondary benefit: the repository stays small enough to clone quickly, which matters once four campuses of photography accumulate.

**This applies to staff photographs too**, not only children's — WA-34's retention clock cannot run against an immutable history either.

---

## 10. Cross-cutting requirements

- **Zero client-side JS by default.** Islands only where interaction genuinely requires it.
- **No browser storage APIs.** Nothing in localStorage or sessionStorage.
- **No third-party embed scripts.** Instagram is fetched at build time and rendered as static markup (WA-18).
- **`EducationalOrganization` schema.org markup** on every campus (WA-27).
- **WCAG 2.1 AA** as the build target — cheap now, expensive to retrofit (WA-21, pending formal lock).
- **Privacy notice at every point of collection**, with published grievance contact and the retention periods from WA-34.
- **No identifiable child image enters the CMS.** The upload path must refuse it (WA-38). Until SHP is live, publication runs on manual verified check with a written log (WA-41).

---

*Phase 0 brief — derived from the Web Architecture Decision Register as at 2026-07-19. Any deviation from a WA decision goes back to the register, not into the code.*
