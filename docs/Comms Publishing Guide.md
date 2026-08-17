# Comms Publishing Guide

How website content gets written, edited and published. Ratified by VK
2026-07-20: **drafting happens wherever comms likes (Google Docs), final
delivery happens through GitHub** — either the Keystatic editor in the
browser, or markdown files directly.

---

## The two content lanes

| Lane | What | How it's edited |
|---|---|---|
| Tier A pages | philosophy, academics, admissions, fees, facilities, transport, about… | Markdown files under `content/` — via Keystatic's "Pages" view or a pull request |
| Tier B collections | news, events, testimonials, galleries, FALH programmes | Keystatic collections UI |

Every page currently owed is **stubbed in draft** (`draft: true`) with a
`TODO (comms)` note saying exactly what's needed — several are pre-filled
from print collateral and only need review. Run `pnpm report` (or read the
build log) to see the live list: the **"✍ in draft"** lines are the
outstanding content, per campus. Publishing = changing `draft: true` to
`draft: false`.

## The comms workflow (once GitHub mode is live)

1. Draft and approve copy in Google Docs as usual.
2. Open **`/keystatic`** on the site → **Sign in with GitHub**.
3. Find the page/collection entry → paste the final copy → **Save**.
4. Keystatic asks where to save: choose **"Create a new branch"** (never
   commit to main — it's protected anyway) → it opens a **pull request**.
5. The PR gets an automatic **preview URL** — check the page there.
6. VK (or a reviewer) merges → the site deploys itself.

Images are **never uploaded in Keystatic** (there are no image fields, by
design — hard rule 1): request an upload via `pnpm media` (engineering)
and paste the returned image ID. Any photo with an identifiable child goes
through the WA-38/WA-41 consent check first — no exceptions.

## One-time setup (VK, ~15 minutes)

1. **Create the GitHub App** — on a dev machine:
   `KEYSTATIC_GITHUB=1 pnpm keystatic`, open `http://localhost:4321/keystatic`,
   and follow the **"Setup GitHub App"** wizard (it creates the app and
   writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
   `KEYSTATIC_SECRET` into `sites/group/.env`).
2. **Add the production callback**: GitHub → Settings → Developer settings
   → GitHub Apps → the new app → add callback URL
   `https://fountainhead-web.fsgroup.workers.dev/api/keystatic/github/oauth/callback`
   (add the fountainheadschools.org variant at `.org` cutover).
3. **Install the app** on the `fountainhead-web` repository.
4. **Worker secrets** (Workers & Pages → fountainhead-web → Settings →
   Variables and Secrets): add the three values from step 1 as Secrets.
5. **Build variable** (Settings → Build → Variables):
   `KEYSTATIC_GITHUB=1` → retry the latest build. `/keystatic` is now live.
6. **Comms access**: each comms member needs a GitHub account added as a
   repo **collaborator (Write)**. Keystatic's own security model applies —
   the editor is useless without GitHub sign-in + repo permission.

## Ground rules (from CLAUDE.md — the hooks enforce them anyway)

- No image/video files in the repo, ever — Cloudflare Images IDs only.
- Galleries: every image carries the consent-check log (who checked,
  when, against which consent reference). The editor requires it.
- Policies change via `content/policies/` only — the website and the PDF
  export come from the same file (WA-13); don't maintain copies elsewhere.
