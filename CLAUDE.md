# Fountainhead Web

Multi-campus school website for the Fountainhead group. Astro, deployed to Cloudflare Workers with Static Assets (WA-5, revised 2026-07-19). One app, five campuses, one shared design system.

**Launch: 31 August 2026.** Content freeze 17 August.

---

## Start here

**`docs/Project Status.md` is the living handoff** — current state, infra
map, pending list, fresh-machine quickstart. Read it before doing anything;
update it when state changes materially.

## Authority

`docs/Web Architecture Decision Register.md` is authoritative. Decisions are numbered `WA-1` to `WA-42`.

- Cite the WA number when a decision explains the code.
- **A deviation goes back to the register, never into the code.** If a decision looks wrong, say so and stop — do not route around it.
- `docs/Phase 0 Build Brief.md` is the current task list.
- The register's Part 3 records corrections. Read it before assuming an item says what it originally said.

---

## Hard rules

Violating any of these breaks something real.

**1. No binary media in git.** Ever. Images and video live in Cloudflare Images / R2 and are referenced by ID. Git history is permanent — a committed photograph survives consent withdrawal in every clone, forever, which breaks WA-36 and WA-41. **Keystatic's default is to commit uploads to the repo; it must be configured otherwise.**

> **One carve-out: `sites/<site>/public/logos/` (VK, 2026-07-29).** The rule protects a *data subject
> whose consent can be withdrawn*. A university's own published crest has neither — no person is
> depicted, and the mark exists to be reproduced. Institution logos are therefore tracked in git,
> because they are published FROM the Career Counselling app (WA-43) and a Cloudflare round-trip
> would put a manual step in the middle of a generated pipeline. **This is not a softening of rule 1:**
> anything depicting a person still goes to Cloudflare Images behind the WA-38 child gate, wherever
> it lives. `publish-placements.ts` enforces a 50KB ceiling per file at the source, matching this
> repo's own lint — the first sourced set was 3.1MB for chips that render at 40px.

**2. No hardcoded brand values in components.** Always `var(--accent)`, never a hex literal. Brand resolves from the campus segment at build time. A component with a colour literal is a build failure.

**3. No browser storage APIs.** No `localStorage`, no `sessionStorage`, no `indexedDB`.

**4. No third-party embed scripts.** Instagram is fetched at build time and rendered as static markup (WA-18). No analytics, chat widgets, or social embeds without a register decision.

**5. Zero client-side JS by default.** Islands only where interaction genuinely requires it.

**6. Nothing is public by default.** The build maintains an explicit allowlist of fields renderable publicly (WA-42). Adding a field to a public template requires adding it to the allowlist deliberately.

**7. No identifiable child image enters the CMS.** The upload path must refuse it and redirect to SHP (WA-38). Until SHP exists, publication runs on a logged manual check (WA-41).

**8. One Astro app, not five.** All campuses are subdirectories of one build (WA-9). Campus domains attach as additional custom domains and 301 to their path.

---

## Repo layout

```
packages/tokens/          design tokens; one file per brand
packages/ui/              shared Astro components
packages/content-schema/  Zod schemas for every collection
sites/group/              the single Astro app
content/group/            commons — inherited by every campus
content/campuses/         per-campus overrides + campus-only pages
content/policies/         single-source policies (web + PDF export)
tools/crawl-inventory/    URL inventory + Search Console join
tools/extract-legacy/     Elementor → markdown pipeline
docs/                     register, build brief — reference, not code
```

---

## Content model

Three sources, one interface via Astro's content layer (WA-2):

| Tier | Source | What |
|---|---|---|
| A | markdown in git | group pages, campus pages, policies |
| B | Keystatic | news, events, FALH programmes |
| C | *interim: markdown* | staff directory, calendar — see below |

### Inherit-with-override (WA-11)

Request `/kunkni/philosophy/` → look for `content/campuses/kunkni/philosophy.md` → fall back to `content/group/philosophy.md`.

**Absence means inherit. Overrides are explicit files, never flags.** The build emits a report of inherited vs overridden pages per campus — silent drift is the failure mode this prevents.

---

## Interim state — read before writing any integration

**Nucleus 3.0 is under construction. No 3.0 module is available.** Do not write code that calls it.

| Surface | Target state | **What to build now** |
|---|---|---|
| Staff directory | SD-DIR | markdown in content tier |
| Calendar | CAL | markdown in content tier |
| Enquiry form | Admissions | POST to interim Postgres |
| Careers / internship | Recruitment | POST to interim Postgres |
| Child media consent | SHP | manual logged check, no code path |

The interim Postgres is the instance Payload needs in Phase 2, brought forward. **Model tables on the target module's record shape, not on the form** — migration should be a copy, not a transform (WA-40).

When a module goes live it is a loader swap. The frontend must not know the difference.

---

## Campus reference

| Path | Campus | Domain (301s in) |
|---|---|---|
| `/kunkni/` | Fountainhead School Kunkni, Surat | `fsksurat.in` |
| `/malgama/` | Fountainhead School Malgama, Surat | `fsmsurat.in` |
| `/fwgs/` | Fountainhead Wockhardt Global School | `fwgs.in` |
| `/falh/` | Fountainhead Avadh Learning Hub, Vapi | `falh.in` |
| `/fasv/` | Fountainhead Avadh School Vapi — **not launched**, landing page only | `fasv.in` |

