---
description: TypeScript, React, NativeWind/shadcn conventions for Glovebox
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Code style — TypeScript / React / UI

- **TypeScript strict.** No `any` without a comment justifying it. Prefer types derived from
  the Supabase schema (generated) over hand-written duplicates.
- **Domain names from `docs/UBIQUITOUS_LANGUAGE.md`.** e.g. `Vehicle` (not Car), `ServiceRecord`
  (not bare "service"), `ReminderWindow`, `ExpiryStatus`, `Entitlement`, `Plan`, `Subscription`.
- **Business logic goes in `packages/core`**, not in components. Components/hooks are thin glue.
  No god-contexts — split state by concern.
- **Styling:** Tailwind/NativeWind classes from shared tokens. On web, shadcn/ui primitives,
  **re-themed** to the brand (see brand/BRAND.md) — never ship default-shadcn look.
- **No browser storage in shared logic.** Persisted state goes through Supabase via a repository.
- **Pure functions are the default** for anything testable; pass `today`/clock in, don't call
  `Date.now()` deep inside logic.
- Keep modules **deep**: a small interface over real behaviour. Run tests after each refactor.
