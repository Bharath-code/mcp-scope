---
version: alpha
name: MCP Audit
description: Precision-dark design system for MCP Audit — the honest instrument that measures whether Claude can actually use your MCP server's tools.
colors:
  background: "#0A0B0D"
  surface: "#111318"
  surface-raised: "#171A21"
  border: "#23262E"
  border-strong: "#343946"
  text: "#E7EAF0"
  text-secondary: "#8A919E"
  text-muted: "#5C6370"
  accent: "#22D3EE"
  on-accent: "#06181C"
  accent-subtle: "#0B2A31"
  success: "#34D399"
  on-success: "#052E1F"
  warning: "#FBBF24"
  on-warning: "#2E2205"
  error: "#F87171"
  on-error: "#2E0A0A"
  info: "#60A5FA"
  on-info: "#0A1B2E"
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  score:
    fontFamily: JetBrains Mono
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: -0.02em
    fontFeature: tnum
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 24px
  "6": 32px
  "7": 48px
  "8": 64px
  "9": 96px
motion:
  duration-fast: 150ms
  duration-base: 220ms
  duration-slow: 320ms
  ease-out: cubic-bezier(0.16, 1, 0.3, 1)
  ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.h3}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: "#67E3F5"
    textColor: "{colors.on-accent}"
    typography: "{typography.h3}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.h3}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 48px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 48px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.5}"
  chip:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"
    typography: "{typography.mono}"
    rounded: "{rounded.full}"
    padding: 3px 10px
  score-display:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.score}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"
  check-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  link:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 0px
---

# MCP Audit Design System

## Overview

MCP Audit is a measuring device for MCP server maintainers: paste a URL, watch checks stream in, get one honest number. The design must read like lab equipment — precise, calm, and incapable of hype. Its audience is developers who live in dark editors and distrust marketing gloss; the emotional response we want is "this thing is rigorous." Anti-patterns: never a vanity dashboard (gradients, glassmorphism, decorative charts), never SaaS-landing-page enthusiasm (giant emoji, exclamation marks, confetti), never ambiguity about what a number means.

## Colors

A near-black base (`background` #0A0B0D) with two elevation steps (`surface`, `surface-raised`) keeps the report legible for long reading sessions and makes the OG images look native in dark timelines. `accent` is an instrument cyan — the color of oscilloscope traces, not a brand mascot — reserved exclusively for interactive elements and the headline score. Semantic colors carry findings: `success` for passing checks, `warning` for context-tax concerns, `error` for dead-weight tools, `info` for method notes; each has a paired `on-` color guaranteeing legibility when used as a filled surface. Text uses a three-step hierarchy (`text`, `text-secondary`, `text-muted`); all combinations against `background` and `surface` meet WCAG AA. Never use `accent` for decoration — if it isn't clickable or isn't the score, it isn't cyan.

## Typography

Inter carries structure and prose; JetBrains Mono carries everything measured. The rule is absolute: any number, token count, tool name, URL, or code fragment is set in mono — this is the typographic signature of "the honest instrument." `display` is for the landing headline only; `h1` titles a report; `h2`/`h3` structure sections and component labels. `body` at 15px/1.6 is tuned for the long-form report page. `score` (56px mono, tabular numerals) is the hero level — the effective-tools fraction is the product's magic moment and gets the largest type on the page. Never use a serif, and never letter-space uppercase labels beyond +0.05em.

## Layout

Spacing is a 4px-base scale (4 → 96). Density is comfortable, not tight: findings need room to land. The report is a single centered column, max-width 720px for prose and 880px for tables/cards, with `spacing.7` (48px) between major report sections and `spacing.4` (16px) between related rows. Page gutters are `spacing.5` on mobile, `spacing.7` on desktop. No multi-column dashboard grids — the report reads top-to-bottom like a document, which is also what ranks and what screenshots well.

## Elevation & Depth

Borders, never shadows. Depth comes from the three-step surface ladder (`background` → `surface` → `surface-raised`) plus 1px `border` hairlines; `border-strong` marks interactive or focused edges. Shadows on a near-black canvas read as smudges and undermine the instrument feel — a crisp hairline says "machined," a soft glow says "marketing." The single exception: the `input-focus` state adds a 3px `accent` outer ring at 25% opacity, because focus visibility is an accessibility requirement, not decoration.

## Shapes

Small radii signal tools, not toys: `sm` (4px) for chips' inner elements and inline code, `md` (8px) for buttons and inputs, `lg` (12px) for cards and the score display, `full` only for status chips and progress dots. Nothing sharper than 0 is needed and nothing rounder than 12px is permitted on rectangular containers — past that the UI starts smiling, and this product doesn't smile, it reports.

## Motion

Motion carries information or it doesn't exist. The three sanctioned patterns: (1) **streaming checks** — each `check-row` enters with a 220ms ease-out fade-and-rise (8px translateY) as the pipeline emits it, and its status dot pulses while running; (2) **score reveal** — the `score-display` counts up over 320ms with tabular numerals so digits don't jitter; (3) **micro-feedback** — hover/press transitions on interactive elements at 150ms ease-out, buttons compressing to scale(0.98) on press. Durations: `duration-fast` 150ms (hover, press), `duration-base` 220ms (enter/exit), `duration-slow` 320ms (score, section reveal). Easing is `ease-out` for entrances and feedback, `ease-in-out` for anything that moves and returns. All motion is wrapped in `prefers-reduced-motion: reduce` guards that swap animation for instant state change. No parallax, no scroll-jacking, no looping ambient animation — the live pipeline is the show.

## Components

`button-primary` is the accent-filled action (Run audit, Get tune-up) — one per view maximum; hover lightens to #67E3F5, press scales down, disabled drops to 40% opacity with `text-muted` text. `button-secondary` is a `surface-raised` fill with a `border` hairline for everything else. `input` is the product's front door (the URL field): 48px tall, `surface` fill, `border` hairline, focus swaps to `border-strong` plus the accent ring; error state uses `error` border with a mono caption below. `card` groups report sections on `surface` with `rounded.lg` and a hairline. `chip` is the status vocabulary — recolor it with semantic pairs (`success`/`on-success` etc.) for pass/warn/fail; always mono text. `score-display` renders the headline fraction in `score` type with the denominator in `text-muted`. `check-row` is the streaming pipeline line item: mono text, status dot left, duration right. `link` is accent-colored with underline on hover only.

## Do's and Don'ts

**Do**
- Set every number, tool name, and token count in JetBrains Mono with tabular numerals.
- Reserve cyan for interactive elements and the headline score — nothing else.
- Use hairline borders and the surface ladder for depth; keep motion under 320ms and information-bearing.
- State findings bluntly in UI copy: "4 of 14 tools were never selected."
- Honor `prefers-reduced-motion` on every animation.
- Keep one primary button per view.

**Don't**
- No gradients, glassmorphism, glows, or drop shadows.
- No vanity scores or grade letters — always show the raw fraction and method link.
- No decorative animation: no parallax, no confetti, no ambient loops.
- No serif type, no emoji in findings, no exclamation marks in system copy.
- No radius above 12px on rectangular containers.
- Never soften an error state — failed checks are `error` red, not amber.
