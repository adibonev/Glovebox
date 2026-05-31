# Glovebox

A digital glovebox for Bulgarian drivers: track your vehicle's documents and obligations
(ГО, Casco, vignette, inspection, tax, fire extinguisher, maintenance), see expiry statuses,
and get reminded — email + push — before anything expires. Web + iOS + Android. Freemium.

This repository is **prepared for Claude Code**: the context, decisions, architecture and
brand are written down so Claude Code can build with full context from session one.

## Where things are
- **`CLAUDE.md`** — project memory Claude Code auto-loads each session (the "constitution").
- **`docs/PROJECT_PLAN.md`** — full plan, decisions, phased roadmap.
- **`docs/ARCHITECTURE.md`** — target architecture (`packages/core`, seams, modules).
- **`docs/UBIQUITOUS_LANGUAGE.md`** — canonical domain terms (use these names).
- **`docs/adr/`** — Architecture Decision Records (locked decisions; don't re-litigate).
- **`.claude/rules/`** — path-scoped rules (TS style, migrations, billing) that load only when
  you touch matching files.
- **`brand/`** — logo SVGs + `BRAND.md` (palette, fonts, logo usage).

## Using with Claude Code (VS Code)
1. Open this folder in VS Code and launch Claude Code.
2. Claude Code reads `CLAUDE.md` automatically (and the `@`-imported docs). The `.claude/rules`
   load when you edit matching files.
3. Optional: run `/init` to let Claude Code refresh `CLAUDE.md` after the code exists, and
   `/memory` to manage auto-memory.
4. Start with **Phase 0** (scaffold the Turborepo) then **Phase 1**: build the **Reminder**
   module in `packages/core` test-first (see ADR-0007). Ask Claude Code to work in small
   red-green-refactor steps.

## Suggested first prompts for Claude Code
- "Read CLAUDE.md and docs/. Scaffold the Phase 0 monorepo (Turborepo + pnpm): `apps/web`
  (Next.js), `apps/mobile` (Expo), `packages/core`, `packages/ui`, `supabase/`. Set up Vitest
  in `core`. Don't add features yet."
- "In `packages/core`, build the Reminder module with TDD per ADR-0007: start with one failing
  test for `dueReminders` using terms from UBIQUITOUS_LANGUAGE.md, then minimal code."
- "Define the `VehicleRepository` interface with a Supabase adapter and an in-memory adapter for
  tests. Map the `cars` table to the `Vehicle` domain type at this seam (ADR-0006)."

## Stack
Turborepo · Next.js (web) · Expo/React Native (mobile) · TypeScript `packages/core` ·
Supabase (Postgres + RLS + Auth + Storage + Edge Functions) · NativeWind + shadcn/ui ·
Stripe + RevenueCat · Vitest + TDD.
EOF
