# Architecture — Glovebox

Target architecture for the rebuild. Vocabulary: **Module** (interface + implementation),
**Seam** (where an interface lives; behaviour swappable without editing in place),
**Adapter** (a concrete thing satisfying an interface at a seam), **deep module** (lots of
behaviour behind a small interface). Domain terms come from `UBIQUITOUS_LANGUAGE.md`.

## Principle
Business rules live in **`packages/core`** as pure, testable modules. The apps (`apps/web`,
`apps/mobile`) and Supabase Edge Functions are thin shells that call into `core`. Infrastructure
(Supabase, Stripe, RevenueCat, NHTSA) sits behind **seams** so it can be faked in tests.

```
apps/web  ─┐
apps/mobile ┼─→  packages/core  ─→  [seams/adapters]  ─→  Supabase / Stripe / RevenueCat / NHTSA
edge fns  ─┘        (pure domain)
```

## Modules in `packages/core`

### Reminder (build first, TDD — ADR-0007)
- `dueReminders(serviceRecords, windows, today): Reminder[]` — **pure**, no I/O, no `Date.now()`
  inside (pass `today`). Given Service Records + per-Service-Type Reminder Windows + a date,
  returns the Reminders that are due.
- `expiryStatus(serviceRecord, today): 'Valid' | 'ExpiringSoon' | 'Expired'`.
- Delivery is **not** in this module — it returns data. A cron Edge Function calls
  `dueReminders`, then hands results to delivery adapters (`EmailReminder`, `PushNotification`).
- This replaces the legacy "split brain" (hourly Express `setInterval` + daily cron + a missing
  `check-reminders` function). One home, fully tested.

### Repositories (seam over Supabase)
- Interfaces: `VehicleRepository`, `ServiceRecordRepository`, `DocumentRepository`, `UserRepository`.
- **Supabase adapter** for production; **in-memory adapter** for tests (two adapters = a real seam).
- One error-handling policy here — not repeated `if (error) throw` in every call site.
- All snake_case ⇄ camelCase mapping happens in **one** place (generate types from the Supabase
  schema; map at this edge). The DB table is `cars`; the domain type is `Vehicle`.

### Entitlements & billing (ADR-0003)
- `entitlementsFor(user): Entitlement[]` derived from the active **Plan** (Free / Pro / Legacy).
- Resolved **server-side**: Stripe (web) and RevenueCat (App Store / Play) webhooks → an Edge
  Function → writes the active entitlement to Supabase. Clients read one flag; never compute
  gating from a raw price/plan string.
- `Quota` checks (1 Vehicle, 1 Document on Free) and `Paywall` triggers live in `core`.

### VinDecoder (seam)
- Interface `VinDecoder.decode(vin): VehicleDraft`. Production adapter = an Edge Function calling
  NHTSA; test adapter = a fake. Never call an external API directly from the data layer.

## Apps are thin
- React contexts/hooks are **glue** over `core` use-cases — not god-contexts holding unrelated
  state. Split by concern (vehicles / reminders / documents). The old `DashboardContext` (332
  LOC) and `AuthContext` (339 LOC) are the anti-pattern to avoid.
- Web and mobile **share `core`**; UI is platform-specific (healthy duplication), styled from
  shared tokens in `packages/ui`.

## Testing
- Vitest. The **interface is the test surface**: test `core` modules through their public APIs
  with the in-memory adapters. Tests should survive internal refactors.
- TDD loop: one test → minimal code → refactor on green. Never refactor while red.

## What we are NOT doing
- No separate Express/Nest API server (the legacy `server/` is deleted, not ported).
- No new database/auth stack (Supabase stays — ADR-0002).
- No renaming the `cars` table (ADR-0006).
