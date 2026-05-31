---
description: Supabase schema & migration guardrails (real users exist)
paths:
  - "supabase/**"
  - "**/migrations/**"
  - "**/*.sql"
---

# Migrations & schema — guardrails

Real users exist. The schema **evolves with migrations**; never wipe/recreate.

- Keep the physical table **`cars`** (domain type `Vehicle` maps over it — ADR-0006). Do not rename.
- Retire the standalone `admins` table → single source of truth is `is_admin` on `users`.
- Deprecate the global `reminder_days` → per-Service-Type `reminder_settings` (JSON). Backfill,
  then stop writing the old column.
- Subscription / entitlement tables are **additive**.
- **Grandfather existing users** onto the **Legacy** plan — they keep their current capabilities
  forever; new Free-plan Quotas (1 Vehicle, 1 Document) apply only to new users.
- RLS stays the access-control mechanism. Don't weaken RLS for convenience.
