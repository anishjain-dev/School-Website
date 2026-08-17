# Fountainhead Group — Web Architecture Decision Register

**Source:** Architecture working session, 19 July 2026 (Vardan Kabra + Claude).
**Prepared for:** VK to ratify; in-house developer to build against.
**Scope:** All Fountainhead-group public websites, plus ARISE, USET. India Ultimate treated as a pattern consumer, not a tenant.
**Relationship to prior work:** Independent of the Nucleus Career Counselling register (CC-1–25). Shares the Nucleus 3.0 stack assumption and DPDP posture.

**How to use:** Living tracker. Locked items are struck through and marked ✅ with the decision recorded inline; open items stay plain. New items are appended as they surface. Each item carries a recommended default, an owner, and a tier.

**Progress:** ✅ Locked — WA-1–19, WA-21–31, WA-34–49. ◻ Open — WA-20, WA-32–33. **No open blockers.** Last updated 2026-07-27.

**Reconciliation:** all six items from the Nucleus Reconciliation Brief are dispositioned. C1 → WA-38. C2 → WA-19 revised. G2 → WA-39. G1 and G3 → WA-42 (routed, provisional assumptions locked).

**Tiers:** **Blocker** (gates go-live) · **Operational** (needed before real use) · **Governance** (decide before go-live, can follow) · **Deferred** (later pass).

**Status legend:** ✅ Locked · ◻ Open · 🆕 New · ⏸ Deferred.

---

## Summary

| # | Theme | Decision | Owner | Tier | Status |
|---|---|---|---|---|---|
| WA-1 | Stack | Frontend framework | VK | Blocker | ✅ Locked |
| WA-2 | Stack | Three-tier content sourcing | VK | Blocker | ✅ Locked |
| WA-3 | Stack | CMS product | VK | Blocker | ✅ Locked |
| WA-4 | Stack | CMS phasing | VK | Blocker | ✅ Locked |
| WA-5 | Stack | Hosting | VK | Blocker | ✅ Locked |
| WA-6 | Stack | Repository structure | Dev | Operational | ✅ Locked |
| WA-7 | Stack | Editor identity / auth | Dev | Operational | ✅ Locked |
| WA-8 | IA | Group + campus model | VK | Blocker | ✅ Locked |
| WA-9 | IA | Canonical URL location | VK | Blocker | ✅ Locked |
| WA-10 | IA | Campus domain behaviour | VK | Blocker | ✅ Locked |
| WA-11 | IA | Inherit-with-override pages | Dev | Operational | ✅ Locked |
| WA-12 | IA | Campus-specific page set | VK | Operational | ✅ Locked |
| WA-13 | Content | Policies as single source | VK | Operational | ✅ Locked |
| WA-14 | Content | Statutory block design | VK | Governance | ✅ Locked |
| WA-15 | Content | Staff directory source | Dev | Operational | ✅ Locked |
| WA-16 | Content | Calendar source | Dev | Operational | ✅ Locked |
| WA-17 | Content | News / events | Comms | Operational | ✅ Locked |
| WA-18 | Content | Social feed handling | Dev | Operational | ✅ Locked |
| WA-19 | Compliance | Student photo consent | VK | Blocker | ✅ Locked |
| WA-20 | Compliance | Data residency | VK | Governance | ◻ Open |
| WA-21 | Compliance | Accessibility target | VK | Governance | ✅ Locked |
| WA-22 | Compliance | Forms & enquiry data | VK | Blocker | ✅ Locked |
| WA-23 | Compliance | Child protection prominence | VK | Governance | ✅ Locked |
| WA-24 | Migration | Elementor = rebuild | VK | Blocker | ✅ Locked |
| WA-25 | Migration | URL inventory + redirect map | Dev | Blocker | ✅ Locked |
| WA-26 | Migration | Rollback plan | Dev | Blocker | ✅ Locked |
| WA-27 | Migration | Structured data markup | Dev | Operational | ✅ Locked |
| WA-28 | Delivery | August scope | VK | Blocker | ✅ Locked |
| WA-29 | Delivery | Content authoring owner | VK | Blocker | ✅ Locked |
| WA-30 | Delivery | Developer hire profile | VK | Operational | ✅ Locked |
| WA-31 | Delivery | Brand clarity: FALH / FASV | VK | Operational | ✅ Locked |
| WA-32 | Delivery | Existing subdomain estate | VK | Deferred | ◻ Open |
| WA-33 | External | India Ultimate relationship | VK | Governance | ◻ Open |
| WA-34 | Compliance | Retention periods | VK | Operational | ✅ Locked |
| WA-35 | Content | FALH programme catalogue | VK | Blocker | ✅ Locked |
| WA-36 | Compliance | Consent withdrawal path | R3 | Operational | ✅ Locked |
| WA-37 | Delivery | August cutover sequencing | VK | Blocker | ✅ Locked |
| WA-38 | Content | Gallery ownership — CMS vs SHP | VK | Blocker | ✅ Locked |
| WA-39 | Compliance | Public form filtering & upload hardening | Dev | Blocker | ✅ Locked |
| WA-40 | Stack | Interim data layer pending Nucleus 3.0 | VK | Blocker | ✅ Locked |
| WA-41 | Compliance | Interim gallery consent | Comms | Blocker | ✅ Locked |
| WA-42 | Platform | Routed items & provisional assumptions | R3 / PLAT | Governance | ✅ Locked |
| WA-43 | Content | Placements & results source | Dev | Blocker | ✅ Locked |
| WA-44 | Stack | Placements visualisation without an island | Dev | Blocker | ✅ Locked |
| WA-45 | Compliance | Named celebration layer vs aggregate data layer | VK / Comms | Blocker | ✅ Locked |
| WA-46 | Content | Placements campus scoping | VK | Governance | ✅ Locked |
| WA-47 | IA | Preschool estate & early-years template | VK | Blocker | ✅ Locked |
| WA-48 | IA | Network nav depth & common-page scoping | VK | Blocker | ✅ Locked |
| WA-49 | Compliance | Testimonials scope & consent staging | VK / Comms | Governance | ✅ Locked |
| WA-50 | Content | Cross-border campus counting | VK | Blocker | ✅ Locked |
| WA-51 | Content | Campus vs school in the reference | VK | Governance | ✅ Locked |

---

## Part 1 — Items

