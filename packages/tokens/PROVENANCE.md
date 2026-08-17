# Token provenance

**Source:** `@fountainhead/design-system` v1.18.0 (`C:\Dev\fountainhead-design-system`, private repo, consumed by Nucleus ERP).
**Vendored:** 2026-07-19, from `css/tokens.css`.

## Why vendored, not a dependency

The design system is `private: true` / unlicensed — no npm registry. A git
dependency would put a standing auth token inside every Cloudflare build for
~500 lines of CSS, and the web build needs an axis the system does not have
(`data-brand`) while using none of its ERP components. Vendoring the primitive
+ semantic layers with a drift guard is the smaller risk.

## What was taken / stripped

- **Taken:** colour ramps (blue/red/yellow/green/neutral), typography
  primitives (Montserrat/Nunito stacks, weights, type scale, leading,
  tracking), space/radius/border/shadow/motion/z/layout, the light-theme
  semantic layer, control sizing.
- **Stripped (ERP-only):** dark theme, `data-density`, `data-profile`
  ("product"/Beacon), data-viz token sets (`diverging-*`, `scale-quality-*`,
  chart chrome, `*-soft` fills), `--fh-font-ui`.
- **Added (web-only):** the `data-brand` axis and brand files, and
  header/footer/hero/eyebrow surface slots.

## Anchors (guarded by `scripts/check-brand-anchors.mjs`)

| Brand | Token | Value |
|---|---|---|
| Fountainhead | `--fh-blue-600` | `#005BAA` |
| Fountainhead | `--fh-red-600` | `#B8292F` |
| Fountainhead | `--fh-yellow-400` | `#F2C418` |
| FWGS / FASV | primary/secondary | group ramp refs (2025 manuals; WA-6 revised 2026-07-20) |
| FALH | `--fh-falh-pink` | `#F04C9A` (+ peach `#F69673`, green `#7FD39F`) |

FALH / FASV: **real values applied 2026-07-20** from the campus brand
manuals ("Brand Guidelines 2025", ©CONTOURS; FALH 39pp via Drive text
extraction, FASV 37pp via page-by-page visual read of the curves-export
PDF). Both manuals specify the Fountainhead primary palette; FALH adds
preschool secondaries (pink `#F04C9A`, peach `#F69673`, green `#7FD39F`)
and keeps its warm yellow hero per VK (schools vs preschools distinction).
FASV takes the standard school treatment; its Avadh identity lives in the
logo. FWGS: the 2025 FWGS Brand Manual likewise specifies the group palette;
VK ratified adoption 2026-07-20 (WA-6 revised) — the intranet-era
`#1d4f9e`/`#e1232b` retired from the web (the intranet itself keeps them).

## Invariants carried from the source system

1. Components read only semantic tokens (`--fh-color-*` etc.), never
   primitives, never literals — enforced by the pre-commit hook and
   `scripts/lint.mjs`.
2. Yellow `#F2C418` is dark-text-only; it fails AA on white.
3. Green is a derived system-state hue — never a brand colour.
4. Brands re-map brand roles + web surface slots only; system states
   (success/warning/danger/info) are identical on every campus.

## Updating

If the design system bumps an anchor: update `base.css`, this file's table,
and the constants in `scripts/check-brand-anchors.mjs` in one commit, citing
the design-system version. The guard failing is the reminder.
