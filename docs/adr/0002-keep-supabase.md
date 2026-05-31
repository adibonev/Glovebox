# ADR-0002 — Keep Supabase as the backend

**Status:** Accepted

**Context.** The legacy app already uses Supabase (Postgres + RLS + Auth + Google OAuth +
Storage). Real users exist. The "low quality" feeling came from the frontend, not Supabase.

**Decision.** Keep the **same Supabase project**. Evolve the schema with migrations. Add
**Edge Functions** for server-side concerns (billing webhooks, push). No separate API server.
Do NOT rebuild Auth/Storage/RLS or migrate to another DB (e.g. Neon).

**Consequences.** Preserves logins, files and OAuth; minimal infra to maintain. Server-side
logic is constrained to Edge Functions (sufficient here).