### ~~WA-1 — Frontend framework~~ ✅ Locked
**Decision (locked, 2026-07-19):** Astro for every site in the group.
- Content-first, zero JS by default, strong Core Web Vitals out of the box.
- Content lives as plain files, so Claude Code can edit it directly — this is the single biggest reason over WordPress.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-2 — Three-tier content sourcing~~ ✅ Locked
**Decision (locked, 2026-07-19):** Content is sourced from three places, unified through Astro's content layer so templates consume them identically.
- **Tier A (~70%)** — near-static pages (philosophy, curriculum, admissions process, facilities, policies): markdown in git.
- **Tier B (~10%)** — frequently edited (news, events, galleries, testimonials): CMS.
- **Tier C (~20%)** — already exists in Nucleus (staff directory, calendar, circulars, results): API, never re-typed.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-3 — CMS product~~ ✅ Locked
**Decision (locked, 2026-07-19):** Payload CMS, self-hosted, one instance serving all group sites.
- Node/TypeScript — same stack as Nucleus 3.0, so one developer covers both.
- No per-seat billing across 7+ sites and many editors.
- Self-hosted in India, which keeps the DPDP posture consistent with Nucleus.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-4 — CMS phasing~~ ✅ Locked
**Decision (locked, 2026-07-19):** Payload is **not** in the first release. Phase 1 ships with markdown + **Keystatic** (git-based, zero infra, free). Payload lands in Phase 2 once the developer is in place.
- The Astro frontend is decoupled from the content source, so this is a loader swap, not a rebuild.
- Rationale: standing up Payload is a distraction from an aggressive first deadline, and the CMS decision stays reversible.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-5 — Hosting~~ ✅ Locked
**Decision (locked, 2026-07-19; revised same day, ratified by VK at Phase 0 Stage 2):** **Cloudflare Workers with Static Assets** for all sites, deployed by Workers Builds (Cloudflare git integration). Cloudflare Images for media.
- Original wording said "Cloudflare Pages". Corrected on verification: the FWGS intranet — the cited precedent — actually runs Workers + Static Assets (`wrangler.jsonc`, git-integration deploys), and Pages is in maintenance mode while new platform features land on Workers only.
- The revision preserves every original rationale point: proven on the intranet, per-branch preview URLs before merge, good India edge presence, no extra cost.
- What it additionally enables, all needed by this build: cron triggers (WA-34 purge job), Hyperdrive (interim Postgres access, WA-40), R2 bindings, and server endpoints for forms (WA-22/WA-39) in the same Worker as the static site.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-6 — Repository structure~~ ✅ Locked
**Decision (locked, 2026-07-19; FWGS values revised 2026-07-20):** Single monorepo (pnpm workspaces).
- `packages/ui` — shared components.
- `packages/tokens` — design tokens, one theme file per brand. ~~(FWGS `#1d4f9e` / `#e1232b`; Fountainhead its own)~~ **Revised per the 2025 FWGS Brand Manual (read 2026-07-20, ratified by VK): FWGS uses the Fountainhead primary palette `#005BAA`/`#B8292F`/`#F2C418`; the earlier values were intranet-era. Wockhardt identity is carried by the logo lockup. The intranet is a separate system and keeps its old colours.**
- `sites/*` — one thin app per site, consuming both.
- Folder-name-equals-URL-path convention carried over from the FWGS intranet.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-7 — Editor identity / auth~~ ✅ Locked
**Decision (locked, 2026-07-19):** Editors authenticate against Nucleus identity, not a separate CMS user store. No second set of credentials for staff.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-8 — Group + campus model~~ ✅ Locked
**Decision (locked, 2026-07-19):** One group site carrying the commons (philosophy, IB, board, careers, group policies), with each campus getting its own section for parents evaluating that specific campus and for statutory display.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-9 — Canonical URL location~~ ✅ Locked
**Decision (locked, 2026-07-19):** Canonical URLs are subdirectories on the main domain:

```
fountainheadschools.org/            group
fountainheadschools.org/kunkni/     campus
fountainheadschools.org/malgama/
fountainheadschools.org/vapi/
fountainheadschools.org/fwgs/
```

- Rationale: 15+ years of domain authority. A fresh subdomain or standalone domain starts at zero and takes 12–18 months to compete for "IB school Surat" style queries.
- Exactly one canonical URL per page. No page is indexable at two addresses.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-10 — Campus domain behaviour~~ ✅ Locked
**Decision (locked, 2026-07-19):** Yes — the campus domains can and should point here. Mechanism is **301 redirect to the canonical path**, not duplicate hosting.

**Revised 2026-07-19 (second revision, per VK).** All campuses are treated identically website-wise. Ownership structure is irrelevant to URL architecture.

| Domain | Behaviour |
|---|---|
| `fsksurat.in` | 301 → `/kunkni/` |
| `fsmsurat.in` | 301 → `/malgama/` |
| `fwgs.in` | 301 → `/fwgs/` |
| `falh.in` | 301 → `/falh/` |
| `fasv.in` | 301 → `/fasv/` |

- Every campus inherits the full domain authority of `fountainheadschools.org`. No campus starts from zero.
- One rule, no exceptions, no per-campus judgement calls — simpler for the developer, comms, and anyone explaining it later.
- Redirected domains stay fully usable for hoardings, business cards, and verbal handoff. A parent types `falh.in`, lands on the right page.
- Cloudflare Pages attaches multiple custom domains to one project, so this costs nothing extra.
- Partner co-branding (Wockhardt, Avadh) is carried by per-campus theming under WA-6, not by separate domains.

**Mechanism (chosen by VK, 2026-07-20):** **GoDaddy Domain Forwarding** (registrar-side 301, "forward only" — never masking), keeping all DNS management at GoDaddy. Consequences accepted:
- Until the `.org` cutover, forwards target the interim `workers.dev` host; destinations are re-pointed to the canonical `fountainheadschools.org` paths at cutover (one edit per domain).
- Forwarding sends every legacy `fwgs.in` URL to the campus home (no path preservation); acceptable, revisit at cutover if legacy `fwgs.in` deep links matter.
- The campus domains never *serve* the site during the Aug–Sept window; the `workers.dev` address is the visible interim host.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-11 — Inherit-with-override pages~~ ✅ Locked
**Decision (locked, 2026-07-19):** Campus pages inherit the group version by default and override only where genuinely different.
- Without this, 5 campuses × ~40 pages = 200 pages of silent drift within a year.
- Overrides are explicit files; absence means inherit.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-12 — Campus-specific page set~~ ✅ Locked
**Decision (locked, 2026-07-19):** Roughly 12–15 pages per campus are genuinely campus-specific: admissions and fees, staff, calendar, statutory, facilities, transport, contact, campus news. Everything else inherits.
**Owner:** VK. **Tier:** Operational.

### ~~WA-13 — Policies as single source~~ ✅ Locked
**Decision (locked, 2026-07-19):** Policies live once, as markdown in git, and render to **both** the website and PDF/DOCX export.
- Currently ~35+ policy pages exist across `/school-policy/`, `/academic-policy/`, `/health-policy/`, `/other-policies/` — while the same policies are separately maintained as Word documents. That is guaranteed drift.
- After this change, a policy update is a one-place job.
**Owner:** VK. **Tier:** Operational.

### ~~WA-14 — Statutory block design~~ ✅ Locked
**Decision (locked, 2026-07-19):** Statutory information is a **structured content type with optional fields**, not free text, and not rendered at all while the group is IB-only.
- Schema exists from day one and stays dormant; fields switch on per campus as required.
- Designed jurisdiction-aware from the start (Gujarat vs Maharashtra vs any future CBSE/state-board affiliation), so adding a board later is configuration, not a rebuild.
- Rendered identically across campuses so compliance is auditable in one view.
**Owner:** VK. **Tier:** Governance.

### ~~WA-15 — Staff directory source~~ ✅ Locked
**Decision (locked, 2026-07-19):** Staff directory renders from **SD-DIR via Nucleus** as the target state. Never maintained in the CMS. Replaces the current `/peoplefs/` and `/organogram/` pages.
- **Interim to 31 Aug (WA-40):** authored in the content tier as markdown. Loader swap when SD-DIR is live; the frontend does not change.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-16 — Calendar source~~ ✅ Locked
**Decision (locked, 2026-07-19):** School calendar renders from **CAL via Nucleus** as the target state, per campus. Replaces the current `/school-calendar/` page.
- CAL's specification already names the public website among the hand-transcribed copies it eliminates, so this is anticipated, not additive.
- **Interim to 31 Aug (WA-40):** authored in the content tier as markdown. Loader swap when CAL is live.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-17 — News and events~~ ✅ Locked
**Decision (locked, 2026-07-19; galleries carved out 2026-07-19 by WA-38):** News and events are the CMS-managed tier, edited by comms without developer involvement.
- **Galleries are no longer covered here.** Photographic content is governed by WA-38.
**Owner:** Comms. **Tier:** Operational.

