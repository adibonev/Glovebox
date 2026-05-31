# ADR-0001 — Monorepo: Expo (mobile) + Next.js (web) + shared `core`

**Status:** Accepted

**Context.** Glovebox needs a web app and native iOS + Android apps (in the stores). The
team is small and already knows React. Push notifications are core value. Maintaining two
fully separate codebases would duplicate logic.

**Decision.** A Turborepo monorepo: `apps/web` (Next.js), `apps/mobile` (Expo / React
Native), and a shared TypeScript package `packages/core` for domain logic, repositories,
types and validation. UI is platform-specific but shares design tokens (`packages/ui`).

**Consequences.** Stay in React/TS; real store apps + reliable push; logic written once.
Slightly more upfront monorepo setup. App-store revenue share applies to in-app purchases
(see ADR-0003).
