# CLAUDE.md — Glovebox

Glovebox is a **freemium SaaS for Bulgarian drivers**: track each vehicle's documents and
obligations (Civil Liability / ГО, Casco, Vignette, Roadworthiness Inspection, Vehicle Tax,
Fire Extinguisher, Maintenance), show an expiry status, and **remind before they expire**
(email + push). It is a **real commercial product**. Launch is **Bulgaria-only, Bulgarian UI**.

## Read these first (imported context)
@docs/PROJECT_PLAN.md
@docs/ARCHITECTURE.md
@docs/UBIQUITOUS_LANGUAGE.md
@brand/BRAND.md

> Locked decisions live in `docs/adr/`. **Do not re-litigate an ADR**; if a real conflict
> appears, raise it explicitly and propose superseding the ADR.

## Stack (locked — ADR-0001, ADR-0002)
- **Monorepo:** Turborepo + pnpm.
- **Web:** Next.js. **Mobile:** Expo (React Native) → iOS + Android (store builds via EAS).
- **Shared:** TypeScript package `packages/core` — Supabase access, domain types, business
  logic, validation. The single source of truth for behavior.
- **Backend:** Supabase (Postgres + RLS + Auth + Storage) + **Edge Functions** (billing
  webhooks, push). **No separate API server.**
- **UI:** NativeWind + shadcn/ui (web); React Native + NativeWind (mobile); shared design
  tokens in `packages/ui`. Motion: Framer Motion (web) / Reanimated (mobile).
- **Language:** TypeScript everywhere. **Tests:** Vitest. **Method:** red-green-refactor TDD.

## Target repo layout
```
apps/web        Next.js app (marketing + dashboard)
apps/mobile     Expo app
packages/core   domain logic, repositories, types, validation  ← most code lives here
packages/ui     shared design tokens + cross-platform primitives
supabase/       migrations + edge functions
docs/  brand/   context for humans and Claude
```

## Non-negotiables (guardrails)
- **Keep Supabase.** Never replace Auth / Storage / RLS. (ADR-0002)
- Domain term is **Vehicle**; the physical DB table stays **`cars`** — map at the `core`
  edge. **Do not rename the table.** (ADR-0006)
- **Do not** reintroduce the old Express server or duplicate the data layer. One source of
  truth = `packages/core`.
- Feature gating reads a single **Entitlement** resolved **server-side** (Stripe +
  RevenueCat webhooks → Supabase). Never gate on a raw plan/price string in the client. (ADR-0003)
- **Use the names in `docs/UBIQUITOUS_LANGUAGE.md`** (Vehicle, Service Record, Service Type,
  Reminder, Reminder Window, Expiry Status, Entitlement, Plan, Subscription, Quota, Paywall,
  Legacy plan, Billing Channel). Avoid the listed aliases (no bare "service" for the entity, etc.).
- BG-only, **Bulgarian UI**; keep all user-facing strings centralized / i18n-ready — never hardcode. (ADR-0004)

## Build order (PROJECT_PLAN §9)
Phase 0 scaffold → **Phase 1 core + migrations (Reminder module first, TDD)** → Phase 2 web →
Phase 3 mobile (push + Apple Sign-In) → Phase 4 billing → Phase 5 launch (legal, monitoring).

## TDD — first tracer bullet (ADR-0007)
Start `packages/core` with the **Reminder** module:
`dueReminders(serviceRecords, windows, today): Reminder[]` — **pure, no I/O**. Write ONE test
→ minimal impl → repeat. Test names use ubiquitous-language terms. Test behavior through the
public interface, not implementation details.

## Commands (fill in as you scaffold)
- install: `pnpm install`
- dev (web): `pnpm --filter web dev`   ·   dev (mobile): `pnpm --filter mobile start`
- test: `pnpm test`   ·   typecheck: `pnpm typecheck`   ·   lint: `pnpm lint`

<important if="editing supabase migrations, schema, or anything under supabase/">
- Real users exist. Schema **evolves via migrations**, never a clean wipe.
- Keep the physical table name **`cars`** (domain term Vehicle maps over it).
- Retire the `admins` table → use `is_admin` on users. Deprecate global `reminder_days` →
  per-Service-Type `reminder_settings`. Subscription/entitlement tables are **additive**.
- Preserve existing users: grandfather them onto the **Legacy** plan (keep capabilities forever).
</important>

## Brand
Cinematic premium: ink `#07100C` + emerald `#14503A` + copper `#C4954C`; Fraunces (display) +
Hanken Grotesk (UI) + JetBrains Mono (labels). Logo = the "Glovebox" wordmark with a
steering-wheel "o"; app icon = `brand/glovebox-wheel.svg`. Details in `@brand/BRAND.md`.