### ~~WA-18 — Social feed handling~~ ✅ Locked
**Decision (locked, 2026-07-19):** Instagram content is fetched at build time and rendered as static markup. No third-party embed plugin.
- The current Instagram Feed Pro plugin loads Meta CDN assets client-side on every visit — a performance and privacy cost on the homepage.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-19 — Student photo consent~~ ✅ Locked
**Original question:** How consent for publishing identifiable student images is captured and enforced.

**Decision (locked, 2026-07-19; revised same day to resolve C2):** Consent is captured **once at admission** — not per instance — but **enumerated by channel**, not blanket in scope.

**The distinction that resolves the conflict.** FDC-5 rejects blanket in *scope* ("photographs may be used for school purposes" — vague enough to stretch over anything, which is purpose creep). It does not reject blanket in *timing*. Capturing once at admission is fine; the form must name the channels.

**Form structure — per-channel toggles plus a naming flag:**

| Toggle | Covers |
|---|---|
| Public website | `fountainheadschools.org` and campus paths |
| School social media | Instagram, YouTube, Facebook |
| Print and press | Prospectus, hoardings, newspaper |
| **May be named** | Separate flag — child identified by name alongside image |

- **Why third-party platforms are their own switch:** the withdrawal rule gates media across Nucleus systems. It cannot reach Meta's servers. Parents reasonably feel differently about the irretrievable case.
- **Why naming is its own switch:** naming a child alongside a university destination is a step change in exposure over a wide shot of a class activity.
- **Website cost is nil.** The build reads one boolean — *may this child appear on the public site*. The extra granularity lands on Instagram and print, both outside this build.
- **Aligns with R3-12 band 3** (external/public sharing as a distinct purpose) without abandoning single-capture.
- **Counsel gate applies** — joins the standing data-protection queue.
- **Interim to re-papering:** galleries ship 31 Aug under existing signed consent; new form lands at 2026-27 re-enrolment. See WA-41.
**Owner:** VK. **Tier:** Blocker.

### WA-20 — Data residency
**Decision needed:** Whether to commit formally to India-resident hosting for CMS content and media.
**Recommended default:** Yes — consistent with the Nucleus posture, and removes a category of question during IB evaluation and parent scrutiny.
**Owner:** VK. **Tier:** Governance.

### ~~WA-21 — Accessibility target~~ ✅ Locked
**Original question:** Whether WCAG 2.1 AA is a stated commitment or a best-effort.

**Decision (locked, VK, 2026-07-27):** **Stated WCAG 2.1 AA commitment.** Cheap to build in from scratch, expensive to retrofit, and increasingly asked about in IB evaluation visits. The Brief already builds to AA; this makes it binding rather than aspirational.
- Forced by WA-48: a two-level disclosure navigation is the highest-risk accessibility surface on the site, and building it against a best-effort target invites drift.
- `pnpm a11y` (axe-core) gates the build, but automated scanning does not catch a broken disclosure. Keyboard traversal and a screen-reader pass are required manual checks on any navigation change.
**Owner:** VK. **Tier:** Governance.

### ~~WA-22 — Forms and enquiry data~~ ✅ Locked
**Original question:** Where campus-visit enquiries, careers applications, and internship forms land, and who has access.

**Decision (locked, 2026-07-19):** Option A — everything into Nucleus. Visit enquiries land as admissions leads; careers and internship applications land in recruitment. No third-party form tools, no shared inboxes.
- Affected surfaces: homepage visit-request form, `/online-form-center/`, `/careers/`, `/internship-programme/`.
- Confirmed against FDC-8, whose absorb-vs-leave rule explicitly leaves the Admissions enquiry with Admissions rather than absorbing it into the forms engine.
- Carries a DPDP notice requirement at point of collection, plus a published grievance contact. Retention in WA-34.
- **Interim to 31 Aug (WA-40):** submissions land in the interim store in Nucleus schema shape, migrated on 3.0 cutover.
- Abuse filtering and upload hardening in WA-39.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-23 — Child protection prominence~~ ✅ Locked
**Original question:** Whether `/child-protection/` retains top-level prominence in the new IA.

**Decision (locked, VK, 2026-07-27):** **Both — the elevated utility-strip link is retained, and the policy document is also listed under Policies.** Findable two ways; demoted neither.
- Forced by WA-48. The marketing IA proposal filed Child Protection as one policy among eleven, which would have removed the elevated placement. Rejected: it is a differentiator worth surfacing, not routine compliance.
- The utility strip sits above the main nav on every page and is unaffected by the two-level nav grouping.
**Owner:** VK. **Tier:** Governance.

### ~~WA-24 — Elementor = rebuild, not migrate~~ ✅ Locked
**Decision (locked, 2026-07-19):** The existing site is WordPress + Elementor 4.1.5. Elementor stores layouts as serialised JSON in `wp_postmeta`, so a standard WordPress export yields near-empty pages. **There is no clean migration path.**
- Approach: crawl the rendered site, convert each page to markdown with Claude Code, human-review.
- Scope is roughly 100–150 pages by current nav depth.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-25 — URL inventory and redirect map~~ ✅ Locked
**Decision (locked, 2026-07-19):** Full URL inventory and a `_redirects` map ship **before** any page is written, not after.
- Sources: site crawl + Google Search Console top pages by impression.
- High-equity paths include `/admission/admission-process/`, `/academics/primary-years-programme/`, `/school-policy/uniform-policy/`, the full `/health-policy/` and `/academic-policy/` trees.
- This is the single most common way a school site migration damages the admissions funnel.
**Owner:** Dev. **Tier:** Blocker.

### ~~WA-26 — Rollback plan~~ ✅ Locked
**Decision (locked, 2026-07-19):** The WordPress install stays running on a staging hostname through cutover, so DNS can flip back within minutes. Non-negotiable given the launch lands inside the admissions cycle.
**Owner:** Dev. **Tier:** Blocker.

### ~~WA-27 — Structured data markup~~ ✅ Locked
**Decision (locked, 2026-07-19):** `EducationalOrganization` schema.org markup on every campus, with address, programmes, and admissions detail.
- Secondary benefit: parents increasingly ask AI assistants about schools before visiting, and structured admissions/fees pages are what those systems read.
**Owner:** Dev. **Tier:** Operational.

### ~~WA-28 — August scope~~ ✅ Locked
**Original question:** What exactly must be live by 31 August 2026.

Six weeks from today. Honest read on the two options:

**Option A — de-scoped .org migration.** Ship the ~40 pages that carry traffic (admissions, academics, about, contact, core policies), 301 the long tail to their nearest parent, restore the remainder across September–October. Search Console will likely show ~80% of traffic hitting ~25 pages. Feasible, but content review is the crunch and it lands mid-admissions-cycle.

**Option B — greenfield first.** Ship `fsksurat.in` and `fsmsurat.in` (neither exists today, so zero SEO risk, no redirect map, no rollback exposure) plus the design system and component library. Move the `.org` migration to September–October with a staged cutover.