FALH is preschool **plus after-school centre** (reading, robotics). It serves children attending other schools, so it carries a programme catalogue and two distinct conversion paths — not the school template (WA-35).

---

## Commands

```bash
pnpm install
pnpm dev                  # local dev → http://localhost:4321
pnpm build                # production build + zero-js & brand-parity gates
pnpm check                # astro check + types
pnpm lint                 # repo rules + brand anchors + WCAG contrast
pnpm test                 # vitest (resolver, purge, magic-bytes, schemas)
pnpm report               # inherit/override + drafts dashboard (~1s)
pnpm keystatic            # local CMS admin → http://localhost:4321/keystatic/
pnpm a11y                 # axe-core WCAG scan over built pages
pnpm media upload <f>     # Cloudflare Images upload (WA-38 child gate)
pnpm inventory            # crawl legacy site, emit URL CSV
pnpm inventory:join       # join Search Console export onto the inventory
pnpm redirects            # regenerate _redirects from redirect-map.csv
pnpm extract -- <url>     # Elementor page → markdown (or --sample N)
pnpm export:policies      # policy pages → PDF (print CSS = single source)
# local store: docker compose up -d postgres  (port 15432)
```

---

## Git discipline

- **Never push to `main`.** Branch, PR, preview deploy, merge.
- Branch names: `phase0/<thing>`, `content/<campus>`, `fix/<thing>`.
- Every branch gets a Cloudflare preview URL. Check it before requesting review.
- The `_redirects` file is **generated** from the URL inventory, never hand-edited (WA-25).
- Filenames for documents in `docs/` use spaces, not underscores.

---

## Do not build

Named explicitly so scope does not creep:

- **Payload CMS application layer** — Phase 2. Its Postgres comes forward now; the app does not.
- **`.org` content migration** — September, not August.
- **Alumni, TEDx, `fsapps`, `parents` subdomains** — out of scope (WA-32).
- **India Ultimate** — separate repo, separate instance, not this codebase (WA-33).
- **Any public read API** — not needed at launch; reads come from the content tier (WA-42).
- **Campus copywriting** — that is the content plan's lane, not engineering's.

---

## When stuck

If a task requires a decision the register does not cover, **stop and ask**. Do not infer. The register exists so that these questions get answered once, in one place, by the product owner.

## Model & token allocation

Enforced defaults (opusplan main session, Sonnet 5 subagents, medium workflow-size guideline) live
in `~/.claude/settings.json` globally. The judgment layer for when to escalate to Opus/Fable or stay
on Sonnet/Haiku is `nucleus/docs/model-allocation.md` (written for the core engine, but the same
judgment applies across this product family), imported below.

@../nucleus/docs/model-allocation.md

## Branch & PR hygiene

**Opening a PR is a request to merge. Do not open one until the work is finished and you want it in
`main` — and in production — the same minute.** VK merges an open PR as soon as he sees one, and he
is right to: an open PR means "this is ready."

While the work is in progress, commit and `git push -u origin <branch>` freely. **Pushing is backup;
opening the PR is the request.** A commit message on a pushed branch is where you write up progress —
a PR opened "to show where things are" invites a merge you did not intend.

- "Put it all in one PR" means **finish everything first, then open one PR** — never open one and
  keep adding commits to it.
- Never push to a branch whose PR is already open unless you have *just* confirmed it is open AND you
  are responding to review feedback on that same PR.

**Why this rule exists (it has bitten four times):**

- 2026-07-24, exam-module: VK merged #61 mid-work; a later `/help` commit pushed to that branch never
  reached `main`. VK looked at production and correctly didn't see it. Needed PR #63.
- 2026-07-28, high-school-diploma: fired twice in one day. The second time the state check and the
  push sat in one `&&` chain but the push wasn't *gated* on the result, so it ran anyway.
- 2026-07-28, fountainhead-web: **#22 stranded itself with nobody pushing anything.** It was stacked
  on #21's branch; VK merged #21, then #22 seventeen seconds later — into a base that had already
  gone to `main`. Both showed MERGED; an entire page redesign never shipped.
- 2026-07-29, career-counselling: VK merged #123 mid-session; the next two commits stranded and
  needed recovery PR #124. VK then named the rule at the top of this section.

**Recovery, when it happens anyway:** `git fetch origin main` -> `git checkout -b <new> origin/main`
-> `git cherry-pick` the stranded commits -> open a fresh PR -> delete the dead remote branch so it
can't mislead later.

**`state=MERGED` is not proof the work shipped.** Verify the commits are ancestors of `origin/main`:
`git merge-base --is-ancestor <sha> origin/main`, or `git log origin/main..<branch> --oneline` (empty
= landed). Check this before telling anyone "it's merged", and whenever a PR's `baseRefName` is
anything other than `main`.

**Prefer basing PRs on `main` outright.** Stacking is only safe if the stack merges bottom-up AND
each child is retargeted to `main` once its parent lands.