**Decision (locked, 2026-07-19; scope revised same day per WA-35):** Option B — greenfield first, then extended to all sites.
- By 31 Aug: design system and shared component library, plus `/kunkni/`, `/malgama/`, `/falh/`, `/fwgs/` and a `/fasv/` interest-capture page.
- Cutover sequencing within August is an open delivery question — see WA-37.
- `.org` cutover late September, with URL inventory and content extraction running in parallel through August.
- **Copy freeze 17 August** — two weeks before launch. Rewriting during QA is how dates slip.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-29 — Content authoring owner~~ ✅ Locked
**Original question:** Who writes and reviews copy for the new campus sites.

**Decision (locked, 2026-07-19):** Option B for now — central comms team owns all site content. Option A (named owner per campus) becomes available as the system matures and campus teams grow.
- Volume is smaller than page count suggests: ~70% of campus content adapts from existing `.org` copy. Only the ~12–15 campus-specific pages per site need original writing — roughly 30 pages of genuinely new copy across FSK and FSM.
- Team is **5 people, all central**, handling site copy alongside normal marketing.
- **Standing risk:** a single central team is the throughput constraint on the 31 Aug date. Tracked, not re-litigated.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-30 — Developer hire profile~~ ✅ Locked
**Decision (locked, 2026-07-19):** TypeScript / Node / React / git. Explicitly **not** a WordPress-PHP profile.
- Same person covers Nucleus 3.0 work, which is how the seat justifies itself.
**Owner:** VK. **Tier:** Operational.

### ~~WA-31 — Brand clarity: FALH / FASV~~ ✅ Locked
**Original question:** What `falh.in` and `fasv.in` represent, and whether they redirect or stay canonical.

**Decision (locked, 2026-07-19):**
- **FALH — Fountainhead Avadh Learning Hub.** Launched. Preschool **plus after-school centre** (reading, robotics and similar). Avadh joint venture.
- **FASV — Fountainhead Avadh School Vapi.** The IB school. Not yet launched.
- **FALH is the feeder to FASV.**
- Both canonical on their own domains under the WA-10 ownership rule (co-branded JV).

**Consequences flowing from this:**
1. FALH's after-school arm serves children who attend *other* schools — a materially wider addressable audience than any campus site, and a different search intent ("robotics classes Vapi", not "IB school Vapi").
2. FALH therefore needs a **programme catalogue**, not a school page structure. See WA-35.
3. Enrolment in an after-school batch is not school admission. Routed to Nucleus as a separate question.
4. As the feeder, FALH should capture early interest for FASV before FASV exists. Build the pipeline now.
**Owner:** VK. **Tier:** Operational.

### WA-32 — Existing subdomain estate
**Decision needed:** Whether `alumni.`, `parents.`, `fsapps.` and the external TEDx site come into scope.
**Recommended default:** Out of scope for now. `parents.` is Nucleus and stays put. `fsapps.` was recently rebuilt. `alumni.` and TEDx are candidates for a later pass.
**Owner:** VK. **Tier:** Deferred.

### WA-33 — India Ultimate relationship
**Decision needed:** Terms on which the pattern transfers to the national body.
**Recommended default:** Same system, **separate deployment** — separate repo, separate CMS instance, separate Cloudflare account billed to them. Shared: the component library as a package, CMS schema conventions, deploy setup. Their outage should not be your outage, and given VK sits on both sides, clean infra separation avoids awkward questions later.
- Their content model (tournaments, fixtures, results, rosters, rankings, memberships) is genuinely reusable across Indian sports federations.
**Owner:** VK. **Tier:** Governance.

### ~~WA-36 — Consent withdrawal path~~ ✅ Locked
**Original question:** How a parent withdraws photo consent given at admission.

**Decision (locked, 2026-07-19):** Withdrawal is **not** built locally for photo consent. It is a platform-level consent primitive in Nucleus that any module consumes — photo publication, form-collected data, communications preferences, biometric consent, and others as they arise.
- Per VK: the capability will be needed in several places, so it belongs in the foundation.
- **Routed to R3 Inbox.** Not solved in this register.
- The web build consumes it: consent state read at build time, withdrawal propagating on next rebuild.
- Requirement it must satisfy: withdrawal as easy as giving consent. A paper signature at admission does not on its own meet this.
**Owner:** Routed to R3. **Tier:** Operational.

### ~~WA-34 — Retention periods~~ ✅ Locked
**Original question:** How long form-collected personal data is held.

**Decision (locked, 2026-07-19):**
- Enquiry leads — purged at **24 months** if no admission follows.
- Careers CVs — **12 months** post-decision, unless the candidate consents to a longer talent-pool hold.
- Internship applications — **12 months**.
- Periods published in the privacy notice, enforced in Nucleus rather than by manual cleanup.
**Owner:** VK. **Tier:** Operational.

### ~~WA-35 — FALH programme catalogue~~ ✅ Locked
**Original question:** Whether FALH's after-school arm gets a proper programme-catalogue content type in the first build.

**Decision (locked, 2026-07-19):** Yes — full programme catalogue, and **all sites come into scope**.
- Catalogue fields: courses, batches, age bands, timings, session counts, fees, enrolment status.
- Two distinct audiences on one site: preschool parents (feeder funnel to FASV) and after-school parents whose children attend other schools. Navigation and conversion paths differ for each.
- `/fasv/` ships as a single interest-capture landing page ahead of launch, so the feeder pipeline starts building now.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-37 — August cutover sequencing~~ ✅ Locked
**Original question:** Whether all four sites go live on 31 August, or the cutover is staged within the window.

**Decision (locked, 2026-07-19):** Single cutover — all four sites plus the `/fasv/` landing page live on 31 August, with the FALH programme catalogue built properly rather than retrofitted.
- Staging was proposed to relieve developer capacity. Developers are in place, so the rationale falls away.
- **Content is now the sole critical path.** ~65 pages of new or rewritten copy, 5 central comms staff, 4 weeks to the 17 August freeze — roughly 3 pages per person per week, alongside admissions-season marketing.
- Engineering can absorb slippage; the copy freeze cannot. If a date is going to move, it will be this one.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-38 — Gallery ownership: CMS vs SHP~~ ✅ Locked
**Original question (Reconciliation Brief C1):** Where website photographs live, given SHP already owns children's media with a consent gate.

**Decision (locked, 2026-07-19):** **Split by content, not by system.**

> **Any identifiable child → SHP. Everything else → CMS.**

- **The mechanic that removes the judgement call:** the CMS upload asks whether the image contains an identifiable child. If yes, it **refuses the upload and redirects to SHP**. Comms never has to remember the rule.
- Facilities, campus scenes, event photography without identifiable faces, and stock imagery stay in the lightweight CMS workflow.
- Avoids the failure mode of two consent enforcement points, where a parent withdraws consent, SHP honours it, and the website silently does not.
- **Consequence:** an **SHP addendum** amending SHP-1 from two faces (Share, File) to three (Share, File, **Publish**). Same capture, same consent gate, one more destination. One decision, not a reopened loop.
- **Interim to 31 Aug:** SHP does not exist yet. See WA-41.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-39 — Public form filtering and upload hardening~~ ✅ Locked
**Original question (Reconciliation Brief G2):** Who keeps junk out of the admissions pipeline, given FDC explicitly declines unauthenticated forms.

**Decision (locked, 2026-07-19):** **Web-local at the edge.** Bot protection and rate limiting at Cloudflare, then clean submissions post to the owning module's API.

**The boundary, stated so it does not drift:**
- **Edge answers "is this a machine?"** — bots, volume, rate. Filtered before it reaches your infrastructure.
- **Module answers "is this a real prospect?"** — duplicates, validity, lead quality. Admissions' job regardless.

The edge has no idea what a duplicate lead looks like; Admissions should not absorb bot traffic to find out.

**Not a platform capability.** Over-engineering at one consumer. **Named trigger to revisit:** a second public-facing surface — a public alumni portal, public event registration. India Ultimate does not count; separate instance.

**CV upload hardening.** Careers and internship forms accept file uploads from anonymous members of the public — the highest-risk surface in the build. Eight layers; **1–4 and 6 ship in Phase 0**, 5 and 7 belong with Recruitment:

1. **Magic-byte validation** — verify the file's actual signature against its claimed extension. A real PDF starts `%PDF-`; a real `.docx` starts `PK`. Mismatch is rejected. Cheapest, highest-value check.
2. **Extension allowlist** — `.pdf`, `.doc`, `.docx` only. Never a blocklist; blocklists always lose eventually.
3. **Size cap** — 5MB. A CV is under 2MB.
4. **Quarantine then promote** — lands in an isolated area, virus-scanned, only moves to the real store if clean. ClamAV is adequate.
5. *(Recruitment)* **Strip embedded content** — remove JavaScript and auto-actions from PDFs. **Strip, do not re-render** — re-rendering destroys the text layer, which Recruitment needs to search and parse.
6. **Safe serving** — never from the main domain, forced download rather than inline, randomised filename.
7. *(Recruitment)* **Preview, do not download** — HR reads CVs in a browser preview, not in Word. Collapses macro risk.
8. **Retention as security** — WA-34's 12-month purge is not only a DPDP obligation; less accumulated material is a smaller target.
**Owner:** Dev. **Tier:** Blocker.

### ~~WA-40 — Interim data layer pending Nucleus 3.0~~ ✅ Locked
**Original question:** Nucleus 3.0 is being built, not live. What is behind the integration endpoints on 31 August?

**Decision (locked, 2026-07-19):** Interim layer — **but reads and writes are handled differently.**

**Writes (forms) → interim store.** Use the **Postgres instance Payload needs in Phase 2, brought forward.** The interim store is not throwaway; it becomes Phase 2 infrastructure arriving early. Three binding conditions:
1. **Indian hosting** — the DPDP posture holds from day one rather than being retrofitted.
   **⚠ Accepted deviation (VK, 2026-07-20, pilot phase):** the store runs on **Railway (Singapore)** — the team's existing platform; no India region exists on it. **Named sunset: migrate to India-hosted Postgres at or before the `.org` cutover (late September 2026), before launch traffic.** Migration is a `pg_dump`/restore plus one connection-string change; the schema (condition 2) is host-agnostic. Logged against WA-20's pending residency commitment.
2. **Nucleus schema shape, not a convenient one** — migration becomes a copy, not a transform.
3. **The WA-34 purge job runs here.** A 24-month clock in a store with no deletion mechanism is how a retention promise quietly becomes false.

**Reads (directory, calendar) → content tier.** Nothing to migrate; the data does not exist in 3.0 yet. Authored as markdown by comms alongside everything else. Staff lists and calendars change slowly and comms is already in that workflow. Loader swap when CAL and SD-DIR come online — the same de-risking as WA-4's Keystatic-to-Payload path.

**Anti-permanence mechanics.** Interim stores become permanent when nobody wrote down what ends them:
- Schema shape matches the target (above).
- Migration trigger named: **Nucleus 3.0 module go-live**, per module.
- **Sunset date on each interim surface**, reviewed at 3.0 cutover.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-41 — Interim gallery consent~~ ✅ Locked
**Original question:** WA-38 routes identifiable children to SHP, but SHP is part of 3.0 and will not exist on 31 August.

**Decision (locked, 2026-07-19):** **Manual verified publication**, sunset-dated.
- Comms checks each photograph against the signed paper consent register before publication and **logs it** — image, date, checking staff member, consent reference.
- Retrofitted into SHP when it goes live.
- Defensible for a three-to-six month interim: signed consent already exists, volume at launch is a handful of galleries, and DPDP enforcement begins May 2027.
- **Rejected:** an interim consent table in the interim store — it builds consent machinery that SHP then replaces.
- **Binding condition:** the log is real and written. A manual check without a record is indistinguishable from no check.
- **Sunset:** SHP go-live.
**Owner:** Comms. **Tier:** Blocker.

### ~~WA-42 — Routed items and provisional assumptions~~ ✅ Locked
**Original question (Reconciliation Brief G1, G3):** Two gaps are cross-module infrastructure. What does the web build assume until they are answered?

**Decision (locked, 2026-07-19):** Route both; lock a provisional assumption the build works against, superseded on arrival.

**G1 — no public visibility classification. → R3 Inbox.**
R3-4 runs Standard → Sensitive → Restricted, each *adding* restriction. Standard still means role plus scope — an authenticated user holding a posting. **No tier represents "readable without authentication."** This is a foundation concept affecting any module with publicly-surfaced data.
- *Why it surfaced here:* every consumer to date has been an authenticated internal user. The website is the first that is not.
- **Rides the already-planned R3 reconciliation pass** — the R3 register already flags the tier set as provisional pending it. No parallel track.
- **Provisional assumption:** the web build maintains an **explicit allowlist** of fields it may render publicly. Nothing is public by default. Superseded when R3 answers.

**G3 — no public read API surface. → PLAT.**
No module contemplates an unauthenticated read path; a defined endpoint set, caching posture, rate limiting and build webhook are needed.
- **Moot for launch.** WA-40 moves reads to the content tier, so no public read endpoint is required on 31 August. This becomes live when CAL and SD-DIR cut over.
**Owner:** R3 / PLAT. **Tier:** Governance.

### ~~WA-43 — Placements and results source~~ ✅ Locked
**Original question:** `/parent-corner/placements/` and `/parent-corner/results/` are required for launch. Where does the data come from, given Nucleus 3.0 is not live?

**Decision (locked, 2026-07-27):** Same shape as WA-15/WA-16. **Target state:** placements render from the **Career Counselling module** (institution reference, portfolio → application → outcome → placement) and results from **IBDP/MYP Results**, via Nucleus. Never re-typed, never re-keyed by comms. This is anticipated, not additive — WA-2's Tier C already names *results*.

**Interim to 31 August (WA-40 reads → content tier):** a **generated, de-identified dataset** authored into the content tier as data files, rendered at build time.

- **Source for the interim file is the legacy placements sheet, normalised once** *(confirmed VK, 2026-07-27)* — *"FS students placements data for awesome tables"* (2016 → 2026, ~136 institutions, ~286 rows already geocoded). The Career Counselling app carries only synthetic seed data today; its real roster import is still open on its own backlog. Waiting for the app would mean no placements page at launch.
- **The legacy sheet is never the live source.** It carries student name, FSK ID, a photo URL on `nucleus.`, Grade 10 and Grade 12 finals, scholarship amounts and per-student coordinates, and has drifted into four tabs with inconsistent columns. It is an input to a one-time normalisation, not a feed. The current Looker Studio embed reading it is retired by WA-44.
- **Binding condition (WA-40 condition 2 applied):** the interim file is shaped to the **Career Counselling emit contract**, not to the sheet. Migration is a copy, not a transform.
- **Publication is a deliberate act.** The dataset is a versioned snapshot carrying `generatedAt`, reviewed in a PR before merge. There is no live read path from a student database to a public page — WA-42's G3 stays moot for this surface too.
- **Prerequisites on the Career Counselling side** (do not block launch; block the loader swap): institutions carry no latitude/longitude and no career-cluster taxonomy, `cohortYear` is written by the seed and read nowhere so nothing can be sliced by class-of, and scholarship amounts have no home in the schema.
**Owner:** Dev. **Tier:** Blocker.

### ~~WA-44 — Placements visualisation without an island~~ ✅ Locked
**Original question:** The legacy view is a Looker Studio report — a Google-Maps bubble chart plus four charts — embedded by iframe. Four of its charts currently fail with "Data Studio has encountered a system error." Rebuilding it appears to require client-side JavaScript, which hard rule 5 forbids by default.

**Decision (locked, 2026-07-27):** **No island. The map is static SVG rendered at build time.**

- A proportional-symbol map is circles positioned by projected coordinates. Bubble radius scales as **√count** so area encodes the number of students honestly; each circle carries a `<title>` for a native, screen-reader-accessible tooltip. No script, no canvas, no WebGL.
- **Filters are pre-rendered routes**, not client state: `/placements/`, `/placements/2024/`, `/placements/india/`, `/placements/stem/`. Every view is a real URL — shareable, indexable, and it survives a bad mobile connection. This is strictly more capable than the Looker embed for the two things that actually matter to admissions: sharing a link and being found.
- Country split, cluster split, top-institution and multi-year trend views are bar and donut charts — hand-authored SVG, no chart library.
- **Rejected — third-party embed** (Looker Studio, published Sheets): hard rule 4, and it is the exact thing that broke. The page today is six Google iframes and the school owns none of it.
- **Rejected — Google Maps JS:** swaps one Google runtime dependency for another, requires a billing account with a card on file (the $200 credit ended March 2025), and discloses every visitor's IP to Google.
- **Rejected — Leaflet / MapLibre / ECharts island:** ~136 institutions do not need slippy tiles, a tile provider, a CSP exception or a 150 KB+ bundle. Tiles would also add a third-party origin, which rule 4 exists to prevent.
- **Named trigger to revisit:** pilot feedback from the counselling and marketing teams that specifically requires zoom/pan or cross-filtering that pre-rendered routes cannot express. That would be a scoped island on one page, decided here first.
**Owner:** Dev. **Tier:** Blocker.

### ~~WA-45 — Named celebration layer vs aggregate data layer~~ ✅ Locked
**Original question:** Do student names, photographs and grades appear on the placements and results pages? Signed parental consent exists (Part 2), and the school deliberately publishes grades for a limited set of students.

**Decision (locked, 2026-07-27):** **Two layers, separately governed, never merged into one view.**

**The data layer** — map, charts, counts, trends. Institution and cohort level only: no names, no photographs, no per-student grades, no per-student coordinates. Where a single-year cell would fall below the minimum-cohort threshold, **pool multiple years** rather than suppress — the benchmark convention at Cate, SSIS and Calhoun, and it produces a longer, more impressive list as a side effect.

**The celebration layer** — toppers cards, convocation content. Named, photographed, with grades for the limited set the school chooses. Governed by **WA-19** (public-website channel toggle plus the naming flag) and **WA-41**'s logged manual check until SHP exists. Consent is the lawful basis; WA-41 remains the mechanism.

**Cohort scope of the celebration layer (VK, 2026-07-27):** named and photographed content covers **recent cohorts only — 2025 onward**, where consent is documented and traceable. Earlier cohorts back to 2016 are published **aggregate-only**. Rationale: consent records for a 2016 leaver are not reliably retrievable, and an untraceable consent is indistinguishable from none. Grades published in this layer are the **DP score out of 45 on the toppers cards** — the same cut the current results page uses, not a new disclosure.

**Binding conditions:**
1. **Photographs by Cloudflare Images ID, never in git** (hard rule 1). Consent withdrawal must be a delete, not an artefact that survives in every clone forever.
2. **The named layer is data-driven**, so a withdrawal is one content edit — never a hand-built page someone has to remember to unpick.
3. **The two layers never combine on a single page in a way that resolves a size-1 bubble to a named student.** This is the real re-identification vector, and the legacy sheet has it today: a one-student university tile beside a named list is a named disclosure even though no field says so. The current convocation deck carries the same edge — `Northwestern 01`, `BITS Law 01 · $5,284`, `Mesa 01 · $19,475` — which is why WA-45 pools years in the data layer.
4. **Each published field is added to the WA-42 allowlist deliberately** (hard rule 6). Nothing about placements is public by default.
5. **Scholarship figures publish as institution totals or cohort aggregates**, never against an individual.

**Note on who consents.** Graduating students are typically 18+ at the moment of publication, so publication consent is theirs to give; the underlying record was collected while they were minors, under parental consent. WA-19 governs capture, this entry governs publication.
**Owner:** VK / Comms. **Tier:** Blocker.

### ~~WA-46 — Placements campus scoping~~ ✅ Locked
**Original question:** Whether placements and results are a group-level page inherited by every campus (WA-11), or authored per campus. In plain terms: when a visitor opens Placements on the FWGS, FALH or FASV section, do they see the group's combined record, or their own campus's? Only FSK has DP cohorts today (2016–2026); the others have none, so per-campus authoring means three empty pages.

**Decision (locked, VK, 2026-07-27):** **Group-level pooled page, inherited by every campus.** FSK may take an override later if it ever wants a campus-specific cut.
- **Binding condition — campus attribution on every cohort.** FWGS is a Wockhardt joint venture and FALH/FASV are Avadh joint ventures (Part 2). A parent browsing FWGS must not be left to infer that FSK's placements are FWGS's. Each cohort carries its campus, and the page states the group scope plainly.
- When FWGS graduates its first DP cohort it appears in the same view rather than needing a new page.
- Reversible: it is a content-routing choice — one file, moved.
**Owner:** VK. **Tier:** Governance.

### ~~WA-47 — Preschool estate and the early-years template~~ ✅ Locked
**Original question:** Whether the wholly-owned Fountainhead preschools join the group site, and if so where they sit. They carry no PYP/MYP/DP, and WA-35 treated FALH's non-school structure as a one-off exception rather than a category.

**Decision (locked, VK, 2026-07-27):** **The preschool estate is three centres — FALH (Vapi), Adajan (Surat), Vesu (Surat) — and all three are on the group site.** Preschools become a category, not an exception.
- **Each preschool gets its own section** under WA-9 subdirectory canonicals. They are not sub-sections of a school.
- **Linked to the nearest school by geography, not ownership.** A `continuesAt` field renders a "continues at" pathway, keeping the pairing a content decision rather than a hardcoded one. Consistent with WA-10's ruling that ownership structure is irrelevant to URL architecture.
- **New `early-years` template**, deliberately simpler than the WA-35 programme catalogue: age band, duration, days, enquiry CTA. FALH keeps the catalogue because it also runs after-school programmes (WA-31).
- Brand: preschools carry `brand: falh` — the warm hero palette retained per the WA-6 correction of 2026-07-20. No new token file, no schema change.
- **The preschool→school progression is stated explicitly.** The centres have always been connected to the schools operationally; the public sites never said so. `fountainheadpreschools.org` mentions neither Fountainhead School, the IB, nor the group — not on About, Vision or Team. The preschools already teach IB-informed practice (drawing on Froebel, Montessori and Steiner), which makes them the natural on-ramp to PYP. This linkage is the point of folding them in.
- Programme set carried across: Playgroup (2–3 yrs, 2 h 30 m), Pre Nursery (3–4 yrs, 3 h), Nursery (3–4.5 yrs, 3 h), Mixed Age Kindergarten (4–6 yrs, 5 h), Mon–Fri, ratio 1:10.
- **Network positioning is 6 campuses across 3 cities** — FSK, FSM, FWGS, FALH, Adajan, Vesu. FASV is excluded until it launches. The count is explicit data, never derived from the campus-config count (7, including FASV).
- **Do not migrate** the stale 2022–2024 admission cut-off dates, nor the empty `/admission/*` and `/helpdesk-parents-corner/*` scaffolding — stamped `2023-01-06`, never filled.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-48 — Network navigation depth and common-page scoping~~ ✅ Locked
**Original question:** The marketing IA proposal raises the network page set to roughly 9–11 top-level items and splits content between network and campus level. `SiteHeader` renders a flat nav with no submenus, and `navFor()` discards nested pages entirely. Which navigation pattern, and which common pages live where?

**Decision (locked, VK, 2026-07-27):** **Two-level grouped navigation, with mixed inheritance for common pages.**
- **Two-level nav** — roughly six headings with disclosure children. **Zero client JS**, built on the native Popover and `<details>` precedents already in the repo. Gated by WA-21, which this decision forced.
- Nav stays **derived from the resolved matrix** (WA-11). Nesting changes its shape, not its source; navigation must remain unable to drift from real pages.
- **Mixed inheritance.** Reference material is `scope: group-only` — Founders, Accolades, Policies and all policy documents, DPDP. Story pages stay inheritable — About Us, Academics and its children, Results. **Academics must inherit**: it is the only mechanism by which FSK overrides it to add MLC, FHSD and BTEC.
- **Admissions stays a top-level page, not a policy.** The proposal filed it under Policies; it is the primary conversion path and already has its own template with FAQ support. An "Admissions Policy" *document* belongs under Policies; the admissions *journey* does not.
- **Blogs rejected.** News is retained as the single feed — readership does not justify a second surface.
- **Newsletter signup rejected.** No email capture: it would open a new DPDP collection point (WA-22, WA-34) for a channel parents no longer use. A viewable archive is permitted but deprioritised.
- **Campus video is a poster image plus a link out, never an embed.** A YouTube iframe is a third-party embed script and would set cookies. Consistent with WA-18's build-time-static treatment of Instagram. Self-hosted MP4s may use a native `<video>` served from R2.
- **The six parent-facing campus pages group under one "Parent essentials" hub** rather than six nav entries.
- Governing principle (VK): *crisp and informative rather than clunky, with things no one is going to look at.* The proposal is trimmed against this, not implemented item-for-item.

**Addendum — a page that will expand is authored at group level from the start (VK, 2026-07-27).** Settled against the FSK academics additions, and it generalises.
- **Fountainhead High School Diploma (FHSD)** runs at FSK today and **will expand to other campuses**. It is therefore authored at `content/group/academics/fhsd.md`, and campuses that do not yet offer it carry `inherit.exclude: [academics/fhsd]`. Nested-id exclusion is supported and covered by `resolve.test.ts` case 11.
- **Why not campus-only.** Campus-only would fix the canonical at `/kunkni/academics/fhsd/`; expansion would then move the canonical to `/academics/fhsd/` and owe a redirect-map entry (WA-25) *after* the 31 August launch. Group-level authoring makes expansion one deleted line with no URL change. Same reasoning WA-46 applied to placements.
- **Binding condition, inherited from WA-46:** the page must state which campuses actually run the programme. A parent must not infer availability at a campus that does not offer it.
- **The test is expansion, not current spread.** A programme offered at one campus with no plan to expand stays campus-only — **Maverick Learning Centre (MLC)** and **BTEC** remain FSK-only pages. MLC is a taught programme, so it keeps the `programme` template.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-49 — Testimonials scope and consent staging~~ ✅ Locked
**Original question:** The marketing IA proposal asks for student, parent and staff testimonials at both network and campus level. A student testimonial is a child's name and words — WA-19 governs capture, WA-38/WA-41 gate the media, and WA-42 keeps nothing public by default.

**Decision (locked, VK, 2026-07-27):** **Parent and staff testimonials ship at launch. Student testimonials wait.**
- A `type` field is added to `testimonialSchema` now, so student testimonials slot in later without a schema change.
- Student testimonials release only once SHP exists, or under a logged manual consent check on the WA-41 pattern.
- Fields must be added to the WA-42 public allowlist deliberately before anything renders.
- One collection, campus-filtered into pre-rendered routes — no client-side filtering (WA-44 precedent).
**Owner:** VK / Comms. **Tier:** Governance.

---

### ~~WA-50 — A campus abroad is counted on its own~~ ✅ Locked
*(Recorded first as WA-47 on 2026-07-27 and renumbered the same day: the marketing IA restructure independently allocated WA-47…49 on a branch cut from an earlier main. Same decision, new number.)*

**Original question:** WA-44 rolls a constituent school or campus up into its parent brand, so a one-student school clears the minimum-cohort threshold instead of being suppressed. Does that roll-up also apply when the campus is in a **different country** from its parent — Heriot-Watt Dubai under Heriot-Watt (UK), Middlesex Dubai under Middlesex (London)?

**Decision (locked, VK, 2026-07-27):** **No. Roll-up stops at the border.** In VK's words: *"different countries are different campuses, can't count them in the same breath."*
- A campus whose country differs from its parent's is **counted, country-tallied and mapped on its own**, at its own coordinates, in its own country column.
- It remains recorded as that parent's campus, and the page says so ("a campus of Middlesex University London"), because the **degree** genuinely is the parent's. The degree and the destination are two different facts, and only the second is a place.
- Same-country campuses are unaffected: Toronto Mississauga still folds into Toronto. Newark to New Brunswick is 40 km, sub-pixel at world scale; revisit only if a zoomed regional map is drawn.
- **Why it is a Blocker.** Folding Dubai into the UK parent would plot those students in Edinburgh and add them to the UK column — a geographic falsehood of exactly the class this dataset already shipped once (WA-43's retracted coordinates). A counselling team reading "UK: 12" would be reading a number that includes students who never went to the UK.
- Enforced in `sites/group/src/lib/placements-aggregate.ts`, regression-locked in `test/placements-rollup.test.ts` including the invariant that the split **moves** counts and never creates or drops one. The Career Counselling app states the rule where the parent is chosen and flags a cross-border campus on its record.
**Owner:** VK. **Tier:** Blocker.

### ~~WA-51 — A campus is a place; a school is part of the course~~ ✅ Locked
*(Recorded first as WA-48 on 2026-07-27; renumbered for the same collision.)*

**Original question:** The institution reference held one `units` array containing two different kinds of thing — Rutgers *New Brunswick* (a city) alongside NMIMS *Anil Surendra Modi School of Commerce* (a department inside the Mumbai campus). Both were counted the same way. Which of them earns its own record?

**Decision (locked, VK, 2026-07-27):** **Geography decides, not corporate structure.** Same place ⇒ one record.
- A **campus** is a PLACE. Rutgers New Brunswick is not Rutgers Newark. It stays a unit, with its own coordinates, and under WA-50 its own country column when abroad.
- A **school** is part of the COURSE. The student went to Mumbai whether or not it was via Anil Surendra Modi School of Commerce, so it must not be a second place. It moves onto the placement row as `school` — kept, not deleted, because which school a student attended is real counselling signal.
- A **mode of study** is neither. VNSGU "External" and full-time are one campus; a pathway/foundation programme is an entry route. How a student attended belongs on their placement record.
- Applied by hand per unit in `tools/placements-normalise/split-schools-from-campuses.mjs`, **not** by comparing the `city` field — that field is demonstrably wrong (UToronto Mississauga filed as "Toronto", NMIMS Navi Mumbai as "Mumbai", NMIMS's Mukesh Patel school as "Hyderabad" when its own coordinates say Mumbai). 25 units reclassified, 10 kept as campuses, student total unchanged at 820.
**Owner:** VK. **Tier:** Governance.

---

## Part 2 — Settled (confirm & incorporate, don't re-litigate)

- Nucleus 3.0 is being built on Node/TypeScript. Payload colocates cleanly; one developer covers both.
- Alibaug is out of scope entirely — too early to plan for.
- Vapi preschool has launched; the Vapi school site is not yet required.
- `fwgs.in` exists in basic form and needs a rebuild, not a migration.
- `fsmsurat.in` and `fsksurat.in` do not exist and must be built from scratch.
- The group is IB-only today; statutory display is optionality, not a current requirement.
- India Ultimate is governed by its own committee and is a separate entity.
- Written, signed parental photo consent already exists on file across the group.
- FWGS is a Wockhardt joint venture. FALH and FASV are Avadh joint ventures. FSK and FSM are wholly owned.
- FALH is launched and operating; FASV has not launched.
- Development capacity is in place. Engineering is not a constraint on the August date.
- Nucleus 3.0 is under construction, not live. No 3.0 module can be assumed available on 31 August.
- Signed paper photo consent exists across the group; re-papering happens at 2026-27 re-enrolment.
- Four of seven Nucleus integration touchpoints came back already aligned on reconciliation. CAL had already anticipated feeding the public website; FDC-8 had already assigned the enquiry to Admissions.

---

## Part 3 — Corrections to earlier decisions

- **FWGS location corrected 2026-07-27 (VK).** The seeded `content/campuses/fwgs/_campus.yaml` recorded FWGS as Surat, Gujarat, pincode 394510. FWGS is in **Chhatrapati Sambhajinagar, Maharashtra**. Not cosmetic: `jurisdiction` drives the WA-14 statutory block, and board affiliation, recognition authority and fee-regulation committee all differ between the two states. The schema already accepts `maharashtra`, so this is data rather than a rebuild — but the disclosure content is new, and the network story is three cities, not two. Full address supplied by VK the same day (Shendra MIDC, pincode 431154) and applied; the verbatim source string is kept in a comment in `_campus.yaml` because it repeats "Shendra MIDC" and the line1/line2 split needs comms' confirmation. **The Maharashtra statutory content itself is still outstanding** — board, recognition authority and fee-regulation committee.
- **WA-6 page-level brand override approved 2026-07-27 (VK) — not currently required.** Brand resolves per campus: `PageChrome` reads it from the campus config, so a section *inside* a campus cannot carry its own palette. An optional `brand` on `pageSchema` taking precedence was approved so the warm early-years palette could render inside a blue campus. WA-47 then placed preschools in their own sections, which carry `brand: falh` directly — so nothing needs the override today. Approved and recorded; **not built** until something actually requires it.
- **WA-10 domain set extended 2026-07-27 (VK).** "The Village Early Learning Centre" is the former name of Fountainhead Preschool Vesu; records exist. `thevillageelc.in` joins the campus domains that 301 into their canonical path. `fountainheadpreschools.org` takes the same treatment when the preschool sections land — noting that CLAUDE.md defers `.org` migration to September, so the pilot may ship those sections as stubs.
- **WA-6 FWGS colour values revised 2026-07-20 (VK).** The 2025 FWGS Brand Manual specifies the Fountainhead group palette and its FWGS logo uses it; the register's `#1d4f9e`/`#e1232b` were intranet-era values. Web follows the manual; all four campuses now share the group primaries, with JV identity in logo lockups. FALH/FASV real values applied from their manuals the same day (FALH keeps its warm preschool hero per VK).
- **WA-10 mechanism recorded 2026-07-20 (VK).** 301s implemented as GoDaddy Domain Forwarding (DNS stays at the registrar), not Cloudflare zone Redirect Rules. Outcome unchanged: every campus domain 301s to its canonical path. See the mechanism block in WA-10 for accepted consequences.
- **WA-40 condition 1 deviation accepted 2026-07-20 (VK, credential sitting).** Interim Postgres on Railway Singapore for the pilot (team-platform continuity; Railway has no India region). Sunset: India-hosted Postgres at or before `.org` cutover, ahead of launch traffic. Brief DoD 8's "live in India" reads accordingly until then.
- **WA-5 revised 2026-07-19 (ratified by VK at Phase 0 Stage 2).** "Cloudflare Pages" corrected to **Cloudflare Workers with Static Assets** via Workers Builds. The cited precedent (FWGS intranet) was verified to actually run Workers, and the build needs Workers-only features (cron triggers, Hyperdrive, R2 bindings, server endpoints). All original rationale points survive. WA-10's "Pages attaches multiple custom domains" mechanism note will be superseded by the concrete redirect mechanism when the campus domains are configured — to be recorded here at that time.
- **WA-10 revised twice on 2026-07-19.** First revision introduced an ownership-based rule (JVs canonical on own domains). **Superseded by VK:** ownership structure is irrelevant to URL architecture; all campuses are treated identically. Final state is uniform 301 to subdirectory canonical.
- **WA-36 reframed 2026-07-19.** Originally scoped as a photo-consent withdrawal path. Generalised per VK into a platform-level consent primitive and routed to R3.
- **WA-17 narrowed 2026-07-19.** Galleries removed from the CMS tier and carved out to WA-38 following reconciliation finding C1. News and events unchanged.
- **WA-19 revised 2026-07-19.** Original version locked blanket consent, which conflicts with FDC-5's explicit rejection of blanket scope and R3-12 band 3. Revised to single-capture with per-channel enumeration plus a naming flag — resolving C2 without abandoning capture-once.
- **WA-15 and WA-16 revised 2026-07-19.** Both originally assumed live Nucleus endpoints. Interim content-tier authoring added under WA-40 pending 3.0.

---

*Living tracker — updated as decisions are made. Status as of 2026-07-27: 48 of 51 locked; 3 open, all Governance or Deferred tier. No open blockers. All reconciliation items dispositioned. WA-43…46 added 2026-07-27 for the placements/results pilot ahead of the 31 August launch. WA-47…49 added the same day for the marketing IA restructure, which also forced WA-21 and WA-23 closed. WA-50…51 are the placements roll-up rulings, first drafted as WA-47/48 on a parallel branch and renumbered when the two collided — a caution that concurrent branches must not allocate register numbers independently.*
